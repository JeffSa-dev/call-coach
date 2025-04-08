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
      prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 4) || 'none',
      envKeys: Object.keys(process.env)
    });

    const { messages, analysisContext } = req.body;
    
    // Log the request data
    console.log('Chat API request:', {
      messageCount: messages?.length || 0,
      hasAnalysisContext: !!analysisContext,
      analysisContextKeys: analysisContext ? Object.keys(analysisContext) : [],
      firstMessage: messages?.[0]?.content?.substring(0, 100) || 'none'
    });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    if (!analysisContext) {
      return res.status(400).json({ error: 'Missing analysis context' });
    }

    console.log('Calling getChatResponse...');
    const response = await getChatResponse(messages, analysisContext);
    console.log('getChatResponse completed successfully');
    
    // Log successful response
    console.log('Chat API success:', {
      responseLength: response.length,
      responsePreview: response.substring(0, 100)
    });

    return res.status(200).json({ response });
  } catch (error: any) {
    // Log detailed error information
    console.error('Chat API error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      type: error.type,
      status: error.status,
      response: error.response
    });

    // Send more detailed error response
    return res.status(500).json({ 
      error: error.message || 'Unknown error occurred',
      details: error.cause || 'No additional details available',
      type: error.type || 'Unknown error type'
    });
  }
} 