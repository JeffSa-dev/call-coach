import { NextApiRequest, NextApiResponse } from 'next';
import { getChatResponse } from '@/lib/claude';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug logging for API key
    console.log('API Key status in chat route:', {
      exists: !!process.env.ANTHROPIC_API_KEY,
      length: process.env.ANTHROPIC_API_KEY?.length || 0,
      prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 4) || 'none'
    });

    const { messages, analysisContext } = req.body;
    
    // Log the request data
    console.log('Chat API request:', {
      messageCount: messages.length,
      hasAnalysisContext: !!analysisContext,
      analysisContextKeys: analysisContext ? Object.keys(analysisContext) : []
    });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages format');
    }

    if (!analysisContext) {
      throw new Error('Missing analysis context');
    }

    const response = await getChatResponse(messages, analysisContext);
    
    // Log successful response
    console.log('Chat API success:', {
      responseLength: response.length
    });

    res.status(200).json({ response });
  } catch (error: any) {
    // Log detailed error information
    console.error('Chat API error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    // Send more detailed error response
    res.status(500).json({ 
      error: error.message,
      details: error.cause || 'Unknown error occurred'
    });
  }
} 