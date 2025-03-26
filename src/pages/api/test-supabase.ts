// pages/api/supabase-test.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type Data = {
  status: string
  message: string
  data?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Supabase environment variables are not set'
    })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .rpc('get_current_time')

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Could not verify database connection',
        error: error.message
      })
    }
    
    return res.status(200).json({ 
      status: 'success', 
      message: 'Successfully connected to Supabase',
      data: data
    })
  } catch (error: any) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Supabase connection failed', 
      error: error.message
    })
  }
}