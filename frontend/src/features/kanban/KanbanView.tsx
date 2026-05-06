import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  Image,
  Text,
  useDisclosure,
  useToast,
  VStack,
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
import { useState } from 'react'
import { createManga, fetchManga, updateManga } from '../../api/manga'
import { MangaForm } from '../../components/MangaForm'
import type { CreateMangaRequest, Manga, MangaStatus } from '../../types/manga'

const STATUSES: MangaStatus[] = ['Reading', 'Backlog', 'Completed', 'Dropped', 'Hiatus']

const STATUS_COLORS: Record<MangaStatus, string> = {
  Reading: 'blue.50',
  Backlog: 'gray.50',
  Completed: 'green.50',
  Dropped: 'red.50',
  Hiatus: 'orange.50',
}

interface MangaCardProps {
  manga: Manga
  onClick: () => void
}

function SortableMangaCard({ manga, onClick }: MangaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: manga.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      cursor="grab"
      _hover={{ shadow: 'md' }}
      onClick={onClick}
      mb={3}
    >
      <CardBody p={3}>
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
          <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
            {manga.title}
          </Text>
          <Text fontSize="xs" color="gray.600">
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
  onCardClick: (manga: Manga) => void
}

function KanbanColumn({ status, manga, onCardClick }: KanbanColumnProps) {
  return (
    <Box flex={1} minW="250px">
      <Box bg={STATUS_COLORS[status]} p={4} borderRadius="md" minH="calc(100vh - 250px)">
        <Heading size="md" mb={4}>
          {status} ({manga.length})
        </Heading>
        <SortableContext items={manga.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <VStack align="stretch" gap={0}>
            {manga.map((m) => (
              <SortableMangaCard key={m.id} manga={m} onClick={() => onCardClick(m)} />
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

  const handleCardClick = (manga: Manga) => {
    setEditingManga(manga)
    onOpen()
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
              onCardClick={handleCardClick}
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
                  <Text fontSize="xs" color="gray.600">
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
    </Box>
  )
}
