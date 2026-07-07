import type { AdminCrudRecord } from '../../../features/admin-crud'

export interface DisciplineProgress {
  disciplineId: number
  requiredPairs: number
  scheduledPairs: number
  conductedPairs: number
  remainingPairs: number
  isFullyScheduled: boolean
  hasCurriculumItem: boolean
}

export function getRequiredPairsFromCurriculumItem(
  curriculumItem: AdminCrudRecord | undefined
): number {
  if (!curriculumItem) {
    return 0
  }

  const lectures = toNumberOrZero(curriculumItem.hours_lectures)
  const practices = toNumberOrZero(curriculumItem.hours_practices)
  const labs = toNumberOrZero(curriculumItem.hours_labs)

  return Math.ceil((lectures + practices + labs) / 2)
}

export function createDisciplineProgressMap(params: {
  disciplines: AdminCrudRecord[]
  curriculumItems: AdminCrudRecord[]
  scheduleItems: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
}): Map<number, DisciplineProgress> {
  const curriculumItemById = createRecordMap(params.curriculumItems)
  const scheduleItemDisciplineIdById = new Map<number, number>()
  const scheduledPairsByDisciplineId = new Map<number, number>()
  const conductedPairsByDisciplineId = new Map<number, number>()

  params.scheduleItems.forEach((scheduleItem) => {
    const scheduleItemId = toNumberOrNull(scheduleItem.id)
    const disciplineId = toNumberOrNull(scheduleItem.discipline_id)

    if (scheduleItemId === null || disciplineId === null) {
      return
    }

    scheduleItemDisciplineIdById.set(scheduleItemId, disciplineId)
    scheduledPairsByDisciplineId.set(
      disciplineId,
      (scheduledPairsByDisciplineId.get(disciplineId) ?? 0) + 1
    )
  })

  params.lessonSessions.forEach((lessonSession) => {
    if (lessonSession.status !== 'conducted') {
      return
    }

    const scheduleItemId = toNumberOrNull(lessonSession.schedule_item_id)
    const disciplineId =
      scheduleItemId === null ? null : (scheduleItemDisciplineIdById.get(scheduleItemId) ?? null)

    if (disciplineId === null) {
      return
    }

    conductedPairsByDisciplineId.set(
      disciplineId,
      (conductedPairsByDisciplineId.get(disciplineId) ?? 0) + 1
    )
  })

  return new Map(
    params.disciplines
      .map((discipline) => {
        const disciplineId = toNumberOrNull(discipline.id)

        if (disciplineId === null) {
          return null
        }

        const curriculumItemId = toNumberOrNull(discipline.curriculum_item_id)
        const curriculumItem =
          curriculumItemId === null ? undefined : curriculumItemById.get(curriculumItemId)
        const requiredPairs = getRequiredPairsFromCurriculumItem(curriculumItem)
        const scheduledPairs = scheduledPairsByDisciplineId.get(disciplineId) ?? 0
        const conductedPairs = conductedPairsByDisciplineId.get(disciplineId) ?? 0

        return [
          disciplineId,
          {
            disciplineId,
            requiredPairs,
            scheduledPairs,
            conductedPairs,
            remainingPairs: Math.max(requiredPairs - scheduledPairs, 0),
            isFullyScheduled:
              curriculumItem !== undefined && requiredPairs > 0 && scheduledPairs >= requiredPairs,
            hasCurriculumItem: curriculumItem !== undefined
          }
        ] as const
      })
      .filter((entry): entry is readonly [number, DisciplineProgress] => entry !== null)
  )
}

function createRecordMap(records: AdminCrudRecord[]): Map<number, AdminCrudRecord> {
  return new Map(
    records
      .map((record) => [toNumberOrNull(record.id), record])
      .filter((entry): entry is [number, AdminCrudRecord] => entry[0] !== null)
  )
}

function toNumberOrZero(value: unknown): number {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
