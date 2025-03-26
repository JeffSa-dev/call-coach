// src/pages/api/test-conversation-history.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages = [] } = req.body as { messages: Message[] };

    // Add system context if it's a new conversation
    const contextMessage = messages.length === 0 ? [{
      role: 'system' as const,
      content: `You are a sales coaching assistant. Help improve sales calls by providing specific, actionable advice.`
    }] : [];

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [...contextMessage, ...messages]
    });

    return res.status(200).json({
      response: message.content[0].text,
      messageCount: messages.length + 1
    });
  } catch (error: any) {
    console.error('Error in conversation test:', error);
    return res.status(500).json({ 
      error: error.message || 'Unknown error'
    });
  }
}