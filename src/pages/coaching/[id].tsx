import {
  Box,
  Container,
  Flex,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  IconButton,
  useToast,
  Spinner,
  Divider,
} from '@chakra-ui/react';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getChatResponse } from '@/lib/claude';
import Sidebar from '@/components/Layout/Sidebar';
import VoiceControls from '@/components/VoiceControls';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AnalysisResult {
  summary: {
    text: string;
  };
  relationship_building: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  customer_health_assessment: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  value_demonstration: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  strategic_account_management: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  competitive_positioning: {
    strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
    opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  };
  top_3_strengths: Array<{ text: string; timestamp?: string; quote?: string }>;
  top_3_opportunities: Array<{ text: string; timestamp?: string; quote?: string }>;
  role_playing_summary: Array<{ text: string; timestamp?: string; quote?: string }>;
  role_playing_examples: Array<{ text: string; customer_role: string; example_scenario_prompt: string }>;
}

interface Analysis {
  id: string;
  results: AnalysisResult;
}

export default function CoachingPage() {
  const router = useRouter();
  const { id } = router.query;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchAnalysis(id as string);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function fetchAnalysis(analysisId: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) {
      console.error('Error fetching analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analysis data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setAnalysis(data);
    
    // Initialize conversation with analysis context
    const initialMessage: Message = {
      role: 'assistant',
      content: `I've reviewed your call analysis. Here's a summary of what I found:

${data.results.summary.text}

Key Strengths:
${data.results.value_demonstration.strengths.map((s: { text: string }) => `- ${s.text}`).join('\n')}

Areas for Improvement:
${data.results.value_demonstration.opportunities.map((o: { text: string }) => `- ${o.text}`).join('\n')}

How would you like to focus on improving your skills? I can help you with:
1. Role-playing specific scenarios
2. Developing strategies for value demonstration
3. Improving competitive positioning
4. Other specific areas you'd like to work on

What would you like to focus on?`
    };
    
    setMessages([initialMessage]);
  }

  const handleTranscript = (text: string) => {
    setInputMessage(text);
  };

  const handleSpeakingComplete = () => {
    setIsAssistantSpeaking(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !analysis) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/coaching/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          analysisContext: analysis.results
        }),
      });

      // First check if the response is ok
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to get response from coach';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Only try to parse JSON if response is ok
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLastAssistantMessage(data.response);
      setIsAssistantSpeaking(true);
    } catch (error: any) {
      console.error('Error getting chat response:', {
        message: error.message,
        details: error.details,
        stack: error.stack
      });
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from coach',
        status: 'error',
        duration: 10000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!analysis) {
    return (
      <Box p={8}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box bg="var(--background)" minH="100vh" color="var(--foreground)">
      <Sidebar />
      <Box ml={{ base: 0, md: "60px" }}>
        {/* Header */}
        <Box bg="brand.600" py={4}>
          <Container maxW="container.xl">
            <Flex align="center" gap={4}>
              <IconButton
                aria-label="Back to analysis"
                icon={<FiArrowLeft />}
                variant="ghost"
                color="white"
                onClick={() => router.push(`/analysis/${id}`)}
              />
              <Text fontSize="2xl" fontWeight="bold" color="white">
                Coaching Session
              </Text>
            </Flex>
          </Container>
        </Box>

        {/* Chat Container */}
        <Container maxW="container.xl" py={8}>
          <VStack 
            spacing={4} 
            align="stretch" 
            bg="var(--background)" 
            rounded="lg" 
            shadow="md" 
            border="1px" 
            borderColor="var(--foreground)"
            h="calc(100vh - 200px)"
            overflow="hidden"
          >
            {/* Messages Area */}
            <Box flex="1" overflowY="auto" p={4}>
              <VStack spacing={4} align="stretch">
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    maxW="80%"
                  >
                    <Box
                      bg={message.role === 'user' ? 'brand.600' : 'gray.100'}
                      color={message.role === 'user' ? 'white' : 'var(--foreground)'}
                      p={4}
                      rounded="lg"
                      shadow="sm"
                    >
                      <Text whiteSpace="pre-wrap">{message.content}</Text>
                    </Box>
                  </Box>
                ))}
                {isLoading && (
                  <Box alignSelf="flex-start" maxW="80%">
                    <Box bg="gray.100" p={4} rounded="lg" shadow="sm">
                      <HStack spacing={2}>
                        <Spinner size="sm" />
                        <Text>Thinking...</Text>
                      </HStack>
                    </Box>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* Input Area */}
            <Box p={4} borderTop="1px" borderColor="var(--foreground)">
              <VStack spacing={4} align="stretch">
                <HStack spacing={4}>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <IconButton
                    aria-label="Send message"
                    icon={<FiSend />}
                    colorScheme="brand"
                    onClick={handleSendMessage}
                    isLoading={isLoading}
                  />
                </HStack>
                <VoiceControls
                  onTranscript={handleTranscript}
                  textToSpeak={lastAssistantMessage}
                  isAssistantSpeaking={isAssistantSpeaking}
                  onSpeakingComplete={handleSpeakingComplete}
                />
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
} 