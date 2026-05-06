import { Box, Button, Flex, Heading, IconButton, useColorMode } from '@chakra-ui/react'
import { FiMoon, FiSun } from 'react-icons/fi'
import { Link, useLocation } from 'react-router-dom'

export function Navigation() {
  const location = useLocation()
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <Box bg="gray.100" py={3} px={8} borderBottom="1px" borderColor="gray.200" _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}>
      <Flex justify="space-between" align="center">
        <Heading size="md">Manga Tracker</Heading>
        <Flex gap={3} align="center">
          <Button
            as={Link}
            to="/table"
            colorScheme={location.pathname === '/table' ? 'blue' : 'gray'}
            variant={location.pathname === '/table' ? 'solid' : 'ghost'}
          >
            Table View
          </Button>
          <Button
            as={Link}
            to="/kanban"
            colorScheme={location.pathname === '/kanban' ? 'blue' : 'gray'}
            variant={location.pathname === '/kanban' ? 'solid' : 'ghost'}
          >
            Kanban View
          </Button>
          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            variant="ghost"
            size="md"
          />
        </Flex>
      </Flex>
    </Box>
  )
}
