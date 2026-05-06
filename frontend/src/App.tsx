import { Box } from '@chakra-ui/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { KanbanView } from './features/kanban/KanbanView'
import { TableView } from './features/table/TableView'

function App() {
  return (
    <Box minH="100vh" bg="white">
      <Navigation />
      <Routes>
        <Route path="/" element={<Navigate to="/table" replace />} />
        <Route path="/table" element={<TableView />} />
        <Route path="/kanban" element={<KanbanView />} />
      </Routes>
    </Box>
  )
}

export default App
