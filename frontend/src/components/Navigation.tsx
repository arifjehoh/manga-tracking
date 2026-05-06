import { Box, Button, Flex, Heading } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'

export function Navigation() {
  const location = useLocation()

  return (
    <Box bg="gray.100" py={4} px={8} borderBottom="1px" borderColor="gray.200">
      <Flex justify="space-between" align="center">
        <Heading size="lg">Manga Tracker</Heading>
        <Flex gap={4}>
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
        </Flex>
      </Flex>
    </Box>
  )
}
