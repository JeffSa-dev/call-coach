import "@/styles/globals.css";
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react'
import type { AppProps } from "next/app";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'

const theme = extendTheme({
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'brand.700' : 'brand.50',
        color: props.colorMode === 'dark' ? 'brand.50' : 'brand.900',
      },
    }),
  },
  colors: {
    brand: {
      50: '#F2F0ED',  // Your foreground color
      100: '#E5E2DE',
      200: '#D8D4CF',
      300: '#BDCCD4',  // Your background color
      400: '#A9BCC6',
      500: '#95ACB8',
      600: '#819CAA',
      700: '#6D8C9C',
      800: '#597C8E',
      900: '#456C80',
    },
    accent: {
      50: '#E6F2F5',
      100: '#CCE5EB',
      200: '#B3D8E1',
      300: '#99CBD7',
      400: '#80BECD',
      500: '#66B1C3',
      600: '#4DA4B9',
      700: '#3397AF',
      800: '#1A8AA5',
      900: '#007D9B',
    }
  },
  fonts: {
    heading: 'Garamond, "Times New Roman", serif',
    body: 'Garamond, "Times New Roman", serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
})

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createClientComponentClient())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ChakraProvider>
      <SessionContextProvider supabaseClient={supabaseClient}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <ChakraProvider theme={theme}>
          <Component {...pageProps} />
        </ChakraProvider>
      </SessionContextProvider>
    </ChakraProvider>
  );
}
