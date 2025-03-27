import { 
  Box, Container, Heading, VStack, Text, Table, Thead, Tbody, Tr, Th, Td, 
  Spinner, Badge, Button, Select, HStack, IconButton, Tooltip, 
  useDisclosure, Collapse, Input
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { createClient } from '@supabase/supabase-js'
import { FaEye, FaDownload, FaShare, FaFilter, FaUpload } from 'react-icons/fa'
import { useRouter } from 'next/router'
import TranscriptUpload from '@/components/TranscriptUpload'

type Analysis = {
  id: string
  title: string
  customer_name: string
  call_type: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  created_at: string
  completed_at: string | null
  results: {
    summary: string
    competency_scores?: {
      proving_value: number
      communicating_value: number
      competitive_positioning: number
      expansion_opportunities: number
    }
  } | null
}

export default function Home() {
  const router = useRouter()
  const { isOpen, onToggle } = useDisclosure()
  const { isOpen: isUploadOpen, onToggle: onUploadToggle } = useDisclosure()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const itemsPerPage = 10

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    callType: '',
    searchTerm: ''
  })

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        let query = supabase
          .from('analyses')
          .select('*', { count: 'exact' })
          
        // Apply filters
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.callType) query = query.eq('call_type', filters.callType)
        if (filters.searchTerm) {
          query = query.or(`title.ilike.%${filters.searchTerm}%,customer_name.ilike.%${filters.searchTerm}%`)
        }

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(page * itemsPerPage, (page + 1) * itemsPerPage - 1)

        if (error) throw error
        setAnalyses(data || [])
        setTotalPages(Math.ceil((count || 0) / itemsPerPage))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyses()
  }, [page, filters])

  const handleAction = async (action: 'view' | 'download' | 'share', analysis: Analysis) => {
    switch (action) {
      case 'view':
        router.push(`/analysis/${analysis.id}`)
        break
      case 'download':
        // Implement download logic
        break
      case 'share':
        // Implement share logic
        break
    }
  }

  return (
    <Layout>
      <Box minH="100vh">
        <Container 
          maxW="container.xl" 
          py={{ base: 4, md: 8 }}
          px={{ base: 6, md: 8 }}
        >
          <VStack spacing={{ base: 4, md: 8 }} align="stretch">
            {/* Add Upload Button */}
            <HStack 
              justify="space-between" 
              flexDir={{ base: 'column', sm: 'row' }}
              spacing={{ base: 4, sm: 0 }}
            >
              <Heading 
                as="h1" 
                size={{ base: "lg", md: "xl" }}
                color="brand.900"
              >
                Recent Calls
              </Heading>
              <HStack>
                <Button
                  colorScheme="blue"
                  leftIcon={<FaUpload />}
                  onClick={onUploadToggle}
                >
                  Upload Transcript
                </Button>
                <IconButton
                  aria-label="Toggle Filters"
                  icon={<FaFilter />}
                  onClick={onToggle}
                />
              </HStack>
            </HStack>

            {/* Upload Form */}
            <Collapse in={isUploadOpen}>
              <Box p={6} bg="white" rounded="lg" shadow="md">
                <TranscriptUpload />
              </Box>
            </Collapse>

            {/* Responsive Filters */}
            <Collapse in={isOpen}>
              <Box p={4} bg="white" rounded="md" shadow="sm">
                <VStack spacing={4} align="stretch">
                  <Input
                    placeholder="Search..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                  />
                  <HStack 
                    spacing={4} 
                    flexDir={{ base: 'column', md: 'row' }}
                    align={{ base: 'stretch', md: 'center' }}
                  >
                    <Select
                      value={filters.status}
                      onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="processing">Processing</option>
                      <option value="uploaded">Uploaded</option>
                      <option value="error">Error</option>
                    </Select>
                    <Select
                      value={filters.callType}
                      onChange={(e) => setFilters(f => ({ ...f, callType: e.target.value }))}
                    >
                      <option value="">All Call Types</option>
                      <option value="discovery">Discovery</option>
                      <option value="qbr">QBR</option>
                      <option value="followup">Follow-up</option>
                      <option value="other">Other</option>
                    </Select>
                  </HStack>
                </VStack>
              </Box>
            </Collapse>

            {/* Results Display */}
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" color="accent.500" />
              </Box>
            ) : error ? (
              <Box textAlign="center" py={8} color="red.500">
                {error}
              </Box>
            ) : analyses.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="brand.600">No analyses found</Text>
              </Box>
            ) : (
              <>
                {/* Desktop Table View */}
                <Box display={{ base: 'none', lg: 'block' }} overflowX="auto" shadow="md" rounded="lg" bg="white">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Title</Th>
                        <Th>Customer</Th>
                        <Th>Call Type</Th>
                        <Th>Status</Th>
                        <Th>Summary</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {analyses.map((analysis) => (
                        <Tr key={analysis.id}>
                          <Td fontWeight="medium">{analysis.title}</Td>
                          <Td>{analysis.customer_name}</Td>
                          <Td>{analysis.call_type}</Td>
                          <Td>
                            <Badge colorScheme={
                              analysis.status === 'completed' ? 'green' :
                              analysis.status === 'processing' ? 'yellow' :
                              analysis.status === 'error' ? 'red' : 'blue'
                            }>
                              {analysis.status}
                            </Badge>
                          </Td>
                          <Td maxW="300px">
                            <Text noOfLines={2}>
                              {analysis.results?.summary || 'No summary available'}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Tooltip label="View Details">
                                <IconButton
                                  aria-label="View"
                                  icon={<FaEye />}
                                  size="sm"
                                  onClick={() => handleAction('view', analysis)}
                                />
                              </Tooltip>
                              <Tooltip label="Download">
                                <IconButton
                                  aria-label="Download"
                                  icon={<FaDownload />}
                                  size="sm"
                                  onClick={() => handleAction('download', analysis)}
                                />
                              </Tooltip>
                              <Tooltip label="Share">
                                <IconButton
                                  aria-label="Share"
                                  icon={<FaShare />}
                                  size="sm"
                                  onClick={() => handleAction('share', analysis)}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {/* Mobile Card View */}
                <VStack 
                  display={{ base: 'flex', lg: 'none' }} 
                  spacing={4}
                  align="stretch"
                >
                  {analyses.map((analysis) => (
                    <Box 
                      key={analysis.id}
                      p={4}
                      bg="white"
                      rounded="md"
                      shadow="sm"
                    >
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">{analysis.title}</Text>
                          <Badge colorScheme={
                            analysis.status === 'completed' ? 'green' :
                            analysis.status === 'processing' ? 'yellow' :
                            analysis.status === 'error' ? 'red' : 'blue'
                          }>
                            {analysis.status}
                          </Badge>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">
                            {analysis.customer_name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {analysis.call_type}
                          </Text>
                        </HStack>

                        <Text fontSize="sm" noOfLines={2}>
                          {analysis.results?.summary || 'No summary available'}
                        </Text>

                        <HStack justify="flex-end" spacing={2}>
                          <IconButton
                            aria-label="View"
                            icon={<FaEye />}
                            size="sm"
                            onClick={() => handleAction('view', analysis)}
                          />
                          <IconButton
                            aria-label="Download"
                            icon={<FaDownload />}
                            size="sm"
                            onClick={() => handleAction('download', analysis)}
                          />
                          <IconButton
                            aria-label="Share"
                            icon={<FaShare />}
                            size="sm"
                            onClick={() => handleAction('share', analysis)}
                          />
                        </HStack>
                      </VStack>
                    </Box>
                  ))}
                </VStack>

                {/* Responsive Pagination */}
                <Box p={4} borderTop="1px" borderColor="gray.200">
                  <HStack 
                    justify="center" 
                    spacing={2}
                    flexDir={{ base: 'column', sm: 'row' }}
                    align="center"
                  >
                    <Button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      isDisabled={page === 0}
                      width={{ base: 'full', sm: 'auto' }}
                    >
                      Previous
                    </Button>
                    <Text>
                      Page {page + 1} of {totalPages}
                    </Text>
                    <Button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      isDisabled={page === totalPages - 1}
                      width={{ base: 'full', sm: 'auto' }}
                    >
                      Next
                    </Button>
                  </HStack>
                </Box>
              </>
            )}
          </VStack>
        </Container>
      </Box>
    </Layout>
  )
}
