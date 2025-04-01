import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { analyzeTranscript } from '@/lib/claude'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const supabase = createServerSupabaseClient({ req, res })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { analysisId } = req.body

    if (!analysisId) {
      return res.status(400).json({ message: 'Analysis ID is required' })
    }

    // Get the analysis record
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return res.status(500).json({ 
        message: 'Failed to fetch analysis',
        error: fetchError.message 
      })
    }

    // Debug log the analysis record
    console.log('Analysis record:', {
      id: analysis.id,
      transcript_url: analysis.transcript_url,
      status: analysis.status
    })

    // Update status to processing
    const { error: updateError } = await supabase
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId)
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return res.status(500).json({ message: 'Failed to update analysis status' })
    }

    try {
      // Get PDF from storage using the stored transcript_url
      if (!analysis.transcript_url) {
        throw new Error('No transcript URL found in analysis record')
      }

      const { data: pdfData, error: downloadError } = await supabase.storage
        .from('transcripts')
        .download(analysis.transcript_url)

      if (downloadError) {
        console.error('Download error:', downloadError)
        throw new Error(`Failed to download PDF: ${JSON.stringify(downloadError)}`)
      }

      if (!pdfData) {
        throw new Error('No file data received')
      }

      // Convert Blob to text for Claude
      const pdfText = await pdfData.text()

      // Send to Claude for analysis
      const results = await analyzeTranscript(pdfText, {
        customer_name: analysis.customer_name,
        call_type: analysis.call_type,
        objectives: analysis.objectives || 'Analyze customer call'
      })

      // Update analysis with results
      const { error: resultError } = await supabase
        .from('analyses')
        .update({
          status: 'completed',
          results,
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisId)

      if (resultError) {
        throw new Error('Failed to save analysis results: ' + resultError.message)
      }

      return res.status(200).json({
        message: 'Analysis completed successfully',
        analysisId,
        results
      })

    } catch (processingError) {
      console.error('Processing error details:', processingError)
      
      // Update analysis status to error
      await supabase
        .from('analyses')
        .update({
          status: 'error',
          error_message: processingError instanceof Error ? processingError.message : 'Processing failed'
        })
        .eq('id', analysisId)

      throw processingError
    }

  } catch (error) {
    console.error('Processing error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}