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
  Badge,
  Tooltip,
  Circle,
} from '@chakra-ui/react'
import { FiUpload, FiPieChart, FiClock, FiCheckCircle, FiFilter, FiX } from 'react-icons/fi'
import SignIn from '@/components/Auth/Signin'
import Sidebar from '@/components/Layout/Sidebar'
import TranscriptUpload from '@/components/TranscriptUpload'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { supabase } from '@/lib/supabase-client' // Import shared client
import { useRouter } from 'next/router'
import Link from 'next/link'

function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<{ first_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCalls: 0,
    analyzedCalls: 0,
    averageScore: 0,
    recentActivity: [] as any[]
  })
  const bgColor = useColorModeValue('white', 'gray.700')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    customerName: '',
    callType: '',
    dateRange: ''
  })
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const refreshAnalyses = async () => {
    try {
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
        call_type: analysis.call_type,
        customer_name: analysis.customer_name,
        results: analysis.results,
      })) || []

      setStats(prev => ({
        ...prev,
        recentActivity: activities
      }))
    } catch (error) {
      console.error('Error refreshing analyses:', error)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('first_name')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession?.user) {
          setSession(existingSession)
          await fetchUserProfile(existingSession.user.id)
          
          // Fetch recent analyses
          await refreshAnalyses()
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
        fetchUserProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
            <Text fontSize="2xl" fontWeight="bold" mb={2}>
              Welcome, {userProfile?.first_name || session?.user?.email}!
            </Text>
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
              <VStack 
                align="start" 
                spacing={4} 
                position="relative" 
                zIndex={1}
                bg="var(--background)" 
                rounded="lg" 
                shadow="md" 
                border="1px" 
                borderColor="var(--foreground)"
                p={6}
                w="100%"
              >
                <Text 
                  fontSize={{ base: "2xl", md: "3xl" }} 
                  fontWeight="bold"
                  color="var(--foreground)"
                  maxW={{ base: "100%", md: "600px" }}
                >
                  Elevate Your Performance
                </Text>
                <Text 
                  fontSize={{ base: "md", md: "lg" }} 
                  color="var(--foreground)"
                  maxW={{ base: "100%", md: "900px" }}
                  lineHeight="tall"
                >
                  Get AI-powered insights from your customer calls. 
                  Improve your consulting skills, track your progress, and boost your success rate.
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
                          <option value="QBR">QBR</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Other">Other</option>
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
                <VStack 
                  align="stretch" 
                  spacing={0}
                  bg="var(--background)" 
                  rounded="lg" 
                  shadow="md" 
                  border="1px" 
                  borderColor="var(--foreground)"
                  overflow="hidden"
                >
                  {/* Table Header */}
                  <Grid 
                    templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 100px 100px 1fr" }}
                    gap={4} 
                    px={4} 
                    py={3} 
                    bg="brand.600" 
                  >
                    <Text fontWeight="medium" fontSize="sm" color="white">Customer</Text>
                    <Text fontWeight="medium" fontSize="sm" color="white">Call Type</Text>
                    <Text fontWeight="medium" fontSize="sm" color="white">Score</Text>
                    <Text fontWeight="medium" fontSize="sm" color="white">Strengths</Text>
                    <Text fontWeight="medium" fontSize="sm" color="white">Opportunities</Text>
                    <Text fontWeight="medium" fontSize="sm" color="white">Date</Text>
                  </Grid>
                  
                  {/* Table Body */}
                  <VStack align="stretch" spacing={0} divider={<Divider />}>
                    {stats.recentActivity.map((analysis) => (
                      <ActivityItem key={analysis.id} analysis={analysis} />
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
              onUploadComplete={refreshAnalyses}
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

const ActivityItem = ({ analysis }) => {
  const strengths = analysis.results?.value_demonstration?.strengths || [];
  const opportunities = analysis.results?.value_demonstration?.opportunities || [];

  const strengthsTooltip = strengths.map(s => s.text).join('\n');
  const opportunitiesTooltip = opportunities.map(o => o.text).join('\n');
  const overallScore = analysis.results?.summary?.score || 0;

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 4) return "green.500";
    if (score >= 3) return "yellow.500";
    return "orange.500";
  };

  return (
    <Link href={`/analysis/${analysis.id}`} style={{ textDecoration: 'none' }}>
      <Grid
        templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 100px 100px 1fr" }}
        gap={4}
        p={4}
        alignItems="center"
        _hover={{ bg: 'gray.50' }}
        cursor="pointer"
      >
        <Text fontWeight="bold" color="var(--foreground)" noOfLines={1}>{analysis.customer_name}</Text>
        <Text fontSize="sm" color="var(--foreground)" fontStyle="italic" noOfLines={1}>{analysis.call_type}</Text>
        <Tooltip label={`Overall Score: ${overallScore.toFixed(1)}/5`} placement="top">
          <Flex justify="center">
            <Circle
              size="28px"
              bg={getScoreColor(overallScore)}
              color="white"
              fontWeight="bold"
              fontSize="sm"
            >
              {overallScore.toFixed(1)}
            </Circle>
          </Flex>
        </Tooltip>
        <Tooltip label={strengthsTooltip} placement="top">
          <Badge colorScheme="green" textAlign="center">
            {strengths.length}
          </Badge>
        </Tooltip>
        <Tooltip label={opportunitiesTooltip} placement="top">
          <Badge colorScheme="orange" textAlign="center">
            {opportunities.length}
          </Badge>
        </Tooltip>
        <Text fontSize="sm" color="var(--foreground)" fontStyle="italic" noOfLines={1}>{analysis.date}</Text>
      </Grid>
    </Link>
  );
};

export default Home