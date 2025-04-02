import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase-client';
import { PDFExtract } from 'pdf.js-extract';

// Add Vercel cron authentication
const CRON_SECRET = process.env.CRON_SECRET;

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Choose your region
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify the request is from Vercel Cron
  if (req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting PDF extraction job');
    
    // Get analyses that need PDF extraction
    const { data: pendingAnalyses, error: queryError } = await supabase
      .from('analyses')
      .select('*')
      .eq('file_type', 'application/pdf')
      .is('text_content', null)
      .limit(5);

    console.log(`Found ${pendingAnalyses?.length || 0} pending analyses`);

    if (queryError) throw queryError;

    const results = [];
    for (const analysis of pendingAnalyses || []) {
      try {
        // Download PDF from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('transcripts')
          .download(analysis.transcript_url);

        if (downloadError) throw downloadError;

        // Extract text from PDF
        const pdfExtract = new PDFExtract();
        const data = await pdfExtract.extractBuffer(await fileData.arrayBuffer());
        const text = data.pages.map(page => page.content).join(' ');

        // Update analysis with extracted text
        const { error: updateError } = await supabase
          .from('analyses')
          .update({ 
            text_content: text,
            updated_at: new Date().toISOString()
          })
          .eq('id', analysis.id);

        if (updateError) throw updateError;

        results.push({
          id: analysis.id,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error processing PDF ${analysis.id}:`, error);
        results.push({
          id: analysis.id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('PDF extraction job completed:', {
      processed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length
    });

    return res.status(200).json({
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('PDF extraction job failed:', error);
    return res.status(500).json({ error: error.message });
  }
} 