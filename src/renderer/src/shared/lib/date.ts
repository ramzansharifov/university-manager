interface DateRangeFormatOptions {
  fallback?: string
  separator?: string
}

export function formatDateForDisplay(value: unknown, fallback = '—'): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return fallback
    }

    const day = String(value.getUTCDate()).padStart(2, '0')
    const month = String(value.getUTCMonth() + 1).padStart(2, '0')
    const year = String(value.getUTCFullYear()).padStart(4, '0')

    return `${day}.${month}.${year}`
  }

  const stringValue = String(value ?? '').trim()
  const match = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/)

  if (!match) {
    return fallback
  }

  const [, year, month, day] = match
  const candidate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  if (
    candidate.getUTCFullYear() !== Number(year) ||
    candidate.getUTCMonth() + 1 !== Number(month) ||
    candidate.getUTCDate() !== Number(day)
  ) {
    return fallback
  }

  return `${day}.${month}.${year}`
}

export function formatDateRangeForDisplay(
  startsAt: unknown,
  endsAt: unknown,
  options: DateRangeFormatOptions = {}
): string {
  const fallback = options.fallback ?? '—'
  const startLabel = formatDateForDisplay(startsAt, '')
  const endLabel = formatDateForDisplay(endsAt, '')

  if (!startLabel || !endLabel) {
    return fallback
  }

  return `${startLabel}${options.separator ?? '–'}${endLabel}`
}
