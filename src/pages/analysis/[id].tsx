import {
  Box,
  Container,
  Flex,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Badge,
  Stack,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { FiDownload, FiChevronDown } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface Analysis {
  id: string;
  title: string;
  customer_name: string;
  call_type: string;
  created_at: string;
  completed_at: string;
  results: {
    summary: string;
    value_articulation: {
      strengths: Array<{ text: string; timestamp?: string }>;
      opportunities: Array<{ text: string; timestamp?: string }>;
    };
    competitive_positioning: {
      strengths: Array<{ text: string; timestamp?: string }>;
      opportunities: Array<{ text: string; timestamp?: string }>;
    };
    expansion_opportunities: Array<{ description: string; timestamp?: string }>;
  };
}

export default function AnalysisPage() {
  const router = useRouter();
  const { id } = router.query;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnalysis(id as string);
    }
  }, [id]);

  async function fetchAnalysis(analysisId: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) {
      console.error('Error fetching analysis:', error);
      return;
    }

    setAnalysis(data);
  }

  if (!analysis) {
    return <Box p={8}>Loading...</Box>;
  }

  return (
    <Box bg="gray.50" minH="100vh">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold" color="blue.500">
              CSM Call Coach
            </Text>
            <Button size="sm" bg="gray.100">
              New Analysis
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px">
          {/* Analysis Header */}
          <Box p={6} borderBottom="1px" borderColor="gray.200">
            <Flex justify="space-between" align="start">
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  CSM Call Coaching Assessment
                </Text>
                <Flex align="center" mt={2} gap={4}>
                  <Text fontWeight="bold" color="gray.600">
                    Customer: {analysis.customer_name}
                  </Text>
                  <Badge colorScheme="blue" px={3} py={1}>
                    {analysis.call_type}
                  </Badge>
                </Flex>
                <Stack direction="row" spacing={6} mt={4} color="gray.500" fontSize="sm">
                  <Text>Created: {new Date(analysis.created_at).toLocaleString()}</Text>
                  {analysis.completed_at && (
                    <Text>Completed: {new Date(analysis.completed_at).toLocaleString()}</Text>
                  )}
                </Stack>
              </Box>
              <Flex gap={2}>
                <Menu>
                  <MenuButton as={Button} variant="outline" rightIcon={<Icon as={FiChevronDown} />}>
                    PDF
                  </MenuButton>
                  <MenuList>
                    <MenuItem>Download PDF</MenuItem>
                    <MenuItem>Share PDF</MenuItem>
                  </MenuList>
                </Menu>
                <Button colorScheme="blue" leftIcon={<Icon as={FiDownload} />}>
                  Export
                </Button>
              </Flex>
            </Flex>
          </Box>

          {/* Tabs */}
          <Tabs>
            <TabList px={6}>
              <Tab fontWeight="semibold">Summary</Tab>
              <Tab>Value Delivery</Tab>
              <Tab>Competitive</Tab>
              <Tab>Expansion</Tab>
              <Tab>Key Moments</Tab>
              <Tab>Action Plan</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                {/* Summary Content */}
                <Stack spacing={8}>
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Call Effectiveness Summary
                    </Text>
                    <Text color="gray.700" lineHeight="tall">
                      {analysis.results.summary}
                    </Text>
                  </Box>

                  <Divider />

                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Call Context
                    </Text>
                    <Box bg="gray.50" p={6} rounded="md">
                      <Stack spacing={4}>
                        <Text>• Customer: {analysis.customer_name}</Text>
                        <Text>• Call Type: {analysis.call_type}</Text>
                        <Text>• Participants: [List of participants]</Text>
                        <Text>• Date/Duration: {new Date(analysis.created_at).toLocaleString()}</Text>
                        <Text>• Primary Objective: [Objective]</Text>
                      </Stack>
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Key Strengths
                    </Text>
                    {analysis.results.value_articulation.strengths.map((strength, index) => (
                      <Box
                        key={index}
                        p={4}
                        mb={4}
                        bg="green.50"
                        borderLeft="4px"
                        borderColor="green.400"
                        rounded="md"
                      >
                        <Text fontWeight="bold" color="green.700" mb={2}>
                          {strength.text} {strength.timestamp && `[${strength.timestamp}]`}
                        </Text>
                      </Box>
                    ))}
                  </Box>

                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Improvement Opportunities
                    </Text>
                    {analysis.results.value_articulation.opportunities.map((opportunity, index) => (
                      <Box
                        key={index}
                        p={4}
                        mb={4}
                        bg="orange.50"
                        borderLeft="4px"
                        borderColor="orange.400"
                        rounded="md"
                      >
                        <Text fontWeight="bold" color="orange.700" mb={2}>
                          {opportunity.text} {opportunity.timestamp && `[${opportunity.timestamp}]`}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                </Stack>
              </TabPanel>
              {/* Add other tab panels here */}
            </TabPanels>
          </Tabs>
        </Box>

        {/* Bottom Actions */}
        <Flex justify="center" mt={6}>
          <Button colorScheme="blue" size="lg" onClick={() => router.push('/upload')}>
            New Analysis
          </Button>
        </Flex>
      </Container>
    </Box>
  );
} 