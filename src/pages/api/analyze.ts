import { Anthropic } from '@anthropic-ai/sdk';
import { NextApiRequest, NextApiResponse } from 'next';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Reduce MAX_CHARS to be well under the 200K token limit
const MAX_CHARS = 400000; // About 100K tokens (very conservative estimate)

function truncateText(text: string): string {
  console.log('Original text length:', text.length);
  
  // Take first chunk at sentence boundary
  const truncated = text.slice(0, MAX_CHARS);
  // Find last period to avoid cutting mid-sentence
  const lastPeriod = truncated.lastIndexOf('.');
  const cleanTruncated = lastPeriod > 0 ? truncated.slice(0, lastPeriod + 1) : truncated;
  
  console.log('Truncated text length:', cleanTruncated.length);
  return cleanTruncated;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, metadata, prompt } = req.body;

    if (!text || !metadata || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Truncate if necessary
    const truncatedText = truncateText(text);
    
    console.log('Processing transcript:', {
      originalLength: text.length,
      truncatedLength: truncatedText.length,
      wasTruncated: truncatedText.length < text.length,
      estimatedTokens: Math.round(truncatedText.length / 4) // rough estimate
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.2,
      messages: [{
        role: 'user',
        content: prompt.replace('${transcript}', truncatedText)
      }]
    });

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Analysis error:', {
      message: error.message,
      type: error.type,
      status: error.status,
      details: error.toString()
    });
    
    return res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
} 