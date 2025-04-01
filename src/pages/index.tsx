import { useEffect, useState } from 'react'
import { 
  Box, 
  Spinner, 
  Center, 
  Text, 
  Container, 
  VStack, 
  Grid, 
  Button, 
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useColorModeValue,
  Divider,
  Collapse,
  Stack,
  Select,
  Input,
  IconButton,
  Slide,
  SlideFade,
} from '@chakra-ui/react'
import { FiUpload, FiPieChart, FiClock, FiCheckCircle, FiFilter, FiX } from 'react-icons/fi'
import SignIn from '@/components/Auth/Signin'
import Sidebar from '@/components/Layout/Sidebar'
import TranscriptUpload from '@/components/TranscriptUpload'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { supabase } from '@/lib/supabase-client' // Import shared client

function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCalls: 0,
    analyzedCalls: 0,
    averageScore: 0,
    recentActivity: []
  })
  const bgColor = useColorModeValue('white', 'gray.700')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    customerName: '',
    callType: '',
    dateRange: ''
  })
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession?.user) {
          setSession(existingSession)
          
          // Fetch recent analyses
          const { data: analyses, error } = await supabase
            .from('analyses')
            .select('id, call_type, customer_name, results, completed_at')
            .order('completed_at', { ascending: false })
            .limit(5)

          if (error) {
            console.error('Error fetching analyses:', error)
            return
          }

          // Transform analyses into activity items
          const activities = analyses?.map(analysis => ({
            id: analysis.id,
            date: new Date(analysis.completed_at).toLocaleDateString(),
            callType: analysis.call_type,
            customerName: analysis.customer_name,
            summary: analysis.results?.summary || 'No summary available',
          })) || []

          setStats(prev => ({
            ...prev,
            recentActivity: activities
          }))
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setLoading(false)
      }
    }

    setupAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setSession(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleUpload = () => {
    setIsUploadOpen(true)
  }

  const handleUploadClose = () => {
    setIsUploadOpen(false)
  }

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
        <Text ml={4}>Loading dashboard...</Text>
      </Center>
    )
  }

  if (!session?.user) {
    return (
      <Container maxW="container.xl" py={8}>
        <SignIn />
      </Container>
    )
  }

  return (
    <Flex>
      <Sidebar />
      <Box flex="1" ml={{ base: 0, md: "60px" }} transition="margin 0.3s">
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            {/* Header Section with Upload Button */}
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="2xl" fontWeight="bold" mb={2}>Welcome, {session.user.email}</Text>
                <Text color="gray.600">Manage and analyze your calls</Text>
              </Box>
              <Button
                leftIcon={<FiUpload />}
                colorScheme="blue"
                onClick={handleUpload}
              >
                Upload New Call
              </Button>
            </Flex>

            {/* CallCoach Banner */}
            <Box 
              p={8} 
              borderRadius="lg" 
              bg="brand.600" 
              color="white"
              position="relative"
              overflow="hidden"
            >
              <Box 
                position="absolute" 
                top={0} 
                right={0} 
                w="40%" 
                h="100%" 
                bgGradient="linear(to-l, brand.500, transparent)"
                opacity={0.4}
              />
              <VStack align="start" spacing={4} position="relative" zIndex={1}>
                <Text fontSize="3xl" fontWeight="bold">
                  Elevate Your Sales Performance
                </Text>
                <Text fontSize="lg" maxW="600px">
                  Get AI-powered insights from your sales calls. 
                  Improve your pitch, track your progress, and boost your success rate.
                </Text>
              </VStack>
            </Box>

            {/* Recent Activity */}
            <Box p={6} borderRadius="lg" boxShadow="base" bg={bgColor}>
              <Flex justify="space-between" align="center" mb={6}>
                <Flex align="center" gap={2}>
                  <Text fontSize="lg" fontWeight="bold">Recent Activity</Text>
                  <IconButton
                    aria-label="Filter"
                    icon={isFilterOpen ? <FiX /> : <FiFilter />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  />
                </Flex>
                <Text color="gray.500" fontSize="sm">Last 5 analyses</Text>
              </Flex>

              {/* Filter Panel */}
              <Collapse in={isFilterOpen} animateOpacity>
                <Box 
                  p={4} 
                  bg="gray.50" 
                  borderRadius="md" 
                  mb={6}
                >
                  <Stack spacing={4}>
                    <Text fontWeight="medium" color="gray.700">Filters</Text>
                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      <Box>
                        <Text fontSize="sm" mb={2}>Customer Name</Text>
                        <Input
                          placeholder="Search customers..."
                          size="sm"
                          value={filters.customerName}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            customerName: e.target.value
                          }))}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={2}>Call Type</Text>
                        <Select
                          size="sm"
                          placeholder="All types"
                          value={filters.callType}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            callType: e.target.value
                          }))}
                        >
                          <option value="Discovery">Discovery</option>
                          <option value="Demo">Demo</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="QBR">QBR</option>
                        </Select>
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={2}>Date Range</Text>
                        <Select
                          size="sm"
                          placeholder="All time"
                          value={filters.dateRange}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            dateRange: e.target.value
                          }))}
                        >
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="quarter">This Quarter</option>
                        </Select>
                      </Box>
                    </Grid>
                    <Flex justify="flex-end" gap={2}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFilters({
                            customerName: '',
                            callType: '',
                            dateRange: ''
                          })
                        }}
                      >
                        Clear All
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        Apply Filters
                      </Button>
                    </Flex>
                  </Stack>
                </Box>
              </Collapse>

              {stats.recentActivity.length > 0 ? (
                <VStack align="stretch" spacing={0}>
                  {/* Table Header */}
                  <Grid 
                    templateColumns="2fr 1fr 2fr auto" 
                    gap={4} 
                    px={4} 
                    py={3} 
                    bg="gray.50" 
                    borderTopRadius="md"
                  >
                    <Text fontWeight="medium" fontSize="sm" color="gray.600">Customer</Text>
                    <Text fontWeight="medium" fontSize="sm" color="gray.600">Call Type</Text>
                    <Text fontWeight="medium" fontSize="sm" color="gray.600">Summary</Text>
                    <Text fontWeight="medium" fontSize="sm" color="gray.600">Date</Text>
                  </Grid>
                  
                  {/* Table Body */}
                  <VStack align="stretch" spacing={0} divider={<Divider />}>
                    {stats.recentActivity.map((activity) => (
                      <Grid 
                        key={activity.id}
                        templateColumns="2fr 1fr 2fr auto"
                        gap={4}
                        px={4}
                        py={3}
                        _hover={{ bg: 'gray.50' }}
                        transition="background 0.2s"
                        cursor="pointer"
                        alignItems="center"
                      >
                        <Text fontWeight="medium">
                          {activity.customerName}
                        </Text>
                        <Text 
                          px={2} 
                          py={0.5} 
                          bg="gray.100" 
                          fontSize="xs" 
                          borderRadius="full"
                          width="fit-content"
                        >
                          {activity.callType}
                        </Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {activity.summary}
                        </Text>
                        <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
                          {activity.date}
                        </Text>
                      </Grid>
                    ))}
                  </VStack>
                </VStack>
              ) : (
                <Text color="gray.500">No recent activity</Text>
              )}
            </Box>
          </VStack>
        </Container>
        
        <Slide
          direction='right'
          in={isUploadOpen}
          style={{ zIndex: 10 }}
        >
          <Box
            p={4}
            bg={bgColor}
            shadow="lg"
            h="100vh"
            w={{ base: "100%", md: "500px" }}
            position="fixed"
            top={0}
            right={0}
            overflowY="auto"
          >
            <TranscriptUpload 
              session={session} 
              onClose={handleUploadClose}
            />
          </Box>
        </Slide>
      </Box>
    </Flex>
  )
}

// Helper Components
function StatCard({ icon, title, value, helpText }) {
  const bgColor = useColorModeValue('white', 'gray.700')
  
  return (
    <Box p={6} borderRadius="lg" boxShadow="base" bg={bgColor}>
      <Flex align="center" mb={2}>
        <Icon as={icon} boxSize={6} color="blue.500" />
      </Flex>
      <Stat>
        <StatLabel>{title}</StatLabel>
        <StatNumber>{value}</StatNumber>
        <StatHelpText>{helpText}</StatHelpText>
      </Stat>
    </Box>
  )
}

function ActionCard({ title, description, icon, onClick }) {
  const bgColor = useColorModeValue('white', 'gray.700')
  
  return (
    <Box 
      p={6} 
      borderRadius="lg" 
      boxShadow="base" 
      bg={bgColor}
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}
    >
      <Icon as={icon} boxSize={8} color="blue.500" mb={4} />
      <Text fontSize="lg" fontWeight="bold" mb={2}>{title}</Text>
      <Text color="gray.600">{description}</Text>
    </Box>
  )
}

export default Home