interface AcademicYearRecord {
  id?: unknown
  starts_at?: unknown
  name?: unknown
  is_archived?: unknown
}

interface StudentGroupRecord {
  academic_year_id?: unknown
  course?: unknown
}

export function resolveGroupAcademicYearId(
  group: StudentGroupRecord | null | undefined,
  academicYears: AcademicYearRecord[]
): number | null {
  const admissionAcademicYearId = toNumberOrNull(group?.academic_year_id)

  if (admissionAcademicYearId === null) {
    return null
  }

  const course = Math.max(1, Math.floor(toNumberOrNull(group?.course) ?? 1))
  const orderedAcademicYears = academicYears
    .filter((academicYear) => Number(academicYear.is_archived ?? 0) !== 1)
    .filter(
      (academicYear): academicYear is AcademicYearRecord & { id: unknown } =>
        toNumberOrNull(academicYear.id) !== null
    )
    .sort(compareAcademicYears)
  const admissionIndex = orderedAcademicYears.findIndex(
    (academicYear) => toNumberOrNull(academicYear.id) === admissionAcademicYearId
  )

  if (admissionIndex < 0) {
    return course === 1 ? admissionAcademicYearId : null
  }

  return toNumberOrNull(orderedAcademicYears[admissionIndex + course - 1]?.id)
}

function compareAcademicYears(first: AcademicYearRecord, second: AcademicYearRecord): number {
  const firstSortValue = getAcademicYearSortValue(first)
  const secondSortValue = getAcademicYearSortValue(second)

  if (firstSortValue !== secondSortValue) {
    return firstSortValue.localeCompare(secondSortValue)
  }

  return (toNumberOrNull(first.id) ?? 0) - (toNumberOrNull(second.id) ?? 0)
}

function getAcademicYearSortValue(academicYear: AcademicYearRecord): string {
  const startsAt = String(academicYear.starts_at ?? '').trim()

  if (startsAt) {
    return startsAt
  }

  const startYear = String(academicYear.name ?? '').match(/\d{4}/)?.[0]

  return startYear ?? ''
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
