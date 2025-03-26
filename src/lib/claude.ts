// lib/claude.ts

import { Anthropic } from '@anthropic-ai/sdk';

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

// API authentication and configuration
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const API_VERSION = '2023-06-01'; // Update this to the latest version
const MODEL = 'claude-3-opus-20240229'; // Or your preferred Claude model

const claudeClient = new Anthropic({
  apiKey: CLAUDE_API_KEY,
  baseURL: 'https://api.anthropic.com/v1',
  version: API_VERSION,
});

// Error handling wrapper for API calls
async function makeClaudeRequest(requestFn: () => Promise<any>) {
  try {
    return await requestFn();
  } catch (error: any) {
    if (error instanceof Anthropic.AnthropicError) {
      // Handle API-specific errors
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;
      
      if (status === 401) {
        throw new Error('Authentication failed. Check your API key.');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (status === 500) {
        throw new Error('Claude API server error. Please try again later.');
      }
      
      throw new Error(`Claude API error (${status}): ${message}`);
    }
    
    // For non-Anthropic errors
    throw new Error(`Error communicating with Claude: ${error.message}`);
  }
}

// Analyze transcript using Claude
export async function analyzeTranscript(
  transcript: string, 
  metadata: AnalysisMetadata
): Promise<AnalysisResult> {
  const systemPrompt = `
    You are an expert Customer Success Manager coach analyzing a customer call transcript.
    
    CONTEXT:
    - Customer: ${metadata.customer_name}
    - Call Type: ${metadata.call_type}
    - Objectives: ${metadata.objectives}
    
    Analyze the following transcript for:
    1. Value articulation - how well the CSM connects product to business outcomes
    2. Competitive positioning - how the CSM handles competitor mentions
    3. Expansion opportunities - potential areas for account growth
    
    Provide a structured analysis with specific timestamps where relevant.
    Format your response as valid JSON with the following structure:
    {
      "summary": "Overall assessment of the call",
      "value_articulation": {
        "strengths": [{"text": "Strength description", "timestamp": "MM:SS"}],
        "opportunities": [{"text": "Improvement area", "timestamp": "MM:SS"}]
      },
      "competitive_positioning": {
        "strengths": [{"text": "Strength description", "timestamp": "MM:SS"}],
        "opportunities": [{"text": "Improvement area", "timestamp": "MM:SS"}]
      },
      "expansion_opportunities": [
        {"description": "Opportunity description", "timestamp": "MM:SS"}
      ]
    }
  `;

  const userMessage = `TRANSCRIPT:\n${transcript}\n\nPlease analyze this transcript.`;

  return makeClaudeRequest(async () => {
    const response = await claudeClient.post('/messages', {
      model: MODEL,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.2, // Lower temperature for more structured output
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    try {
      const content = response.data.content[0].text;
      return JSON.parse(content) as AnalysisResult;
    } catch (error) {
      throw new Error('Failed to parse Claude response as JSON');
    }
  });
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