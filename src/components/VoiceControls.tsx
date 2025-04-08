import { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Tooltip,
  useToast,
  Box,
  Text,
  HStack,
} from '@chakra-ui/react';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX } from 'react-icons/fi';

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
  textToSpeak?: string;
  isAssistantSpeaking?: boolean;
  onSpeakingComplete?: () => void;
}

export default function VoiceControls({
  onTranscript,
  textToSpeak,
  isAssistantSpeaking = false,
  onSpeakingComplete,
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: 'Speech Recognition Error',
          description: event.error,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      utteranceRef.current = new SpeechSynthesisUtterance();
      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
        onSpeakingComplete?.();
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onTranscript, onSpeakingComplete, toast]);

  useEffect(() => {
    if (textToSpeak && utteranceRef.current) {
      utteranceRef.current.text = textToSpeak;
      window.speechSynthesis.speak(utteranceRef.current);
      setIsSpeaking(true);
    }
  }, [textToSpeak]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Speech Recognition Not Available',
        description: 'Your browser does not support speech recognition.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
    } else if (textToSpeak && utteranceRef.current) {
      window.speechSynthesis.speak(utteranceRef.current);
    }
    setIsSpeaking(!isSpeaking);
  };

  return (
    <HStack spacing={2}>
      <Tooltip label={isListening ? 'Stop Recording' : 'Start Recording'}>
        <IconButton
          aria-label={isListening ? 'Stop Recording' : 'Start Recording'}
          icon={isListening ? <FiMicOff /> : <FiMic />}
          onClick={toggleListening}
          colorScheme={isListening ? 'red' : 'brand'}
          isDisabled={isAssistantSpeaking}
        />
      </Tooltip>
      <Tooltip label={isSpeaking ? 'Stop Speaking' : 'Start Speaking'}>
        <IconButton
          aria-label={isSpeaking ? 'Stop Speaking' : 'Start Speaking'}
          icon={isSpeaking ? <FiVolumeX /> : <FiVolume2 />}
          onClick={toggleSpeaking}
          colorScheme={isSpeaking ? 'red' : 'brand'}
          isDisabled={!textToSpeak || isListening}
        />
      </Tooltip>
      {(isListening || isSpeaking) && (
        <Box
          position="absolute"
          bottom="100%"
          left="50%"
          transform="translateX(-50%)"
          bg="brand.600"
          color="white"
          px={3}
          py={1}
          rounded="md"
          fontSize="sm"
          mb={2}
        >
          <Text>
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : ''}
          </Text>
        </Box>
      )}
    </HStack>
  );
} 