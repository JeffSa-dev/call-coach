// src/pages/api/test-claude.ts - test the connection to the claude api 

import type { NextApiRequest, NextApiResponse } from 'next';
import { Anthropic } from '@anthropic-ai/sdk';

type ResponseData = {
  status: string;
  message: string;
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
    // Simple connection test
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Connected to Claude API'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Claude API'
    });
  }
}