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
    metadata
  });

  // Log prompt template size
  const promptTemplate = `You are a Customer Success Post-Call Coach specializing in B2B SaaS customer interactions. Analyze this customer call transcript and provide direct, actionable feedback speaking directly to the CSM using first-person address ("you" instead of "the CSM").

Here is the transcript you need to analyze:

<transcript>
${truncatedText}
</transcript>

For each observation, include specific timestamps from the call and a 1-5 score based on the following scale:
1 = Significant improvement needed (missed critical opportunity)
2 = Needs improvement (basic attempt made but ineffective)
3 = Satisfactory (met basic expectations)
4 = Strong (exceeded expectations)
5 = Exceptional (masterful execution)

Provide your feedback in the following format:

1. Call Summary (2-3 direct sentences on overall effectiveness)
   Overall Score: [Average of 5 section scores, rounded to 1 decimal]
   "Overall, the call was ... You did a good job of ... You could have done better by ..."
2. Relationship Building 
   - Executive presence demonstration: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] demonstrate executive presence when..."
   - Stakeholder engagement: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] engage with stakeholders when..."
   - Next step establishment: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] establish clear next steps when..."
   Section Score: [Average of 3 subsection scores, rounded to 1 decimal]
3. Customer Health Assessment
   - Understood customer's current business challenges: [Score 1-5] [timestamp]
   - Identified success metrics that matter to the customer: [Score 1-5] [timestamp]
   - Assessed adoption levels and usage patterns: [Score 1-5] [timestamp]
   Section Score: [Average of 3 subsection scores, rounded to 1 decimal]
4. Value Demonstration
   - Business outcome connection: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] connect our product to business outcomes when..."
   - ROI quantification: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] quantify ROI when..."
   - Success story sharing: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] share relevant success stories when..."
   Section Score: [Average of 3 subsection scores, rounded to 1 decimal]
5. Strategic Account Management 
   - Growth opportunity identification: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] identify growth opportunities when..."
   - Renewal risk addressing: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] address renewal risks when..."
   - Stakeholder mapping: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] map stakeholders when..."
   Section Score: [Average of 3 subsection scores, rounded to 1 decimal]
6. Competitive Intelligence & Positioning
   - Competitor mentions identification: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] identify competitor mentions when..."
   - Solution differentiation: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] differentiate our solution when..."
   - Proactive value positioning: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] proactively position our unique value when..."
   - Competitive risk probing: [Score 1-5] [timestamp]
     "You [effectively/missed opportunities to] probe for competitive risks when..."
   Section Score: [Average of 4 subsection scores, rounded to 1 decimal]  
7. Top 3 Strengths
   1. [Strength 1]: [timestamp]
      "You effectively... This strengthened the customer relationship by..."
   2. [Strength 2]: [timestamp]
      "You effectively... This strengthened the customer relationship by..."
   3. [Strength 3]: [timestamp]
      "You effectively... This strengthened the customer relationship by..."
8. Top 3 Opportunies
   1. [Area 1]: [timestamp]
      "You missed an opportunity to... Next time, try..."
   2. [Area 2]: [timestamp]
      "You missed an opportunity to... Next time, try..."
   3. [Area 3]: [timestamp]
      "You missed an opportunity to... Next time, try..."
// 9. Competitive Defense Playbook
 //  - When you hear: "[Actual customer statement about competitor from call]"
 //    Try saying: "[Improved response that effectively positions against competitor]"
   
//    - Listen for these competitive signals:
//      * [Signal 1]
//      * [Signal 2]
//      * [Signal 3]
   
//    - Key differentiators to emphasize with this account:
//      * [Differentiator 1]: [How it specifically addresses this customer's needs]
//      * [Differentiator 2]: [How it specifically addresses this customer's needs]
//      * [Differentiator 3]: [How it specifically addresses this customer's needs]
9. Role-Playing Scenario Summary: Role Playing Scenarios (specific scenarios that could be acted out to improve the call)
10. Role-Playing Scenario Examples: Opportunity to improve
    
    At [timestamp], this exchange occurred:
    Customer: "[Exact customer statement from transcript]"
    You: "[Your exact response from transcript]"
    
    A more effective approach would be:
    Customer: "[Same customer statement]"
    You: "[Improved response with stronger competitive positioning]"
    
    Why This Works Better:
    [Brief explanation of why this approach is more effective]


Maintain a coaching tone throughout your analysis, focusing on practical advice to defend against competitive threats while building long-term value for the customer. 

<analysis>
[Your detailed analysis]
</analysis>

<json>
{
  "summary": {
    "summary": [{"text": ""}]
  },
  "relationship_building": {
    "strengths": [{"text": "", "timestamp": ""}],
    "opportunities": [{"text": "", "timestamp": ""}]
  },
  "customer_health_assessment": {
    "strengths": [{"text": "", "timestamp": ""}],
    "opportunities": [{"text": "", "timestamp": ""}]
  },
  "value_demonstration": {
    "strengths": [{"text": "", "timestamp": ""}],
    "opportunities": [{"text": "", "timestamp": ""}]
  },
  "strategic_account_management": {
    "strengths": [{"text": "", "timestamp": ""}],
    "opportunities": [{"text": "", "timestamp": ""}]
  },
  "competitive_positioning": {
    "strengths": [{"text": "", "timestamp": ""}],
    "opportunities": [{"text": "", "timestamp": ""}]
  },
 "top_3_strengths": [{"text": "", "timestamp": ""}],
 "top_3_opportunities": [{"text": "", "timestamp": ""}],
 "role_playing_summary": [{"text": "", "timestamp": ""}],
 "role_playing_examples": [{"text": "", "customer_role": "", "example_scenario_prompt": ""}]
},
</json>

Focus on:
1. Key strengths and opportunities
2. Specific quotes with timestamps
3. Actionable recommendations`;

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
      
      // Extract JSON from between <json> tags
      const jsonMatch = responseText.match(/<json>([\s\S]*?)<\/json>/);
      if (!jsonMatch) {
        throw new Error('No JSON section found in response');
      }
      
      const jsonContent = jsonMatch[1].trim();
      const parsedResult = JSON.parse(jsonContent) as AnalysisResult;
      
      // Store the detailed analysis if needed
      const analysisMatch = responseText.match(/<analysis>([\s\S]*?)<\/analysis>/);
      if (analysisMatch) {
        console.log('Detailed analysis:', analysisMatch[1].trim());
      }
      
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