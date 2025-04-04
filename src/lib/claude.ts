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

  const prompt = `You are a Customer Success Post-Call Coach specializing in B2B SaaS customer interactions. Your task is to analyze a transcript from a recent customer call conducted by a Customer Success Manager (CSM) and provide targeted feedback and coaching.

Here is the transcript you need to analyze:

<transcript>
{{TRANSCRIPT}}
</transcript>

Your analysis should cover the following areas:
1. Call Summary
2. Value Articulation
3. Competitive Positioning
4. Expansion Opportunities
5. Coaching Opportunities
6. Role Playing Scenarios

For each area, wrap your thought process inside <detailed_analysis> tags before formulating your final response. Within these tags:
a) List key quotes or moments from the transcript
b) Identify strengths and areas for improvement
c) Provide specific recommendations

Pay close attention to specific quotes, timestamps (if available), and key moments in the conversation.

When analyzing the transcript, consider the following:
- Transitions from tactical to strategic discussions
- Questions that uncover business challenges or priorities
- Responses to customer concerns or objections
- Sharing of success stories and evidence
- Clarity of next steps and ownership
- Effectiveness of executive-level communication
- Addressing or overlooking risk signals

Maintain a coaching tone throughout your analysis, focusing on business outcomes and customer lifetime value drivers. Balance tactical feedback with strategic guidance.

After completing your analysis, provide your insights in the following JSON format:

{
  "summary": {
    "call_type": "",
    "customer_name": "",
    "attendees": [],
    "summary": [
      {"text": ""}
    ]
  },
  "value_articulation": {
    "strengths": [
      {"text": "", "timestamp": ""}
    ],
    "opportunities": [
      {"text": "", "timestamp": ""}
    ]
  },
  "competitive_positioning": {
    "strengths": [
      {"text": "", "timestamp": ""}
    ],
    "opportunities": [
      {"text": "", "timestamp": ""}
    ]
  },
  "expansion_opportunities": [
    {"text": "", "timestamp": ""}
  ],
  "coaching_opportunities": [
    {"text": ""}
  ],
  "role_playing": [
    {
      "text": "",
      "customer_role": "",
      "example_scenario_prompt": ""
    }
  ]
}

Ensure that your JSON output:
1. Includes specific, actionable insights
2. Contains direct quotes or examples from the transcript where relevant
3. Provides timestamps if available in the transcript
4. Focuses on 1-2 highest impact improvements for coaching opportunities
5. Suggests specific role-playing scenarios for skills improvement

Begin your analysis now, using <detailed_analysis> tags for each section before providing the final JSON output.`;

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