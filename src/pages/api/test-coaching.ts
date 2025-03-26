// src/pages/api/test-coaching.ts

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the analysis data
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .limit(1)
      .single();
    
    if (analysisError) throw analysisError;
    
    if (!analysis) {
      return res.status(404).json({
        error: 'No analysis found'
      });
    }

    // Create a coaching prompt using the analysis data
    const prompt = `Based on this ${analysis.call_type} call analysis:

Summary: ${analysis.results.summary}

Value Articulation:
Strengths: ${analysis.results.value_articulation.strengths.map(s => s.text).join(', ')}
Opportunities: ${analysis.results.value_articulation.opportunities.map(o => o.text).join(', ')}

Competitive Positioning:
Strengths: ${analysis.results.competitive_positioning.strengths.map(s => s.text).join(', ')}
Opportunities: ${analysis.results.competitive_positioning.opportunities.map(o => o.text).join(', ')}

What are the top 3 actionable recommendations for improvement?`;

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return res.status(200).json({
      coachingResponse: message.content[0].text,
      analysisData: analysis
    });
  } catch (error: any) {
    console.error('Error in coaching test:', error);
    return res.status(500).json({ 
      error: error.message || 'Unknown error',
      details: error.details || {}
    });
  }
}