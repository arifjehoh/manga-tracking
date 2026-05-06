import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import {
  FiMoreVertical,
  FiExternalLink,
  FiBell,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPauseCircle,
} from 'react-icons/fi'
import { createManga, deleteManga, fetchManga, updateManga } from '../../api/manga'
import { MangaForm } from '../../components/MangaForm'
import type { CreateMangaRequest, Manga, MangaStatus } from '../../types/manga'

const STATUSES: MangaStatus[] = ['Reading', 'Backlog', 'Completed', 'Dropped', 'Hiatus']

const STATUS_COLORS: Record<MangaStatus, { light: string; dark: string }> = {
  Reading: { light: 'blue.50', dark: 'blue.900' },
  Backlog: { light: 'gray.50', dark: 'gray.800' },
  Completed: { light: 'green.50', dark: 'green.900' },
  Dropped: { light: 'red.50', dark: 'red.900' },
  Hiatus: { light: 'orange.50', dark: 'orange.900' },
}

const STATUS_ICONS: Record<MangaStatus, typeof FiBookOpen> = {
  Reading: FiBookOpen,
  Backlog: FiClock,
  Completed: FiCheckCircle,
  Dropped: FiXCircle,
  Hiatus: FiPauseCircle,
}

// Check if manga should be suggested (Reading status and not updated in 7+ days)
function isSuggestedManga(manga: Manga): boolean {
  if (manga.status !== 'Reading') return false
  const updatedAt = new Date(manga.updated_at)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
  return daysDiff >= 7
}

interface MangaCardProps {
  manga: Manga
  onEdit: () => void
  onDelete: () => void
}

function SortableMangaCard({ manga, onEdit, onDelete }: MangaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: manga.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isSuggested = isSuggestedManga(manga)
  const hasUrl = manga.url && manga.url.trim() !== ''

  const handleCardClick = () => {
    if (hasUrl) {
      window.open(manga.url!, '_blank', 'noopener,noreferrer')
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      cursor={hasUrl ? 'pointer' : 'grab'}
      _hover={{ shadow: 'md' }}
      onClick={handleCardClick}
      mb={3}
      position="relative"
      borderWidth={isSuggested ? '2px' : '1px'}
      borderColor={isSuggested ? 'yellow.400' : 'gray.200'}
      bg={isSuggested ? 'yellow.50' : 'white'}
      _dark={{
        borderColor: isSuggested ? 'yellow.400' : 'gray.700',
        bg: isSuggested ? 'yellow.900' : 'gray.800'
      }}
    >
      <CardBody p={3}>
        {/* Suggested indicator (top-left) */}
        {isSuggested && (
          <Box position="absolute" top={2} left={2} zIndex={2}>
            <Icon as={FiBell} color="yellow.600" _dark={{ color: 'yellow.400' }} boxSize={5} />
          </Box>
        )}

        {/* Three-dots menu (top-right) */}
        <Box
          position="absolute"
          top={2}
          right={2}
          zIndex={2}
          onClick={handleMenuClick}
        >
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              size="sm"
              variant="ghost"
              aria-label="Options"
            />
            <MenuList>
              <MenuItem icon={<FiEdit2 />} onClick={onEdit}>
                Edit
              </MenuItem>
              <MenuItem icon={<FiTrash2 />} onClick={onDelete} color="red.500" _dark={{ color: 'red.300' }}>
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>

        <VStack align="stretch" gap={2}>
          {manga.image && (
            <Image
              src={manga.image}
              alt={manga.title}
              h="120px"
              objectFit="cover"
              borderRadius="md"
            />
          )}
          <Text fontWeight="bold" fontSize="sm" noOfLines={2} pr={6}>
            {manga.title}
          </Text>
          <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
            Chapter {manga.chapter}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}

interface KanbanColumnProps {
  status: MangaStatus
  manga: Manga[]
  onEdit: (manga: Manga) => void
  onDelete: (manga: Manga) => void
  onOpenAll: () => void
}

function KanbanColumn({ status, manga, onEdit, onDelete, onOpenAll }: KanbanColumnProps) {
  // Sort by updated_at ASC (oldest first)
  const sortedManga = [...manga].sort((a, b) => {
    return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  })

  const bgColor = useColorModeValue(STATUS_COLORS[status].light, STATUS_COLORS[status].dark)

  return (
    <Box flex={1} minW="250px">
      <Box bg={bgColor} p={4} borderRadius="md" minH="calc(100vh - 250px)">
        <Flex justify="space-between" align="center" mb={4}>
          <HStack spacing={2}>
            <Icon as={STATUS_ICONS[status]} />
            <Heading size="md">
              {status} ({manga.length})
            </Heading>
          </HStack>
          <IconButton
            icon={<FiExternalLink />}
            aria-label="Open all URLs"
            size="sm"
            variant="ghost"
            onClick={onOpenAll}
            title="Open all URLs in new tabs"
          />
        </Flex>
        <SortableContext items={sortedManga.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <VStack align="stretch" gap={0}>
            {sortedManga.map((m) => (
              <SortableMangaCard
                key={m.id}
                manga={m}
                onEdit={() => onEdit(m)}
                onDelete={() => onDelete(m)}
              />
            ))}
          </VStack>
        </SortableContext>
      </Box>
    </Box>
  )
}

export function KanbanView() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingManga, setEditingManga] = useState<Manga | null>(null)
  const [activeManga, setActiveManga] = useState<Manga | null>(null)
  
  // Delete confirmation dialog
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure()
  const [deletingManga, setDeletingManga] = useState<Manga | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const { data: mangaList = [], isLoading } = useQuery({
    queryKey: ['manga'],
    queryFn: fetchManga,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateMangaRequest> }) => {
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

  const deleteMutation = useMutation({
    mutationFn: deleteManga,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manga'] })
      toast({ title: 'Manga deleted', status: 'success', duration: 3000 })
      onDeleteClose()
      setDeletingManga(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = (event: DragEndEvent) => {
    const manga = mangaList.find((m) => m.id === event.active.id)
    setActiveManga(manga || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveManga(null)

    if (!over) return

    const mangaId = active.id as string
    const manga = mangaList.find((m) => m.id === mangaId)
    if (!manga) return

    const targetStatus = over.data.current?.sortable?.containerId as MangaStatus | undefined

    if (targetStatus && manga.status !== targetStatus) {
      updateMutation.mutate({
        id: mangaId,
        data: {
          status: targetStatus,
        },
      })
    }
  }

  const handleEdit = (manga: Manga) => {
    setEditingManga(manga)
    onOpen()
  }

  const handleDeleteClick = (manga: Manga) => {
    setDeletingManga(manga)
    onDeleteOpen()
  }

  const handleDeleteConfirm = () => {
    if (deletingManga) {
      deleteMutation.mutate(deletingManga.id)
    }
  }

  const handleSubmit = (data: CreateMangaRequest) => {
    if (editingManga) {
      updateMutation.mutate({ id: editingManga.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleAdd = () => {
    setEditingManga(null)
    onOpen()
  }

  const handleOpenAll = (status: MangaStatus) => {
    const mangaInColumn = mangaByStatus[status]
    let openedCount = 0
    
    mangaInColumn.forEach((manga) => {
      if (manga.url && manga.url.trim() !== '') {
        window.open(manga.url, '_blank', 'noopener,noreferrer')
        openedCount++
      }
    })

    if (openedCount > 0) {
      toast({
        title: `Opened ${openedCount} URL${openedCount > 1 ? 's' : ''}`,
        status: 'info',
        duration: 2000,
      })
    } else {
      toast({
        title: 'No URLs to open',
        status: 'info',
        duration: 2000,
      })
    }
  }

  const mangaByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = mangaList.filter((m) => m.status === status)
      return acc
    },
    {} as Record<MangaStatus, Manga[]>,
  )

  if (isLoading) {
    return <Box p={8}>Loading...</Box>
  }

  return (
    <Box p={8}>
      <Flex justify="space-between" mb={6}>
        <Heading size="lg">Kanban Board</Heading>
        <Button colorScheme="blue" onClick={handleAdd}>
          Add Manga
        </Button>
      </Flex>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Flex gap={4} overflowX="auto">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              manga={mangaByStatus[status]}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onOpenAll={() => handleOpenAll(status)}
            />
          ))}
        </Flex>

        <DragOverlay>
          {activeManga && (
            <Card>
              <CardBody p={3}>
                <VStack align="stretch" gap={2}>
                  {activeManga.image && (
                    <Image
                      src={activeManga.image}
                      alt={activeManga.title}
                      h="120px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  )}
                  <Text fontWeight="bold" fontSize="sm">
                    {activeManga.title}
                  </Text>
                  <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
                    Chapter {activeManga.chapter}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <MangaForm
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        manga={editingManga}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Manga
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{deletingManga?.title}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                ml={3}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}
