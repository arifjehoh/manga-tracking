import type { CreateMangaRequest, Manga, UpdateMangaRequest } from '../types/manga'

const API_BASE = '/api'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export async function fetchManga(): Promise<Manga[]> {
  const response = await fetch(`${API_BASE}/manga`)
  const data = await handleResponse<Manga[] | null>(response)
  return data || []
}

export async function createManga(data: CreateMangaRequest): Promise<Manga> {
  const formData = new FormData()
  formData.append('title', data.title)
  formData.append('status', data.status)
  formData.append('chapter', data.chapter.toString())

  if (data.url) {
    formData.append('url', data.url)
  }

  if (data.image) {
    formData.append('image', data.image)
  }

  const response = await fetch(`${API_BASE}/manga`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse<Manga>(response)
}

export async function updateManga(id: string, data: UpdateMangaRequest): Promise<Manga> {
  const formData = new FormData()

  if (data.title !== undefined) {
    formData.append('title', data.title)
  }
  if (data.status !== undefined) {
    formData.append('status', data.status)
  }
  if (data.chapter !== undefined) {
    formData.append('chapter', data.chapter.toString())
  }
  if (data.url !== undefined) {
    formData.append('url', data.url)
  }
  if (data.image) {
    formData.append('image', data.image)
  }

  const response = await fetch(`${API_BASE}/manga/${id}`, {
    method: 'PUT',
    body: formData,
  })
  return handleResponse<Manga>(response)
}

export async function deleteManga(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/manga/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP error! status: ${response.status}`)
  }
}

export async function fetchSuggested(): Promise<Manga[]> {
  const response = await fetch(`${API_BASE}/manga/suggested`)
  const data = await handleResponse<Manga[] | null>(response)
  return data || []
}
