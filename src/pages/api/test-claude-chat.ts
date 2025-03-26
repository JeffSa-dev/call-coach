// src/pages/api/test-claude-chat.   ts
// scripts/test-claude-chat.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Anthropic } from '@anthropic-ai/sdk';

type ResponseData = {
  status: string;
  message: string;
  response?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      status: 'error',
      message: 'API key not configured'
    });
  }

  try {
    console.log('Testing Claude chat response...');
    
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 100,
      messages: [
        { 
          role: 'user', 
          content: 'Hello, I need help improving how I communicate value to customers.' 
        }
      ]
    });

    console.log('✅ Chat response received');
    
    return res.status(200).json({
      status: 'success',
      message: 'Chat response received',
      response: response.content[0].text
    });
  } catch (error) {
    console.error('❌ Error during chat test:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get chat response'
    });
  }
}