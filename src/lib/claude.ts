// lib/claude.ts

import { Anthropic } from '@anthropic-ai/sdk';
import { RateLimiter } from 'limiter';

// Types for transcript analysis
interface AnalysisMetadata {
  customer_name: string;
  call_type: string;
  objectives: string;
  csm_name: string;
}

interface AnalysisResult {
  summary: {
    text: string;
  };
  relationship_building: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  customer_health_assessment: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  value_demonstration: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  strategic_account_management: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  competitive_positioning: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  top_3_strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
  top_3_opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  role_playing_summary: Array<{ text: string; timestamp?: string; quote?: string }>;
  role_playing_examples: Array<{ text: string; customer_role: string; example_scenario_prompt: string }>;
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
  csm_name: string;
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
  // Validate required fields
  if (!metadata.csm_name?.trim()) {
    throw new Error('CSM name is required for analysis');
  }

  // Truncate text to a reasonable size (about 50K tokens)
  const MAX_CHARS = 200000; // ~50K tokens
  const truncatedText = text.length > MAX_CHARS 
    ? text.slice(0, MAX_CHARS) + '...' 
    : text;

  // Add detailed logging
  console.log('Starting transcript analysis:', {
    originalLength: text.length,
    truncatedLength: truncatedText.length,
    estimatedTokens: Math.round(truncatedText.length / 4),
    wasTruncated: truncatedText.length < text.length,
    metadata: {
      ...metadata,
      csm_name: metadata.csm_name.trim() // Log trimmed name
    }
  });

  // Log prompt template size
  const promptTemplate = `You are a Customer Success Post-Call Coach specializing in B2B SaaS customer interactions. Analyze this customer call transcript and provide structured feedback in JSON format. Speak directly to ${metadata.csm_name} using first-person address ("you" instead of "the CSM").

Here is the transcript you need to analyze:

<transcript>
${truncatedText}
</transcript>

CRITICAL REQUIREMENTS:
1. Your response MUST be a valid JSON object
2. For quotes, use the EXACT text from the transcript - do not encode or transform it
3. NEVER fabricate quotes - use exact quotes from the transcript
4. Include timestamps for each observation
5. Assign scores (1-5) based on this scale:
   1 = Significant improvement needed (missed critical opportunity)
   2 = Needs improvement (basic attempt made but ineffective)
   3 = Satisfactory (met basic expectations)
   4 = Strong (exceeded expectations)
   5 = Exceptional (masterful execution)
6. If a particular area or skill was not relevant or not covered during the call, indicate this by using "N/A" in the text field and null for the score

For example, if there were no competitor mentions during the call:

Competitive Intelligence & Positioning
- Competitor mentions identification: N/A
  "This topic did not come up during the call."
  Quote: N/A

IMPORTANT QUOTE HANDLING:
- Use the exact text from the transcript for quotes
- Do not encode or transform the text
- Do not use Unicode escape sequences
- Do not use HTML entities
- Keep the original punctuation and spacing

Provide your analysis in this exact JSON structure:

{
  "summary": {
    "text": "Overall call summary (2-3 sentences)",
    "score": 0.0
  },
  "relationship_building": {
    "score": 0.0,
    "strengths": [
      {
        "text": "Description of strength",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ],
    "opportunities": [
      {
        "text": "Description of opportunity",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ]
  },
  "customer_health_assessment": {
    "score": 0.0,
    "strengths": [
      {
        "text": "Description of strength",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ],
    "opportunities": [
      {
        "text": "Description of opportunity",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ]
  },
  "value_demonstration": {
    "score": 0.0,
    "strengths": [
      {
        "text": "Description of strength",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ],
    "opportunities": [
      {
        "text": "Description of opportunity",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ]
  },
  "strategic_account_management": {
    "score": 0.0,
    "strengths": [
      {
        "text": "Description of strength",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ],
    "opportunities": [
      {
        "text": "Description of opportunity",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ]
  },
  "competitive_positioning": {
    "score": 0.0,
    "strengths": [
      {
        "text": "Description of strength",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ],
    "opportunities": [
      {
        "text": "Description of opportunity",
        "timestamp": "timestamp from call",
        "quote": "exact quote from transcript"
      }
    ]
  },
  "top_3_strengths": [
    {
      "text": "Description of strength",
      "timestamp": "timestamp from call",
      "quote": "exact quote from transcript"
    }
  ],
  "top_3_opportunities": [
    {
      "text": "Description of opportunity",
      "timestamp": "timestamp from call",
      "quote": "exact quote from transcript"
    }
  ],
  "role_playing_summary": [
    {
      "text": "Description of role playing scenario",
      "timestamp": "timestamp from call",
      "quote": "exact quote from transcript"
    }
  ],
  "role_playing_examples": [
    {
      "text": "Description of example",
      "timestamp": "timestamp from call",
      "customer_statement": "exact quote from transcript",
      "csm_response": "exact quote from transcript",
      "improved_response": "suggested improved response",
      "explanation": "explanation of why this is better"
    }
  ]
}

Remember:
1. Your response must be ONLY the JSON object
2. Do not include any text outside the JSON structure
3. All quotes must be exact from the transcript
4. Include timestamps for each observation
5. Calculate section scores as averages of their subsections`;

  console.log('Prompt template size:', {
    templateLength: promptTemplate.length,
    estimatedTokens: Math.round(promptTemplate.length / 4)
  });

  try {
    const requestBody = { text: truncatedText, metadata, prompt: promptTemplate };
    console.log('Request body size:', {
      bodyLength: JSON.stringify(requestBody).length,
      estimatedTokens: Math.round(JSON.stringify(requestBody).length / 4)
    });

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Analysis API error:', data);
      
      // Handle token limit error specifically
      if (data.error?.includes('prompt is too long')) {
        throw new Error('Transcript is too long. Please try a shorter section or contact support.');
      }
      
      throw new Error(data.error || 'Analysis failed');
    }

    try {
      const responseText = data.content[0].text;
      
      // Clean the response text more carefully
      const cleanJson = responseText
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\r/g, '') // Remove carriage returns
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\\n/g, ' ') // Replace escaped newlines
        .replace(/\\r/g, '') // Replace escaped carriage returns
        .replace(/\\t/g, ' ') // Replace escaped tabs
        .trim();

      // Try to parse the cleaned response
      try {
        const parsedResult = JSON.parse(cleanJson) as AnalysisResult;
        
        // Validate required fields
        const requiredFields = [
          'summary',
          'relationship_building',
          'customer_health_assessment',
          'value_demonstration',
          'strategic_account_management',
          'competitive_positioning',
          'top_3_strengths',
          'top_3_opportunities',
          'role_playing_summary',
          'role_playing_examples'
        ];

        const missingFields = requiredFields.filter(field => !(field in parsedResult));
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields);
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        return parsedResult;
      } catch (parseError) {
        console.error('Failed to parse cleaned JSON:', {
          originalText: responseText,
          cleanedText: cleanJson,
          error: parseError
        });
        
        // If direct parse fails, try to extract from tags
        const jsonMatch = responseText.match(/<json>([\s\S]*?)<\/json>/);
        if (!jsonMatch) {
          // Try one more time with the original text
          try {
            const parsedResult = JSON.parse(responseText) as AnalysisResult;
            return parsedResult;
          } catch (finalError) {
            console.error('Failed to parse original response:', {
              responseText,
              error: finalError
            });
            throw new Error('No valid JSON found in response');
          }
        }
        
        const jsonContent = jsonMatch[1].trim();
        const parsedResult = JSON.parse(jsonContent) as AnalysisResult;
        return parsedResult;
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', {
        responseText: data.content[0].text,
        error: parseError
      });
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
      
      Overall assessment: ${analysisContext.summary.text}
      
      Value articulation strengths:
      ${analysisContext.value_demonstration.strengths.map(s => `- ${s.text}`).join('\n')}
      
      Value articulation opportunities:
      ${analysisContext.value_demonstration.opportunities.map(o => `- ${o.text}`).join('\n')}
      
      Competitive positioning strengths:
      ${analysisContext.competitive_positioning.strengths.map(s => `- ${s.text}`).join('\n')}
      
      Competitive positioning opportunities:
      ${analysisContext.competitive_positioning.opportunities.map(o => `- ${o.text}`).join('\n')}
      
      Expansion opportunities:
      ${analysisContext.role_playing_examples.map(o => `- ${o.example_scenario_prompt}`).join('\n')}
    `;
  }

  return makeClaudeRequest(async () => {
    const response = await claudeClient.post('/messages', {
      model: MODEL,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.9, // Higher temperature for more natural conversation
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