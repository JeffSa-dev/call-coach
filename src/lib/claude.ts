// lib/claude.ts

import { Anthropic } from '@anthropic-ai/sdk';
import { RateLimiter } from 'limiter';

// Types for transcript analysis
interface AnalysisMetadata {
  customer_name: string;
  call_type: string;
  objectives: string;
}

interface AnalysisResult {
  summary: string;
  value_articulation: {
    strengths: Array<{ text: string; timestamp?: string }>;
    opportunities: Array<{ text: string; timestamp?: string }>;
  };
  competitive_positioning: {
    strengths: Array<{ text: string; timestamp?: string }>;
    opportunities: Array<{ text: string; timestamp?: string }>;
  };
  expansion_opportunities: Array<{ description: string; timestamp?: string }>;
}

// Types for coaching conversation
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Types for our API
export type TranscriptMetadata = {
  duration: number;
  participants: number;
  context?: string;
  meetingType?: string;
};

// Rate limiting configuration - more specific rules
const globalLimiter = new RateLimiter({
  tokensPerInterval: 50,    // 50 requests
  interval: "hour"         // per hour
});

const burstLimiter = new RateLimiter({
  tokensPerInterval: 5,     // 5 requests
  interval: "minute"       // per minute
});

// API authentication and configuration
const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

// Add debug logging
console.log('Claude API Key status:', {
  exists: !!CLAUDE_API_KEY,
  length: CLAUDE_API_KEY?.length || 0,
  prefix: CLAUDE_API_KEY?.substring(0, 4) || 'none'
});

const MODEL = 'claude-3-haiku-20240307';

// Create client with security measures
const claudeClient = new Anthropic({
  apiKey: CLAUDE_API_KEY || '',  // Ensure we always pass a string
  dangerouslyAllowBrowser: true
});

// Enhanced rate limiting and validation
async function makeClaudeRequest(requestFn: () => Promise<any>) {
  try {
    // Check both rate limits
    const [hasHourlyToken, hasBurstToken] = await Promise.all([
      globalLimiter.tryRemoveTokens(1),
      burstLimiter.tryRemoveTokens(1)
    ]);

    if (!hasHourlyToken) {
      throw new Error('Hourly rate limit exceeded. Please try again later.');
    }

    if (!hasBurstToken) {
      throw new Error('Too many requests. Please wait a minute and try again.');
    }

    // Validate API key
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key is not configured.');
    }

    return await requestFn();
  } catch (error: any) {
    if (error instanceof Anthropic.AnthropicError) {
      // Handle API-specific errors
      const errorMessage = error.message || 'Unknown Claude API error';
      
      // Use error.error?.status or error.status based on the error structure
      const status = error.error?.status || error.status;
      
      if (status === 401) {
        throw new Error('Authentication failed. Check your API key.');
      } else if (status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later.');
      } else if (status === 500) {
        throw new Error('Claude API server error. Please try again later.');
      }
      
      throw new Error(`Claude API error: ${errorMessage}`);
    }
    
    throw new Error(`Error communicating with Claude: ${error.message}`);
  }
}

// Update the analyzeTranscript function
export async function analyzeTranscript(
  text: string, 
  metadata: AnalysisMetadata
): Promise<AnalysisResult> {
  console.log('Starting transcript analysis:', {
    textLength: text.length,
    metadata
  });

  const prompt = `You are an expert Customer Success Manager coach. Analyze this transcript and provide insights in the following JSON format:

{
  "summary": "Brief overview of the key points discussed in the call",
  "value_articulation": {
    "strengths": [
      {"text": "Specific strength point identified", "timestamp": "optional timestamp if found"}
    ],
    "opportunities": [
      {"text": "Specific opportunity for improvement", "timestamp": "optional timestamp if found"}
    ]
  },
  "competitive_positioning": {
    "strengths": [
      {"text": "Competitive advantage mentioned", "timestamp": "optional timestamp if found"}
    ],
    "opportunities": [
      {"text": "Area where competition might have advantage", "timestamp": "optional timestamp if found"}
    ]
  },
  "expansion_opportunities": [
    {"description": "Specific opportunity for expansion or upsell", "timestamp": "optional timestamp if found"}
  ]
}

TRANSCRIPT:
\${transcript}

Remember to:
1. Focus on specific, actionable insights
2. Include direct quotes or examples from the transcript where relevant
3. Provide timestamps if available in the transcript
4. Return ONLY valid JSON matching the exact format above`;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, metadata, prompt })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Analysis API error:', data);
      throw new Error(data.error || 'Analysis failed');
    }

    try {
      const parsedResult = JSON.parse(data.content[0].text) as AnalysisResult;
      return parsedResult;
    } catch (parseError) {
      console.error('Failed to parse Claude response:', data.content[0].text);
      throw new Error('Failed to parse analysis results');
    }

  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Get coaching response from Claude
export async function getChatResponse(
  messages: Message[], 
  analysisContext?: AnalysisResult
): Promise<string> {
  // Create system prompt with analysis context if available
  let systemPrompt = `
    You are an expert Customer Success Manager coach, providing feedback and guidance.
    Your goal is to help the CSM improve their client conversations through constructive coaching.
    Be supportive but direct, and provide specific, actionable advice.
  `;

  if (analysisContext) {
    systemPrompt += `
      CONTEXT FROM PREVIOUS CALL ANALYSIS:
      
      Overall assessment: ${analysisContext.summary}
      
      Value articulation strengths:
      ${analysisContext.value_articulation.strengths.map(s => `- ${s.text}`).join('\n')}
      
      Value articulation opportunities:
      ${analysisContext.value_articulation.opportunities.map(o => `- ${o.text}`).join('\n')}
      
      Competitive positioning strengths:
      ${analysisContext.competitive_positioning.strengths.map(s => `- ${s.text}`).join('\n')}
      
      Competitive positioning opportunities:
      ${analysisContext.competitive_positioning.opportunities.map(o => `- ${o.text}`).join('\n')}
      
      Expansion opportunities:
      ${analysisContext.expansion_opportunities.map(o => `- ${o.description}`).join('\n')}
    `;
  }

  return makeClaudeRequest(async () => {
    const response = await claudeClient.post('/messages', {
      model: MODEL,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7, // Higher temperature for more natural conversation
      max_tokens: 1000
    });

    return response.data.content[0].text;
  });
}

// Export a function to validate API connection
export async function validateApiConnection(): Promise<boolean> {
  try {
    await claudeClient.get('/models');
    return true;
  } catch (error) {
    console.error('Claude API connection failed:', error);
    return false;
  }
}