import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Link,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createManga, deleteManga, fetchManga, fetchSuggested, updateManga } from '../../api/manga'
import { MangaForm } from '../../components/MangaForm'
import type { CreateMangaRequest, Manga, MangaStatus } from '../../types/manga'

const STATUSES: MangaStatus[] = ['Reading', 'Backlog', 'Completed', 'Dropped', 'Hiatus']

const STATUS_COLORS: Record<MangaStatus, string> = {
  Reading: 'blue',
  Backlog: 'gray',
  Completed: 'green',
  Dropped: 'red',
  Hiatus: 'orange',
}

type SortField = 'title' | 'updated_at'
type SortOrder = 'asc' | 'desc'

export function TableView() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingManga, setEditingManga] = useState<Manga | null>(null)
  const [statusFilter, setStatusFilter] = useState<MangaStatus | 'All'>('All')
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const { data: mangaList = [], isLoading } = useQuery({
    queryKey: ['manga'],
    queryFn: fetchManga,
  })

  // Fetch suggested readings automatically
  const { data: suggestedList = [] } = useQuery({
    queryKey: ['manga', 'suggested'],
    queryFn: fetchSuggested,
  })

  const createMutation = useMutation({
    mutationFn: createManga,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manga'] })
      toast({ title: 'Manga created', status: 'success', duration: 3000 })
      onClose()
      setEditingManga(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateMangaRequest }) => {
      return updateManga(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manga'] })
      toast({ title: 'Manga updated', status: 'success', duration: 3000 })
      onClose()
      setEditingManga(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteManga,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manga'] })
      toast({ title: 'Manga deleted', status: 'success', duration: 3000 })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const handleSubmit = (data: CreateMangaRequest) => {
    if (editingManga) {
      updateMutation.mutate({ id: editingManga.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (manga: Manga) => {
    setEditingManga(manga)
    onOpen()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this manga?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleAdd = () => {
    setEditingManga(null)
    onOpen()
  }

  const handleOpenAll = () => {
    const urls = mangaList.filter((m) => m.url).map((m) => m.url)
    for (const url of urls) {
      if (url) window.open(url, '_blank')
    }
  }

  const handleOpenReading = () => {
    const urls = mangaList.filter((m) => m.status === 'Reading' && m.url).map((m) => m.url)
    for (const url of urls) {
      if (url) window.open(url, '_blank')
    }
  }

  const filteredManga = mangaList.filter((m) => statusFilter === 'All' || m.status === statusFilter)

  const sortedManga = [...filteredManga].sort((a, b) => {
    const aVal = sortField === 'title' ? a.title : new Date(a.updated_at).getTime()
    const bVal = sortField === 'title' ? b.title : new Date(b.updated_at).getTime()

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    return sortOrder === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number)
  })

  return (
    <Box p={8}>
      {/* Suggested Readings Card - only show if there are suggestions */}
      {suggestedList.length > 0 && (
        <Alert status="info" mb={6} borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>📚 Suggested Readings ({suggestedList.length})</AlertTitle>
            <AlertDescription>
              <Text fontSize="sm" mt={2}>
                These manga haven't been updated in over a week:
              </Text>
              <VStack align="stretch" mt={3} gap={2}>
                {suggestedList.map((manga) => (
                  <HStack key={manga.id} justify="space-between" p={2} bg="blue.50" borderRadius="md">
                    <HStack gap={3}>
                      {manga.image && (
                        <Image src={manga.image} alt={manga.title} boxSize="40px" objectFit="cover" borderRadius="sm" />
                      )}
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{manga.title}</Text>
                        <Text fontSize="xs" color="gray.600">Chapter {manga.chapter}</Text>
                      </Box>
                    </HStack>
                    {manga.url && (
                      <Link href={manga.url} isExternal>
                        <Button size="xs" colorScheme="blue">Open</Button>
                      </Link>
                    )}
                  </HStack>
                ))}
              </VStack>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Flex justify="space-between" mb={6}>
        <HStack gap={4}>
          <Button colorScheme="blue" onClick={handleAdd}>
            Add Manga
          </Button>
          <Button variant="outline" onClick={handleOpenAll}>
            Open All URLs
          </Button>
          <Button variant="outline" onClick={handleOpenReading}>
            Open Reading URLs
          </Button>
        </HStack>

        <HStack gap={4}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MangaStatus | 'All')}
            width="auto"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            width="auto"
          >
            <option value="updated_at">Updated At</option>
            <option value="title">Title</option>
          </Select>

          <Button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </HStack>
      </Flex>

      {isLoading ? (
        <Box>Loading...</Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Image</Th>
              <Th>Title</Th>
              <Th>Status</Th>
              <Th>Chapter</Th>
              <Th>Updated At</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedManga.map((manga) => (
              <Tr key={manga.id}>
                <Td>
                  {manga.image ? (
                    <Image
                      src={manga.image}
                      alt={manga.title}
                      boxSize="50px"
                      objectFit="cover"
                    />
                  ) : (
                    <Box boxSize="50px" bg="gray.200" />
                  )}
                </Td>
                <Td>{manga.title}</Td>
                <Td>
                  <Badge colorScheme={STATUS_COLORS[manga.status]}>{manga.status}</Badge>
                </Td>
                <Td>{manga.chapter}</Td>
                <Td>{new Date(manga.updated_at).toLocaleDateString()}</Td>
                <Td>
                  <HStack gap={2}>
                    <IconButton
                      aria-label="Edit"
                      icon={<span>✏️</span>}
                      size="sm"
                      onClick={() => handleEdit(manga)}
                    />
                    <IconButton
                      aria-label="Delete"
                      icon={<span>🗑️</span>}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(manga.id)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <MangaForm
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        manga={editingManga}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </Box>
  )
}
