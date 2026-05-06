export type MangaStatus = 'Reading' | 'Backlog' | 'Completed' | 'Dropped' | 'Hiatus'

export interface Manga {
  id: string
  title: string
  image: string | null
  url: string | null
  status: MangaStatus
  chapter: number
  added_at: string
  updated_at: string
}

export interface CreateMangaRequest {
  title: string
  image?: File
  url?: string
  status: MangaStatus
  chapter: number
}

export interface UpdateMangaRequest {
  title?: string
  image?: File
  url?: string
  status?: MangaStatus
  chapter?: number
}
