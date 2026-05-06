export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  // < 24 hours: "2h 30m ago"
  if (diffHours < 24) {
    if (diffHours === 0) {
      return diffMin === 0 ? 'just now' : `${diffMin}m ago`
    }
    const remainingMin = diffMin % 60
    return remainingMin > 0 ? `${diffHours}h ${remainingMin}m ago` : `${diffHours}h ago`
  }

  // 1-6 days: "3 days ago"
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  }

  // 7-29 days: "2 weeks ago"
  if (diffDays < 30) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`
  }

  // 30+ days but < 1 year: "2 months ago"
  if (diffYears < 1) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`
  }

  // 1+ year: "1 year, 3 months ago"
  const remainingMonths = diffMonths % 12
  if (remainingMonths > 0) {
    const yearStr = diffYears === 1 ? '1 year' : `${diffYears} years`
    const monthStr = remainingMonths === 1 ? '1 month' : `${remainingMonths} months`
    return `${yearStr}, ${monthStr} ago`
  }
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`
}
