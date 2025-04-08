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
  Progress,
  HStack,
  VStack,
  Circle,
  Link,
} from '@chakra-ui/react';
import { FiDownload, FiChevronDown, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import Sidebar from '@/components/Layout/Sidebar';

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
  const seconds = Number(timestamp);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
  return `${minutes}:${paddedSeconds}`;
};

const categoryOrder = [
  'relationship_building',
  'customer_health_assessment',
  'value_demonstration',
  'competitive_positioning',
  'strategic_account_management'
];

const getScoreColor = (score: number): string => {
  if (score >= 4) return "green.500";
  if (score >= 3) return "yellow.500";
  return "orange.500";
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
    <Box bg="var(--background)" minH="100vh" color="var(--foreground)">
      <Sidebar />
      <Box ml={{ base: 0, md: "60px" }}>
        {/* Header */}
        <Box bg="brand.600" py={4}>
          <Container maxW="container.xl">
            <Flex justify="space-between" align="center">
              <Text fontSize="2xl" fontWeight="bold" color="white">
                Call Analysis Dashboard
              </Text>
            </Flex>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxW="container.xl" py={8}>
          {/* Call Info Header */}
          <Box bg="var(--background)" rounded="lg" shadow="md" p={6} mb={6} border="1px" borderColor="var(--foreground)">
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="var(--foreground)">
                  {analysis.customer_name} - {analysis.call_type}
                </Text>
                <Text color="var(--foreground)" opacity={0.7} mt={1}>
                  {new Date(analysis.created_at).toLocaleDateString()} | 45 minutes | {analysis.csm_name}
                </Text>
              </Box>
              <Box textAlign="center">
                <Circle 
                  size="80px" 
                  bg={getScoreColor(analysis.results?.summary?.score || 0)} 
                  color="white" 
                  fontSize="3xl" 
                  fontWeight="bold"
                >
                  {(analysis.results?.summary?.score || 0).toFixed(1)}
                </Circle>
                <Text mt={2} fontWeight="bold" color="var(--foreground)">Overall Score</Text>
                <Text fontSize="sm" color="var(--foreground)" opacity={0.7}>out of 5</Text>
              </Box>
            </Flex>
          </Box>

          {/* Summary and Scores Grid */}
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mb={6}>
            {/* Call Summary */}
            <Box bg="var(--background)" rounded="lg" shadow="sm" p={6}>
              <Text fontSize="xl" fontWeight="bold" color="var(--foreground)" mb={4}>
                Call Summary
              </Text>
              <Text color="var(--foreground)" mb={4}>
                {analysis.results.summary.text}
              </Text>
              <Link href={`/coaching/${analysis.id}`}>
                <Button size="sm" colorScheme="green" variant="solid">
                  Practice Now
                </Button>
              </Link>
            </Box>

            {/* Category Scores */}
            <Box bg="var(--background)" rounded="lg" shadow="sm" p={6}>
              <Text fontSize="xl" fontWeight="bold" color="var(--foreground)" mb={6}>
                Category Scores
              </Text>
              <Stack spacing={4}>
                {categoryOrder.map(category => {
                  const data = analysis.results[category];
                  if (typeof data === 'object' && 'score' in data) {
                    return (
                      <Box key={category}>
                        <Flex justify="space-between" mb={2}>
                          <Text color="var(--foreground)" fontWeight="medium">
                            {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Text>
                          <Text color="var(--foreground)" fontWeight="bold">
                            {data.score.toFixed(1)}
                          </Text>
                        </Flex>
                        <Progress 
                          value={data.score * 20} 
                          colorScheme={data.score >= 4 ? "green" : data.score >= 3 ? "yellow" : "orange"}
                          size="sm" 
                          borderRadius="full"
                        />
                      </Box>
                    );
                  }
                  return null;
                })}
              </Stack>
            </Box>
          </Grid>

          {/* Category Grid */}
          <Box bg="var(--background)" rounded="lg" shadow="sm" overflow="hidden" border="2px" borderColor="var(--foreground)">
            {/* Grid Header */}
            <Box bg="brand.600" p={4} borderBottom="2px" borderColor="var(--foreground)">
              <Grid templateColumns="180px 1fr 1fr" gap={4}>
                <Text color="white" fontWeight="bold" textAlign="center">Category</Text>
                <Text color="white" fontWeight="bold" textAlign="center">Strengths</Text>
                <Text color="white" fontWeight="bold" textAlign="center">Opportunities</Text>
              </Grid>
            </Box>

            {/* Grid Rows */}
            {categoryOrder.map((category, index) => {
              const data = analysis.results[category];
              return (
                <Box 
                  key={category} 
                  borderBottom="2px" 
                  borderColor="var(--foreground)"
                  bg={index % 2 === 0 ? "var(--background)" : "gray.50"}
                >
                  <Grid templateColumns="180px 1fr 1fr" gap={4} p={4}>
                    {/* Category Column */}
                    <Box p={4} borderRadius="md">
                      <Text fontWeight="bold" color="var(--foreground)">
                        {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Text>
                      <Circle 
                        size="28px" 
                        bg={getScoreColor(data.score)} 
                        color="white" 
                        fontSize="sm" 
                        fontWeight="bold"
                        mt={2}
                        fontFamily="var(--font-adobe-garamond)"
                      >
                        {data.score?.toFixed(1)}
                      </Circle>
                    </Box>

                    {/* Strengths Column */}
                    <Box>
                      {data.strengths.map((strength, index) => (
                        <Box key={index} mb={4}>
                          <Text fontWeight="bold" color="var(--foreground)">
                            {strength.text}
                          </Text>
                          {strength.quote && (
                            <Text fontSize="sm" color="var(--foreground)" fontStyle="italic">
                              "{strength.quote}"
                            </Text>
                          )}
                          {strength.timestamp && (
                            <Text fontSize="xs" color="var(--foreground)" fontStyle="italic">
                              {formatTimestamp(strength.timestamp)}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </Box>

                    {/* Opportunities Column */}
                    <Box>
                      {data.opportunities.map((opportunity, index) => (
                        <Box key={index} mb={4}>
                          <Text fontWeight="bold" color="var(--foreground)">
                            {opportunity.text}
                          </Text>
                          {opportunity.quote && (
                            <Text fontSize="sm" color="var(--foreground)" fontStyle="italic">
                              "{opportunity.quote}"
                            </Text>
                          )}
                          {opportunity.timestamp && (
                            <Text fontSize="xs" color="var(--foreground)" fontStyle="italic">
                              {formatTimestamp(opportunity.timestamp)}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Box>
              );
            })}
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 