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
  Input,
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
import {
  FiBookOpen,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiEdit2,
  FiExternalLink,
  FiMinus,
  FiPauseCircle,
  FiPlus,
  FiTrash2,
  FiXCircle,
} from 'react-icons/fi'
import { createManga, deleteManga, fetchManga, fetchSuggested, updateManga } from '../../api/manga'
import { MangaForm } from '../../components/MangaForm'
import type { CreateMangaRequest, Manga, MangaStatus } from '../../types/manga'
import { useQueryParams } from '../../utils/queryParams'
import { formatRelativeTime } from '../../utils/time'

const STATUSES: MangaStatus[] = ['Reading', 'Backlog', 'Completed', 'Dropped', 'Hiatus']

const STATUS_COLORS: Record<MangaStatus, string> = {
  Reading: 'blue',
  Backlog: 'gray',
  Completed: 'green',
  Dropped: 'red',
  Hiatus: 'orange',
}

const STATUS_ICONS: Record<MangaStatus, React.ReactElement> = {
  Reading: <FiBookOpen />,
  Backlog: <FiClock />,
  Completed: <FiCheckCircle />,
  Dropped: <FiXCircle />,
  Hiatus: <FiPauseCircle />,
}

type SortField = 'title' | 'updated_at'

export function TableView() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingManga, setEditingManga] = useState<Manga | null>(null)
  
  // Use query params for filtering and sorting
  const queryParams = useQueryParams()
  const selectedStatuses = queryParams.getStatuses()
  const sortField = queryParams.getSortField() as SortField
  const sortOrder = queryParams.getSortOrder()
  
  // Inline editing state
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>('')

  const { data: mangaList = [], isLoading } = useQuery({
    queryKey: ['manga'],
    queryFn: fetchManga,
  })

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
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateMangaRequest> }) => {
      return updateManga(id, data as CreateMangaRequest)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manga'] })
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
      onClose()
      setEditingManga(null)
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

  // Inline editing handlers
  const startEditingTitle = (manga: Manga) => {
    setEditingTitleId(manga.id)
    setTempValue(manga.title)
  }

  const saveTitle = (id: string) => {
    if (tempValue.trim()) {
      updateMutation.mutate({ id, data: { title: tempValue.trim() } })
    }
    setEditingTitleId(null)
    setTempValue('')
  }

  const startEditingChapter = (manga: Manga) => {
    setEditingChapterId(manga.id)
    setTempValue(manga.chapter.toString())
  }

  const saveChapter = (id: string) => {
    const chapter = Number.parseInt(tempValue, 10)
    if (!Number.isNaN(chapter) && chapter >= 0) {
      updateMutation.mutate({ id, data: { chapter } })
    }
    setEditingChapterId(null)
    setTempValue('')
  }

  const incrementChapter = (manga: Manga) => {
    updateMutation.mutate({ id: manga.id, data: { chapter: manga.chapter + 1 } })
  }

  const decrementChapter = (manga: Manga) => {
    if (manga.chapter > 0) {
      updateMutation.mutate({ id: manga.id, data: { chapter: manga.chapter - 1 } })
    }
  }

  const startEditingStatus = (id: string) => {
    setEditingStatusId(id)
  }

  const saveStatus = (id: string, status: MangaStatus) => {
    updateMutation.mutate({ id, data: { status } })
    setEditingStatusId(null)
  }

  const cancelEditingStatus = () => {
    setEditingStatusId(null)
  }

  const startEditingUrl = (manga: Manga) => {
    setEditingUrlId(manga.id)
    setTempValue(manga.url || '')
  }

  const saveUrl = (id: string) => {
    updateMutation.mutate({ id, data: { url: tempValue.trim() || undefined } })
    setEditingUrlId(null)
    setTempValue('')
  }

  // Client-side filtering - inverted: selectedStatuses are EXCLUDED
  const filteredManga = mangaList.filter((m) => {
    if (selectedStatuses.length === 0) return true
    return !selectedStatuses.includes(m.status) // Inverted: hide selected statuses
  })

  // Client-side sorting
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
                  <HStack key={manga.id} justify="space-between" p={2} bg="blue.50" _dark={{ bg: 'blue.900' }} borderRadius="md">
                    <HStack gap={3}>
                      {manga.image && (
                        <Image src={manga.image} alt={manga.title} boxSize="40px" objectFit="cover" borderRadius="sm" />
                      )}
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{manga.title}</Text>
                        <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>Chapter {manga.chapter}</Text>
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

      {/* Bulk action buttons */}
      <Flex justify="flex-start" mb={4} gap={3}>
        <Button colorScheme="blue" onClick={handleAdd}>
          Add Manga
        </Button>
        <Button variant="outline" leftIcon={<FiExternalLink />} onClick={handleOpenAll}>
          Open All URLs
        </Button>
        <Button variant="outline" leftIcon={<FiExternalLink />} onClick={handleOpenReading}>
          Open Reading URLs
        </Button>
      </Flex>

      {/* Status filter badges - just above table */}
      <HStack mb={3} spacing={2}>
        {STATUSES.map((status) => {
          const isHidden = selectedStatuses.includes(status)
          return (
            <Badge
              key={status}
              colorScheme={STATUS_COLORS[status]}
              variant={isHidden ? 'outline' : 'solid'}
              opacity={isHidden ? 0.5 : 1}
              cursor="pointer"
              size="sm"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
              onClick={() => queryParams.toggleStatus(status)}
              display="flex"
              alignItems="center"
              gap={1}
              textDecoration={isHidden ? 'line-through' : 'none'}
            >
              {STATUS_ICONS[status]}
              {status}
            </Badge>
          )
        })}
      </HStack>

      {isLoading ? (
        <Box>Loading...</Box>
      ) : (
        <Table variant="simple" size="sm" fontSize="sm">
          <Thead>
            <Tr>
              <Th
                cursor="pointer"
                onClick={() => queryParams.toggleSort('title')}
                userSelect="none"
                py={2}
                px={3}
              >
                <HStack spacing={2}>
                  <Text>Title</Text>
                  {sortField === 'title' && (
                    sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                  )}
                </HStack>
              </Th>
              <Th py={2} px={3}>Status</Th>
              <Th py={2} px={3}>Chapter</Th>
              <Th py={2} px={3}>URL</Th>
              <Th
                cursor="pointer"
                onClick={() => queryParams.toggleSort('updated_at')}
                userSelect="none"
                py={2}
                px={3}
              >
                <HStack spacing={2}>
                  <Text>Updated At</Text>
                  {sortField === 'updated_at' && (
                    sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                  )}
                </HStack>
              </Th>
              <Th py={2} px={3}>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedManga.map((manga) => (
              <Tr key={manga.id}>
                {/* Title - inline editing */}
                <Td py={2} px={3}>
                  {editingTitleId === manga.id ? (
                    <HStack spacing={1}>
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => saveTitle(manga.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(manga.id)
                          if (e.key === 'Escape') {
                            setEditingTitleId(null)
                            setTempValue('')
                          }
                        }}
                        size="sm"
                        autoFocus
                      />
                      <IconButton
                        aria-label="Cancel edit"
                        icon={<FiXCircle />}
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => {
                          setEditingTitleId(null)
                          setTempValue('')
                        }}
                      />
                    </HStack>
                  ) : (
                    <Text
                      cursor="pointer"
                      onClick={() => startEditingTitle(manga)}
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {manga.title}
                    </Text>
                  )}
                </Td>

                {/* Status - inline editing */}
                <Td py={2} px={3}>
                  {editingStatusId === manga.id ? (
                    <HStack spacing={1}>
                      <Select
                        value={manga.status}
                        onChange={(e) => saveStatus(manga.id, e.target.value as MangaStatus)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') cancelEditingStatus()
                        }}
                        size="sm"
                        autoFocus
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                      <IconButton
                        aria-label="Cancel edit"
                        icon={<FiXCircle />}
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={cancelEditingStatus}
                      />
                    </HStack>
                  ) : (
                    <Badge
                      colorScheme={STATUS_COLORS[manga.status]}
                      cursor="pointer"
                      onClick={() => startEditingStatus(manga.id)}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      width="fit-content"
                    >
                      {STATUS_ICONS[manga.status]}
                      {manga.status}
                    </Badge>
                  )}
                </Td>

                {/* Chapter - inline editing with +/- buttons */}
                <Td py={2} px={3}>
                  <HStack spacing={1}>
                    {editingChapterId === manga.id ? (
                      <>
                        <Input
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={() => saveChapter(manga.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveChapter(manga.id)
                            if (e.key === 'Escape') {
                              setEditingChapterId(null)
                              setTempValue('')
                            }
                          }}
                          size="sm"
                          width="70px"
                          autoFocus
                        />
                        <IconButton
                          aria-label="Cancel edit"
                          icon={<FiXCircle />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => {
                            setEditingChapterId(null)
                            setTempValue('')
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <IconButton
                          aria-label="Decrement chapter"
                          icon={<FiMinus />}
                          size="xs"
                          variant="ghost"
                          onClick={() => decrementChapter(manga)}
                          isDisabled={manga.chapter === 0 || updateMutation.isPending}
                        />
                        <Text
                          cursor="pointer"
                          onClick={() => startEditingChapter(manga)}
                          minW="30px"
                          textAlign="center"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          {manga.chapter}
                        </Text>
                        <IconButton
                          aria-label="Increment chapter"
                          icon={<FiPlus />}
                          size="xs"
                          variant="ghost"
                          onClick={() => incrementChapter(manga)}
                          isDisabled={updateMutation.isPending}
                        />
                      </>
                    )}
                  </HStack>
                </Td>

                {/* URL - inline editing */}
                <Td py={2} px={3}>
                  {editingUrlId === manga.id ? (
                    <HStack spacing={1}>
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => saveUrl(manga.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveUrl(manga.id)
                          if (e.key === 'Escape') {
                            setEditingUrlId(null)
                            setTempValue('')
                          }
                        }}
                        size="sm"
                        placeholder="https://..."
                        autoFocus
                      />
                      <IconButton
                        aria-label="Cancel edit"
                        icon={<FiXCircle />}
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => {
                          setEditingUrlId(null)
                          setTempValue('')
                        }}
                      />
                    </HStack>
                  ) : manga.url ? (
                    <HStack spacing={1}>
                      <Link
                        href={manga.url}
                        isExternal
                        color="blue.500"
                        _dark={{ color: 'blue.300' }}
                        display="flex"
                        alignItems="center"
                        gap={1}
                        fontSize="sm"
                      >
                        <FiExternalLink />
                        Link
                      </Link>
                      <Text
                        color="gray.500"
                        _dark={{ color: 'gray.400' }}
                        cursor="pointer"
                        fontSize="xs"
                        onClick={() => startEditingUrl(manga)}
                        ml={1}
                      >
                        (edit)
                      </Text>
                    </HStack>
                  ) : (
                    <Text
                      color="gray.400"
                      _dark={{ color: 'gray.500' }}
                      cursor="pointer"
                      onClick={() => startEditingUrl(manga)}
                      fontSize="sm"
                    >
                      —
                    </Text>
                  )}
                </Td>

                {/* Updated At - relative time */}
                <Td py={2} px={3}>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                    {formatRelativeTime(manga.updated_at)}
                  </Text>
                </Td>

                {/* Actions */}
                <Td py={2} px={3}>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label="Edit"
                      icon={<FiEdit2 />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(manga)}
                    />
                    <IconButton
                      aria-label="Delete"
                      icon={<FiTrash2 />}
                      size="sm"
                      variant="ghost"
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
