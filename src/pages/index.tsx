import { Box, Container, Heading, VStack, HStack, Button, Text, SimpleGrid, Icon } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { FaUpload, FaChartBar, FaComments, FaCog } from 'react-icons/fa'
import Layout from '@/components/Layout'  // Make sure this import is cor

export default function Home() {
  const router = useRouter()

  const features = [
    {
      title: 'Upload & Analyze',
      description: 'Upload your sales call transcripts for AI analysis',
      icon: FaUpload,
      path: '/upload'
    },
    {
      title: 'View Analysis',
      description: 'Get detailed insights from your calls',
      icon: FaChartBar,
      path: '/analysis'
    },
    {
      title: 'Practice Coaching',
      description: 'Interactive AI coaching sessions',
      icon: FaComments,
      path: '/coaching'
    },
    {
      title: 'Settings',
      description: 'Manage your account and preferences',
      icon: FaCog,
      path: '/settings'
    }
  ]

  return (
    <Layout>
      <Box minH="100vh">
        <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
          <VStack spacing={{ base: 4, md: 8 }} align="stretch">
            {/* Header */}
            <Box textAlign="center" py={{ base: 4, md: 8 }}>
              <Heading 
                as="h1" 
                size={{ base: "xl", md: "2xl" }}
                mb={{ base: 2, md: 4 }}
                color="brand.900"
              >
                Call Coach AI
              </Heading>
              <Text 
                fontSize={{ base: "lg", md: "xl" }}
                color="brand.700"
              >
                Improve your customer conversations with AI-powered coaching
              </Text>
            </Box>

            {/* Feature Grid */}
            <SimpleGrid 
              columns={{ base: 1, md: 2 }} 
              spacing={{ base: 4, md: 8 }}
            >
              {features.map((feature) => (
                <Box
                  key={feature.title}
                  bg="white"
                  p={6}
                  rounded="lg"
                  shadow="md"
                  _hover={{
                    transform: 'translateY(-2px)',
                    shadow: 'lg',
                    cursor: 'pointer'
                  }}
                  transition="all 0.2s"
                  onClick={() => router.push(feature.path)}
                >
                  <VStack align="start" spacing={4}>
                    <Icon 
                      as={feature.icon} 
                      boxSize={8} 
                      color="accent.500" 
                    />
                    <Heading size="md" color="brand.800">
                      {feature.title}
                    </Heading>
                    <Text color="brand.600">
                      {feature.description}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>

            {/* Quick Actions */}
            <HStack justify="center" spacing={4} pt={8}>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={() => router.push('/upload')}
              >
                Upload New Call
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/coaching')}
              >
                Start Coaching
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>
    </Layout>
  )
}
