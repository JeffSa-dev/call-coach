// src/components/TranscriptUpload/index.tsx
import { 
    Box, Button, VStack, Text, Input, Select, 
    useToast, FormControl, FormLabel, 
    FormHelperText, Progress
  } from '@chakra-ui/react'
  import { useCallback, useState } from 'react'
  import { useDropzone } from 'react-dropzone'
  import { createClient } from '@supabase/supabase-js'
  
  type UploadFormData = {
    title: string
    customer_name: string
    call_type: string
  }
  
  export default function TranscriptUpload() {
    const toast = useToast()
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [formData, setFormData] = useState<UploadFormData>({
      title: '',
      customer_name: '',
      call_type: ''
    })
  
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
  
      const file = acceptedFiles[0]
      if (!formData.title || !formData.customer_name || !formData.call_type) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all fields before uploading',
          status: 'error'
        })
        return
      }
  
      setUploading(true)
      setProgress(0)
  
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
  
        // Create analysis record
        const { data: analysis, error: dbError } = await supabase
          .from('analyses')
          .insert([{
            title: formData.title,
            customer_name: formData.customer_name,
            call_type: formData.call_type,
            status: 'uploaded',
            file_type: file.type
          }])
          .select()
          .single()
  
        if (dbError) throw dbError
  
        // Upload file
        const filePath = `transcripts/${analysis.id}/${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('transcripts')
          .upload(filePath, file, {
            onUploadProgress: (progress) => {
              setProgress((progress.loaded / progress.total) * 100)
            }
          })
  
        if (uploadError) throw uploadError
  
        // Update analysis with file URL
        const { error: updateError } = await supabase
          .from('analyses')
          .update({
            transcript_url: filePath,
            status: 'processing'
          })
          .eq('id', analysis.id)
  
        if (updateError) throw updateError
  
        // Trigger analysis processing
        await fetch('/api/analysis/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysisId: analysis.id })
        })
  
        toast({
          title: 'Upload successful',
          description: 'Your transcript is being processed',
          status: 'success'
        })
  
        // Reset form
        setFormData({
          title: '',
          customer_name: '',
          call_type: ''
        })
  
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'An error occurred',
          status: 'error'
        })
      } finally {
        setUploading(false)
        setProgress(0)
      }
    }, [formData, toast])
  
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