import "@/styles/globals.css";
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react'
import type { AppProps } from "next/app";

const theme = extendTheme({
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  colors: {
    brand: {
      50: '#f7fafc',
      100: '#edf2f7',
      // Add more custom colors as needed
    },
  },
  fonts: {
    heading: 'Garamond, serif',
    body: 'Garamond, serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  );
}

export default MyApp;
