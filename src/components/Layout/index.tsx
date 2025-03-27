// src/components/Layout/index.tsx layout component
import { Box, useBreakpointValue } from '@chakra-ui/react'
import Sidebar from './Sidebar'
import { useState, useEffect } from 'react'

type LayoutProps = {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile)

  // Update sidebar visibility when screen size changes
  useEffect(() => {
    setSidebarVisible(!isMobile)
  }, [isMobile])

  return (
    <Box>
      {sidebarVisible && <Sidebar />}
      <Box 
        ml={sidebarVisible ? { base: "60px", md: "60px" } : "0"}
        transition="margin 0.2s"
        p={{ base: 4, md: 8 }}
        width="100%"
      >
        {children}
      </Box>
    </Box>
  )
}