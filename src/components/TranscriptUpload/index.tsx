// src/components/TranscriptUpload/index.tsx
import { 
    Box, Button, VStack, Text, Input, Select, 
    useToast, FormControl, FormLabel, 
    FormHelperText, Progress, Flex, IconButton
  } from '@chakra-ui/react'
  import { useCallback, useState } from 'react'
  import { useDropzone } from 'react-dropzone'
  import { Session } from '@supabase/supabase-js'
  import { FiX } from 'react-icons/fi'
  import { supabase } from '@/lib/supabase-client'
  import { analyzeTranscript } from '@/lib/claude'

  type UploadFormData = {
    title: string
    customer_name: string
    call_type: string
  }
  
  interface TranscriptUploadProps {
    session: Session | null;
    onClose: () => void;
  }
  
  export default function TranscriptUpload({ session, onClose }: TranscriptUploadProps) {
    // Check authentication at the component level
    if (!session?.user) {
      return (
        <Box p={4}>
          <Text>Please sign in to upload transcripts.</Text>
          <Button mt={4} onClick={onClose}>Close</Button>
        </Box>
      )
    }
  
    const toast = useToast()
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [formData, setFormData] = useState<UploadFormData>({
      title: '',
      customer_name: '',
      call_type: ''
    })
  
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (!session?.user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to upload transcripts',
          status: 'error'
        })
        return
      }
  
      if (!formData.title || !formData.customer_name || !formData.call_type) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields',
          status: 'error'
        })
        return
      }
  
      const file = acceptedFiles[0]
      setUploading(true)
      
      let analysisRecord: any = null; // Add this to track the analysis record
  
      try {
        // Validate file size
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error('File size too large. Maximum size is 10MB.');
        }
  
        // First create the analysis record with initial metadata
        const { data: analysis, error: dbError } = await supabase
          .from('analyses')
          .insert({
            user_id: session.user.id,
            title: formData.title,
            customer_name: formData.customer_name,
            call_type: formData.call_type,
            status: 'processing',
            file_type: file.type,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
  
        if (dbError) throw dbError
  
        if (!analysis?.id) {
          throw new Error('Failed to create analysis record')
        }
  
        analysisRecord = analysis; // Store the analysis record
  
        // Process file upload and Claude analysis in parallel
        const filePath = `${analysis.id}/${file.name}`
        
        try {
          console.log('Starting parallel processing');
          const [uploadResult, claudeResults] = await Promise.all([
            supabase.storage
              .from('transcripts')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              }),
            
            // For PDFs, we'll analyze the raw text content
            // PDF extraction will happen in background
            file.text().then(async text => {
              if (!text) {
                throw new Error('Failed to read file content');
              }
              
              return analyzeTranscript(text, {
                customer_name: formData.customer_name,
                call_type: formData.call_type,
                objectives: 'Analyze customer call'
              });
            })
          ])
  
          console.log('Parallel processing complete:', {
            uploadSuccess: !uploadResult.error,
            hasClaudeResults: !!claudeResults
          });
  
          if (uploadResult.error) throw uploadResult.error
  
          // Update analysis record with results
          const { error: updateError } = await supabase
            .from('analyses')
            .update({
              status: 'completed',
              transcript_url: filePath,
              results: claudeResults,
              completed_at: new Date().toISOString(),
              // text_content will be null for PDFs, populated by cron job
              text_content: file.type !== 'application/pdf' ? await file.text() : null
            })
            .eq('id', analysis.id)
  
          if (updateError) throw updateError
  
          toast({
            title: 'Analysis complete',
            description: 'Your transcript has been processed successfully',
            status: 'success'
          })
  
          // Reset form and close
          setFormData({
            title: '',
            customer_name: '',
            call_type: ''
          })
          onClose()
  
        } catch (parallelError: any) {
          // Handle parallel processing errors
          if (analysisRecord?.id) {
            await supabase
              .from('analyses')
              .update({
                status: 'error',
                error_message: parallelError.message || 'Unknown error'
              })
              .eq('id', analysisRecord.id)
          }
          throw parallelError
        }
  
      } catch (error: any) {
        console.error('Upload error details:', {
          message: error.message,
          type: typeof error,
          stack: error.stack
        });
        
        toast({
          title: 'Upload failed',
          description: error.message || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
  
        // Update analysis status if it was created
        if (analysisRecord?.id) {
          await supabase
            .from('analyses')
            .update({
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', analysisRecord.id)
        }
      } finally {
        setUploading(false)
        setProgress(0)
      }
    }, [formData, session, toast, onClose])
  
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'text/plain': ['.txt'],
        'application/json': ['.json'],
        'application/pdf': ['.pdf']
      },
      maxFiles: 1
    })
  
    return (
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="xl" fontWeight="bold">Upload Transcript</Text>
          <IconButton
            aria-label="Close"
            icon={<FiX />}
            variant="ghost"
            onClick={onClose}
          />
        </Flex>
  
        <Box>
          <FormControl isRequired mb={4}>
            <FormLabel>Title</FormLabel>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
              placeholder="Q4 Review Call"
            />
          </FormControl>
  
          <FormControl isRequired mb={4}>
            <FormLabel>Customer Name</FormLabel>
            <Input
              value={formData.customer_name}
              onChange={(e) => setFormData(f => ({ ...f, customer_name: e.target.value }))}
              placeholder="Acme Corp"
            />
          </FormControl>
  
          <FormControl isRequired mb={4}>
            <FormLabel>Call Type</FormLabel>
            <Select
              value={formData.call_type}
              onChange={(e) => setFormData(f => ({ ...f, call_type: e.target.value }))}
              placeholder="Select call type"
            >
               <option value="">All Call Types</option>
                      <option value="discovery">Discovery</option>
                      <option value="qbr">QBR</option>
                      <option value="followup">Follow-up</option>
                      <option value="other">Other</option>
            </Select>
          </FormControl>
        </Box>
  
        <Box
          {...getRootProps()}
          p={6}
          border="2px"
          borderColor={isDragActive ? 'accent.500' : 'gray.200'}
          borderStyle="dashed"
          borderRadius="md"
          bg={isDragActive ? 'brand.50' : 'white'}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            borderColor: 'accent.500'
          }}
        >
          <input {...getInputProps()} />
          <VStack spacing={2}>
            <Text textAlign="center" color={isDragActive ? 'accent.700' : 'gray.600'}>
              Drag and drop your transcript file here, or{' '}
              <Text
                as="span"
                color="accent.500"
                textDecoration="underline"
                _hover={{
                  color: 'accent.600'
                }}
              >
                click to select
              </Text>
            </Text>
            <Text fontSize="sm" color="gray.500">
              Supported formats: .txt, .json, .pdf
            </Text>
          </VStack>
        </Box>
  
        {uploading && (
          <Box>
            <Text mb={2}>Uploading... {Math.round(progress)}%</Text>
            <Progress value={progress} size="sm" colorScheme="blue" />
          </Box>
        )}
      </VStack>
    )
  }