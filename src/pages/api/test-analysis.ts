// src/pages/api/test-analysis.ts   

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log environment variables (redacted)
  console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: 'Supabase credentials not configured'
    });
  }

  try {
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check all three tables
    const { data: analyses, error: analysesError } = await supabase
      .from('analyses')
      .select('*')
      .limit(5);

    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);

    const { data: messages, error: messagesError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    return res.status(200).json({
      status: 'connected',
      tables: {
        analyses: {
          count: analyses?.length || 0,
          error: analysesError?.message,
          data: analyses || []
        },
        conversations: {
          count: conversations?.length || 0,
          error: conversationsError?.message,
          data: conversations || []
        },
        messages: {
          count: messages?.length || 0,
          error: messagesError?.message,
          data: messages || []
        }
      }
    });
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Unknown error'
    });
  }
}