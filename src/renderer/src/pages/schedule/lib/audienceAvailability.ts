import type { AdminCrudRecord } from '../../../features/admin-crud'

export type AudienceBusyReason = {
  kind: 'lesson' | 'final_assessment'
  audienceId: number
  startsAt: Date
  endsAt: Date
  title: string
  groupName?: string
  disciplineName?: string
  teacherName?: string
}

export type AudienceAvailability = {
  audience: AdminCrudRecord
  isFree: boolean
  reasons: AudienceBusyReason[]
}

export function combineDateAndTime(dateValue: unknown, timeValue: unknown): Date | null {
  const date = String(dateValue ?? '').trim()
  const time = String(timeValue ?? '').trim()

  if (!date || !time) {
    return null
  }

  const dateTime = new Date(`${date}T${time}:00`)

  return Number.isFinite(dateTime.getTime()) ? dateTime : null
}

export function doTimeRangesOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date
): boolean {
  return firstStart.getTime() < secondEnd.getTime() && secondStart.getTime() < firstEnd.getTime()
}

export function getDateOfWeekDay(week: AdminCrudRecord, dayOfWeek: number): string | null {
  const startsAt = String(week.starts_at ?? '').trim()

  if (!startsAt || !Number.isFinite(dayOfWeek)) {
    return null
  }

  const date = parseDate(startsAt)

  if (!date) {
    return null
  }

  date.setUTCDate(date.getUTCDate() + dayOfWeek - 1)

  return formatIsoDate(date)
}

export function buildAudienceAvailability({
  audiences,
  date,
  startsAt,
  endsAt,
  scheduleItems,
  finalAssessmentRounds,
  currentScheduleItemId,
  currentFinalAssessmentRoundId,
  weeks,
  lessonPeriods,
  groups = [],
  disciplines = [],
  teachers = [],
  finalAssessments = []
}: {
  audiences: AdminCrudRecord[]
  date: unknown
  startsAt: unknown
  endsAt: unknown
  scheduleItems: AdminCrudRecord[]
  finalAssessmentRounds: AdminCrudRecord[]
  currentScheduleItemId?: number | null
  currentFinalAssessmentRoundId?: number | null
  weeks: AdminCrudRecord[]
  lessonPeriods: AdminCrudRecord[]
  groups?: AdminCrudRecord[]
  disciplines?: AdminCrudRecord[]
  teachers?: AdminCrudRecord[]
  finalAssessments?: AdminCrudRecord[]
}): AudienceAvailability[] {
  const requestedStart = combineDateAndTime(date, startsAt)
  const requestedEnd = combineDateAndTime(date, endsAt)

  if (!requestedStart || !requestedEnd || requestedEnd.getTime() <= requestedStart.getTime()) {
    return audiences.map((audience) => ({
      audience,
      isFree: true,
      reasons: []
    }))
  }

  return audiences.map((audience) => {
    const audienceId = toNumberOrNull(audience.id)
    const reasons =
      audienceId === null
        ? []
        : [
            ...getLessonBusyReasons({
              audienceId,
              requestedStart,
              requestedEnd,
              scheduleItems,
              currentScheduleItemId,
              weeks,
              lessonPeriods,
              groups,
              disciplines,
              teachers
            }),
            ...getFinalAssessmentBusyReasons({
              audienceId,
              requestedStart,
              requestedEnd,
              finalAssessmentRounds,
              currentFinalAssessmentRoundId,
              disciplines,
              teachers,
              finalAssessments
            })
          ]

    return {
      audience,
      isFree: reasons.length === 0,
      reasons
    }
  })
}

export function getAudienceConflict({
  audienceId,
  date,
  startsAt,
  endsAt,
  scheduleItems,
  finalAssessmentRounds,
  currentScheduleItemId,
  currentFinalAssessmentRoundId,
  weeks,
  lessonPeriods,
  groups,
  disciplines,
  teachers,
  finalAssessments
}: {
  audienceId: number
  date: unknown
  startsAt: unknown
  endsAt: unknown
  scheduleItems: AdminCrudRecord[]
  finalAssessmentRounds: AdminCrudRecord[]
  currentScheduleItemId?: number | null
  currentFinalAssessmentRoundId?: number | null
  weeks: AdminCrudRecord[]
  lessonPeriods: AdminCrudRecord[]
  groups?: AdminCrudRecord[]
  disciplines?: AdminCrudRecord[]
  teachers?: AdminCrudRecord[]
  finalAssessments?: AdminCrudRecord[]
}): AudienceBusyReason | null {
  const availability = buildAudienceAvailability({
    audiences: [{ id: audienceId }],
    date,
    startsAt,
    endsAt,
    scheduleItems,
    finalAssessmentRounds,
    currentScheduleItemId,
    currentFinalAssessmentRoundId,
    weeks,
    lessonPeriods,
    groups,
    disciplines,
    teachers,
    finalAssessments
  })[0]

  return availability?.reasons[0] ?? null
}

export function formatBusyReasonTime(reason: AudienceBusyReason): string {
  return `${formatTime(reason.startsAt)}–${formatTime(reason.endsAt)}`
}

function getLessonBusyReasons({
  audienceId,
  requestedStart,
  requestedEnd,
  scheduleItems,
  currentScheduleItemId,
  weeks,
  lessonPeriods,
  groups,
  disciplines,
  teachers
}: {
  audienceId: number
  requestedStart: Date
  requestedEnd: Date
  scheduleItems: AdminCrudRecord[]
  currentScheduleItemId?: number | null
  weeks: AdminCrudRecord[]
  lessonPeriods: AdminCrudRecord[]
  groups: AdminCrudRecord[]
  disciplines: AdminCrudRecord[]
  teachers: AdminCrudRecord[]
}): AudienceBusyReason[] {
  return scheduleItems.flatMap((scheduleItem) => {
    if (
      Number(scheduleItem.audience_id) !== audienceId ||
      Number(scheduleItem.id) === currentScheduleItemId
    ) {
      return []
    }

    const lessonDate = getScheduleItemDate(scheduleItem, weeks)
    const lessonPeriod = findById(lessonPeriods, scheduleItem.lesson_period_id)
    const startsAt = combineDateAndTime(lessonDate, lessonPeriod?.starts_at)
    const endsAt = combineDateAndTime(lessonDate, lessonPeriod?.ends_at)

    if (
      !startsAt ||
      !endsAt ||
      !doTimeRangesOverlap(requestedStart, requestedEnd, startsAt, endsAt)
    ) {
      return []
    }

    const groupName = getRecordName(findById(groups, scheduleItem.group_id))
    const disciplineName = getRecordName(findById(disciplines, scheduleItem.discipline_id))
    const teacherName = getPersonName(findById(teachers, scheduleItem.teacher_id))

    return [
      {
        kind: 'lesson' as const,
        audienceId,
        startsAt,
        endsAt,
        title: `${groupName} · ${disciplineName}`,
        groupName,
        disciplineName,
        teacherName
      }
    ]
  })
}

function getFinalAssessmentBusyReasons({
  audienceId,
  requestedStart,
  requestedEnd,
  finalAssessmentRounds,
  currentFinalAssessmentRoundId,
  disciplines,
  teachers,
  finalAssessments
}: {
  audienceId: number
  requestedStart: Date
  requestedEnd: Date
  finalAssessmentRounds: AdminCrudRecord[]
  currentFinalAssessmentRoundId?: number | null
  disciplines: AdminCrudRecord[]
  teachers: AdminCrudRecord[]
  finalAssessments: AdminCrudRecord[]
}): AudienceBusyReason[] {
  return finalAssessmentRounds.flatMap((round) => {
    if (
      Number(round.audience_id) !== audienceId ||
      Number(round.id) === currentFinalAssessmentRoundId ||
      String(round.status ?? '') === 'cancelled'
    ) {
      return []
    }

    const startsAt = combineDateAndTime(round.assessment_date, round.starts_at)
    const endsAt = combineDateAndTime(round.assessment_date, round.ends_at)

    if (
      !startsAt ||
      !endsAt ||
      !doTimeRangesOverlap(requestedStart, requestedEnd, startsAt, endsAt)
    ) {
      return []
    }

    const assessment = findById(finalAssessments, round.final_assessment_id)
    const disciplineName = getRecordName(findById(disciplines, assessment?.discipline_id))
    const teacherName = getPersonName(findById(teachers, round.teacher_id))
    const title = `${getRecordName(assessment)} · ${getRoundLabel(round.round_type)}`

    return [
      {
        kind: 'final_assessment' as const,
        audienceId,
        startsAt,
        endsAt,
        title,
        disciplineName,
        teacherName
      }
    ]
  })
}

function getScheduleItemDate(
  scheduleItem: AdminCrudRecord,
  weeks: AdminCrudRecord[]
): string | null {
  const week = findById(weeks, scheduleItem.week_id)
  const dayOfWeek = toNumberOrNull(scheduleItem.day_of_week)

  return week && dayOfWeek !== null ? getDateOfWeekDay(week, dayOfWeek) : null
}

function getRoundLabel(value: unknown): string {
  const labels: Record<string, string> = {
    main: 'основной тур',
    retake: 'пересдача',
    commission: 'комиссия'
  }

  return labels[String(value ?? '')] ?? String(value ?? 'тур')
}

function findById(records: AdminCrudRecord[], id: unknown): AdminCrudRecord | null {
  const numericId = toNumberOrNull(id)

  return numericId === null
    ? null
    : (records.find((record) => Number(record.id) === numericId) ?? null)
}

function getRecordName(record: AdminCrudRecord | null | undefined): string {
  if (!record) {
    return '—'
  }

  return record.name ? String(record.name) : `#${String(record.id)}`
}

function getPersonName(record: AdminCrudRecord | null | undefined): string | undefined {
  if (!record) {
    return undefined
  }

  const name = [record.last_name, record.first_name, record.middle_name]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ')

  return name || getRecordName(record)
}

function parseDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  const date = new Date(Date.UTC(year, month - 1, day))

  return Number.isFinite(date.getTime()) ? date : null
}

function formatIsoDate(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(
    value.getUTCDate()
  ).padStart(2, '0')}`
}

function formatTime(value: Date): string {
  return value.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
