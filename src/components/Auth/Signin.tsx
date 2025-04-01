// src/components/Auth/Signin.tsx
import { Box, Button, VStack, Text } from '@chakra-ui/react'
import { FaGoogle } from 'react-icons/fa'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignIn() {
  const supabase = createClientComponentClient()

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <Box maxW="sm" mx="auto" mt={8} p={6} borderRadius="lg" boxShadow="base" bg="white">
      <VStack spacing={6} align="center">
        <Text fontSize="2xl" fontWeight="bold">Welcome</Text>
        <Button
          leftIcon={<FaGoogle />}
          onClick={handleGoogleSignIn}
          size="lg"
          width="full"
          colorScheme="blue"
        >
          Sign in with Google
        </Button>
      </VStack>
    </Box>
  )
}