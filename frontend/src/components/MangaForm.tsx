import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import type { CreateMangaRequest, Manga, MangaStatus } from '../types/manga'

interface MangaFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMangaRequest) => void
  manga?: Manga | null
  isLoading?: boolean
}

const STATUSES: MangaStatus[] = ['Reading', 'Backlog', 'Completed', 'Dropped', 'Hiatus']

export function MangaForm({ isOpen, onClose, onSubmit, manga, isLoading }: MangaFormProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<MangaStatus>('Reading')
  const [chapter, setChapter] = useState(0)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Update form when manga prop changes
  useEffect(() => {
    if (manga) {
      setTitle(manga.title)
      setUrl(manga.url || '')
      setStatus(manga.status)
      setChapter(manga.chapter)
      setImagePreview(manga.image || null)
      setImage(null)
    } else {
      setTitle('')
      setUrl('')
      setStatus('Reading')
      setChapter(0)
      setImagePreview(null)
      setImage(null)
    }
  }, [manga, isOpen])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: CreateMangaRequest = {
      title,
      status,
      chapter,
      url: url || undefined,
      image: image || undefined,
    }
    onSubmit(data)
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{manga ? 'Edit Manga' : 'Add Manga'}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack gap={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel>Image</FormLabel>
                <Input type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview && (
                  <Box mt={2}>
                    <Image src={imagePreview} alt="Preview" maxH="200px" objectFit="contain" />
                  </Box>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>URL</FormLabel>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Status</FormLabel>
                <Select value={status} onChange={(e) => setStatus(e.target.value as MangaStatus)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Chapter</FormLabel>
                <NumberInput min={0} value={chapter} onChange={(_, val) => setChapter(val)}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack gap={3}>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue" isLoading={isLoading}>
                {manga ? 'Save' : 'Create'}
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
