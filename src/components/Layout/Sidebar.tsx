// src/components/Layout/Sidebar.tsx Sidebar component  
import { Box, VStack, Icon, Text, IconButton, Tooltip, useBreakpointValue } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { FaHome, FaUpload, FaChartBar, FaComments, FaCog, FaBars, FaChevronLeft } from 'react-icons/fa'
import { useState, useEffect } from 'react'

const menuItems = [
  { name: 'Home', icon: FaHome, path: '/' },
  { name: 'Upload', icon: FaUpload, path: '/upload' },
  { name: 'Analysis', icon: FaChartBar, path: '/analysis' },
  { name: 'Coaching', icon: FaComments, path: '/coaching' },
  { name: 'Settings', icon: FaCog, path: '/settings' }
]

export default function Sidebar() {
  const router = useRouter()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(!isMobile)
  }, [isMobile])

  return (
    <>
      {/* Mobile Menu Button - Always Visible */}
      {isMobile && (
        <IconButton
          aria-label="Menu"
          icon={<FaBars />}
          position="fixed"
          top={4}
          left={4}
          zIndex={20}
          onClick={() => setIsOpen(!isOpen)}
          bg="white"
          shadow="md"
        />
      )}

      {/* Mobile Drawer */}
      <Box
        as="nav"
        bg="white"
        width={isMobile ? "240px" : (isCollapsed ? "60px" : "240px")}
        height="100vh"
        position="fixed"
        left={0}
        top={0}
        transform={!isOpen ? "translateX(-100%)" : "translateX(0)"}
        transition="transform 0.3s ease-in-out"
        shadow="lg"
        zIndex={15}
      >
        {/* Desktop Toggle Button */}
        {!isMobile && (
          <Box p={2} textAlign="center">
            <IconButton
              aria-label="Toggle Sidebar"
              icon={isCollapsed ? <FaBars /> : <FaChevronLeft />}
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              color="brand.600"
              _hover={{ bg: 'brand.50' }}
            />
          </Box>
        )}

        {/* Menu Items */}
        <VStack spacing={2} align="stretch" mt={isMobile ? 16 : 4}>
          {menuItems.map((item) => (
            <Tooltip
              key={item.name}
              label={isCollapsed && !isMobile ? item.name : ""}
              placement="right"
              hasArrow
              isDisabled={!isCollapsed || isMobile}
            >
              <Box
                px={isCollapsed && !isMobile ? 2 : 6}
                py={3}
                cursor="pointer"
                color={router.pathname === item.path ? 'accent.700' : 'brand.600'}
                bg={router.pathname === item.path ? 'brand.50' : 'transparent'}
                _hover={{
                  bg: 'brand.50',
                  color: 'accent.700'
                }}
                onClick={() => {
                  router.push(item.path)
                  if (isMobile) setIsOpen(false)
                }}
                textAlign={isCollapsed && !isMobile ? "center" : "left"}
              >
                <Icon as={item.icon} boxSize={5} />
                {(!isCollapsed || isMobile) && (
                  <Text 
                    display="inline-block"
                    ml={4}
                    fontWeight={router.pathname === item.path ? 'bold' : 'normal'}
                  >
                    {item.name}
                  </Text>
                )}
              </Box>
            </Tooltip>
          ))}
        </VStack>
      </Box>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={14}
          onClick={() => setIsOpen(false)}
          transition="opacity 0.3s"
        />
      )}
    </>
  )
}