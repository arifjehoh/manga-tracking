import { useSearchParams } from 'react-router-dom'
import type { MangaStatus } from '../types/manga'

export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const getStatuses = (): MangaStatus[] => {
    return searchParams.getAll('status') as MangaStatus[]
  }

  const setStatuses = (statuses: MangaStatus[]) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('status')
    statuses.forEach((status) => newParams.append('status', status))
    setSearchParams(newParams)
  }

  const toggleStatus = (status: MangaStatus) => {
    const current = getStatuses()
    const newStatuses = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setStatuses(newStatuses)
  }

  const getSortField = (): string => {
    return searchParams.get('sort') || 'updated_at'
  }

  const getSortOrder = (): 'asc' | 'desc' => {
    const order = searchParams.get('order')
    return order === 'asc' ? 'asc' : 'desc'
  }

  const setSort = (field: string, order: 'asc' | 'desc') => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('sort', field)
    newParams.set('order', order)
    setSearchParams(newParams)
  }

  const toggleSort = (field: string) => {
    const currentField = getSortField()
    const currentOrder = getSortOrder()

    if (currentField === field) {
      // Toggle order if same field
      setSort(field, currentOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to desc
      setSort(field, 'desc')
    }
  }

  return {
    getStatuses,
    setStatuses,
    toggleStatus,
    getSortField,
    getSortOrder,
    setSort,
    toggleSort,
  }
}
