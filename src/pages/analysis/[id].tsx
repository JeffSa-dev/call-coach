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
  Grid,
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
    summary: {
      text: string;
    };
    relationship_building: {
      strengths: Array<{ text: string; timestamp?: string }>;
      opportunities: Array<{ text: string; timestamp?: string }>;
    };
    customer_health_assessment: {
      strengths: Array<{ text: string; timestamp?: string }>;
      opportunities: Array<{ text: string; timestamp?: string }>;
    };
    value_demonstration: {
      strengths: Array<{ text: string; timestamp?: string }>;
      opportunities: Array<{ text: string; timestamp?: string }>;
    };
    strategic_account_management: {
      strengths: Array<{ text: string; timestamp?: string }>;
      opportunities: Array<{ text: string; timestamp?: string }>;
    };
    competitive_positioning: {
      strengths: Array<{ text: string; timestamp?: string }>;
      opportunities: Array<{ text: string; timestamp?: string }>;
    };
    top_3_strengths: Array<{ text: string; timestamp?: string }>;
    top_3_opportunities: Array<{ text: string; timestamp?: string }>;
    role_playing_summary: Array<{ text: string; timestamp?: string }>;
    role_playing_examples: Array<{ text: string; customer_role: string; example_scenario_prompt: string }>;
  };
}

const formatTimestamp = (timestamp: string | number): string => {
  // Convert to number if it's a string
  const seconds = Number(timestamp);
  
  // Calculate minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Pad seconds with leading zero if needed
  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  return `${minutes}:${paddedSeconds}`;
};

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
                  Call Summary
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
              <Tab>Action Plan</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                {/* Summary Content */}
                <Stack spacing={8}>
                  {/* Call Summary */}
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Call Effectiveness Summary
                    </Text>
                    <Text color="gray.700" lineHeight="tall">
                      {analysis.results.summary.text}
                    </Text>
                  </Box>

                  <Divider />

                  {/* Call Context */}
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

                  {/* Top 3 Strengths & Opportunities */}
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={4} color="green.700">
                        Top 3 Strengths
                      </Text>
                      <Stack spacing={4}>
                        {analysis.results.top_3_strengths.map((strength, index) => (
                          <Box
                            key={index}
                            p={4}
                            bg="green.50"
                            borderLeft="4px"
                            borderColor="green.400"
                            rounded="md"
                          >
                            <Text fontWeight="bold" color="green.700" mb={2}>
                              {index + 1}. {strength.text}
                              {strength.timestamp && (
                                <Text as="span" fontSize="sm" color="green.600" ml={2}>
                                  [{formatTimestamp(strength.timestamp)}]
                                </Text>
                              )}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={4} color="orange.700">
                        Top 3 Opportunities
                      </Text>
                      <Stack spacing={4}>
                        {analysis.results.top_3_opportunities.map((opportunity, index) => (
                          <Box
                            key={index}
                            p={4}
                            bg="orange.50"
                            borderLeft="4px"
                            borderColor="orange.400"
                            rounded="md"
                          >
                            <Text fontWeight="bold" color="orange.700" mb={2}>
                              {index + 1}. {opportunity.text}
                              {opportunity.timestamp && (
                                <Text as="span" fontSize="sm" color="orange.600" ml={2}>
                                  [{formatTimestamp(opportunity.timestamp)}]
                                </Text>
                              )}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>

                  <Divider />

                  {/* Detailed Analysis Sections */}
                  <Stack spacing={8}>
                    {/* Relationship Building */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Relationship Building
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="green.700">
                            Strengths
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.relationship_building.strengths.map((strength, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="green.50"
                                borderLeft="4px"
                                borderColor="green.400"
                                rounded="md"
                              >
                                <Text color="green.700">
                                  {strength.text}
                                  {strength.timestamp && (
                                    <Text as="span" fontSize="sm" color="green.600" ml={2}>
                                      [{formatTimestamp(strength.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="orange.700">
                            Opportunities
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.relationship_building.opportunities.map((opportunity, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="orange.50"
                                borderLeft="4px"
                                borderColor="orange.400"
                                rounded="md"
                              >
                                <Text color="orange.700">
                                  {opportunity.text}
                                  {opportunity.timestamp && (
                                    <Text as="span" fontSize="sm" color="orange.600" ml={2}>
                                      [{formatTimestamp(opportunity.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                    </Box>

                    {/* Customer Health Assessment */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Customer Health Assessment
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="green.700">
                            Strengths
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.customer_health_assessment.strengths.map((strength, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="green.50"
                                borderLeft="4px"
                                borderColor="green.400"
                                rounded="md"
                              >
                                <Text color="green.700">
                                  {strength.text}
                                  {strength.timestamp && (
                                    <Text as="span" fontSize="sm" color="green.600" ml={2}>
                                      [{formatTimestamp(strength.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="orange.700">
                            Opportunities
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.customer_health_assessment.opportunities.map((opportunity, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="orange.50"
                                borderLeft="4px"
                                borderColor="orange.400"
                                rounded="md"
                              >
                                <Text color="orange.700">
                                  {opportunity.text}
                                  {opportunity.timestamp && (
                                    <Text as="span" fontSize="sm" color="orange.600" ml={2}>
                                      [{formatTimestamp(opportunity.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                    </Box>

                    {/* Value Demonstration */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Value Demonstration
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="green.700">
                            Strengths
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.value_demonstration.strengths.map((strength, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="green.50"
                                borderLeft="4px"
                                borderColor="green.400"
                                rounded="md"
                              >
                                <Text color="green.700">
                                  {strength.text}
                                  {strength.timestamp && (
                                    <Text as="span" fontSize="sm" color="green.600" ml={2}>
                                      [{formatTimestamp(strength.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="orange.700">
                            Opportunities
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.value_demonstration.opportunities.map((opportunity, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="orange.50"
                                borderLeft="4px"
                                borderColor="orange.400"
                                rounded="md"
                              >
                                <Text color="orange.700">
                                  {opportunity.text}
                                  {opportunity.timestamp && (
                                    <Text as="span" fontSize="sm" color="orange.600" ml={2}>
                                      [{formatTimestamp(opportunity.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                    </Box>

                    {/* Strategic Account Management */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Strategic Account Management
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="green.700">
                            Strengths
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.strategic_account_management.strengths.map((strength, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="green.50"
                                borderLeft="4px"
                                borderColor="green.400"
                                rounded="md"
                              >
                                <Text color="green.700">
                                  {strength.text}
                                  {strength.timestamp && (
                                    <Text as="span" fontSize="sm" color="green.600" ml={2}>
                                      [{formatTimestamp(strength.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="orange.700">
                            Opportunities
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.strategic_account_management.opportunities.map((opportunity, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="orange.50"
                                borderLeft="4px"
                                borderColor="orange.400"
                                rounded="md"
                              >
                                <Text color="orange.700">
                                  {opportunity.text}
                                  {opportunity.timestamp && (
                                    <Text as="span" fontSize="sm" color="orange.600" ml={2}>
                                      [{formatTimestamp(opportunity.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                    </Box>

                    {/* Competitive Positioning */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Competitive Positioning
                      </Text>
                      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="green.700">
                            Strengths
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.competitive_positioning.strengths.map((strength, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="green.50"
                                borderLeft="4px"
                                borderColor="green.400"
                                rounded="md"
                              >
                                <Text color="green.700">
                                  {strength.text}
                                  {strength.timestamp && (
                                    <Text as="span" fontSize="sm" color="green.600" ml={2}>
                                      [{formatTimestamp(strength.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                        <Box>
                          <Text fontSize="md" fontWeight="semibold" mb={4} color="orange.700">
                            Opportunities
                          </Text>
                          <Stack spacing={4}>
                            {analysis.results.competitive_positioning.opportunities.map((opportunity, index) => (
                              <Box
                                key={index}
                                p={4}
                                bg="orange.50"
                                borderLeft="4px"
                                borderColor="orange.400"
                                rounded="md"
                              >
                                <Text color="orange.700">
                                  {opportunity.text}
                                  {opportunity.timestamp && (
                                    <Text as="span" fontSize="sm" color="orange.600" ml={2}>
                                      [{formatTimestamp(opportunity.timestamp)}]
                                    </Text>
                                  )}
                                </Text>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                    </Box>

                    {/* Role-Playing Scenarios */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Role-Playing Scenarios
                      </Text>
                      <Stack spacing={6}>
                        {analysis.results.role_playing_examples.map((example, index) => (
                          <Box
                            key={index}
                            p={6}
                            bg="blue.50"
                            borderLeft="4px"
                            borderColor="blue.400"
                            rounded="md"
                          >
                            <Text fontSize="md" fontWeight="semibold" color="blue.700" mb={4}>
                              Scenario {index + 1}
                            </Text>
                            <Stack spacing={4}>
                              <Box>
                                <Text fontWeight="medium" color="blue.700" mb={2}>
                                  Customer Role: {example.customer_role}
                                </Text>
                                <Text color="blue.700">
                                  {example.text}
                                </Text>
                              </Box>
                              <Box>
                                <Text fontWeight="medium" color="blue.700" mb={2}>
                                  Example Prompt:
                                </Text>
                                <Text color="blue.700">
                                  {example.example_scenario_prompt}
                                </Text>
                              </Box>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Stack>
              </TabPanel>

              {/* Action Plan Tab */}
              <TabPanel>
                <Stack spacing={8}>
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Action Plan
                    </Text>
                    <Text color="gray.700">
                      Action plan content will be added here.
                    </Text>
                  </Box>
                </Stack>
              </TabPanel>
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