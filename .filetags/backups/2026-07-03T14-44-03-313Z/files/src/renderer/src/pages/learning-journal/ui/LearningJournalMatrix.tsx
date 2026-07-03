import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { FiRefreshCcw } from 'react-icons/fi'
import type { AdminCrudRecord } from '../../../features/admin-crud'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../shared/ui'
import { formatDateForDisplay } from '../../../shared/lib/date'

const emptySelectValue = '__empty__'

const weekDayLabels = [
  { value: 1, shortLabel: 'Пн', label: 'Понедельник' },
  { value: 2, shortLabel: 'Вт', label: 'Вторник' },
  { value: 3, shortLabel: 'Ср', label: 'Среда' },
  { value: 4, shortLabel: 'Чт', label: 'Четверг' },
  { value: 5, shortLabel: 'Пт', label: 'Пятница' },
  { value: 6, shortLabel: 'Сб', label: 'Суббота' },
  { value: 7, shortLabel: 'Вс', label: 'Воскресенье' }
]

type JournalFilterOption = {
  value: string
  label: string
}

type JournalColumn = {
  id: string
  scheduleItem: AdminCrudRecord
  disciplineName: string
  weekLabel: string
  date: string
  dayOfWeek: number
  dayLabel: string
  lessonPeriodLabel: string
  lessonPeriodNumber: number | null
}

export function LearningJournalMatrix(): ReactElement {
  const [faculties, setFaculties] = useState<AdminCrudRecord[]>([])
  const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
  const [groups, setGroups] = useState<AdminCrudRecord[]>([])
  const [students, setStudents] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [weeks, setWeeks] = useState<AdminCrudRecord[]>([])
  const [scheduleItems, setScheduleItems] = useState<AdminCrudRecord[]>([])
  const [lessonPeriods, setLessonPeriods] = useState<AdminCrudRecord[]>([])
  const [lessonSessions, setLessonSessions] = useState<AdminCrudRecord[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AdminCrudRecord[]>([])
  const [attendanceStatuses, setAttendanceStatuses] = useState<AdminCrudRecord[]>([])

  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')

  const loadData = useCallback(async (): Promise<void> => {
    const [
      facultiesResult,
      specialtiesResult,
      groupsResult,
      studentsResult,
      subjectsResult,
      disciplinesResult,
      weeksResult,
      scheduleItemsResult,
      lessonPeriodsResult,
      lessonSessionsResult,
      attendanceRecordsResult,
      attendanceStatusesResult
    ] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'faculties',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'specialties',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'student_groups',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'students',
        page: 1,
        pageSize: 3000,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'subjects',
        page: 1,
        pageSize: 1000,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'disciplines',
        page: 1,
        pageSize: 3000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'weeks',
        page: 1,
        pageSize: 2000,
        orderBy: 'starts_at',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'schedule_items',
        page: 1,
        pageSize: 5000,
        orderBy: 'day_of_week',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'lesson_periods',
        page: 1,
        pageSize: 200,
        orderBy: 'number',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'lesson_sessions',
        page: 1,
        pageSize: 5000,
        orderBy: 'lesson_date',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'attendance_records',
        page: 1,
        pageSize: 15000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'dictionary_items',
        page: 1,
        pageSize: 100,
        filters: { dictionary_key: 'attendance_statuses' },
        orderBy: 'sort_order',
        orderDirection: 'asc'
      })
    ])

    setFaculties(facultiesResult.items)
    setSpecialties(specialtiesResult.items)
    setGroups(groupsResult.items)
    setStudents(studentsResult.items)
    setSubjects(subjectsResult.items)
    setDisciplines(disciplinesResult.items)
    setWeeks(weeksResult.items)
    setScheduleItems(scheduleItemsResult.items)
    setLessonPeriods(lessonPeriodsResult.items)
    setLessonSessions(lessonSessionsResult.items)
    setAttendanceRecords(attendanceRecordsResult.items)
    setAttendanceStatuses(attendanceStatusesResult.items)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  const selectedFaculty = useMemo(
    () => faculties.find((faculty) => String(faculty.id) === selectedFacultyId) ?? null,
    [faculties, selectedFacultyId]
  )

  const selectedSpecialty = useMemo(
    () => specialties.find((specialty) => String(specialty.id) === selectedSpecialtyId) ?? null,
    [specialties, selectedSpecialtyId]
  )

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  )

  const filteredSpecialties = useMemo(() => {
    if (!selectedFacultyId) {
      return []
    }

    return specialties.filter(
      (specialty) => Number(specialty.faculty_id) === Number(selectedFacultyId)
    )
  }, [selectedFacultyId, specialties])

  const filteredGroups = useMemo(() => {
    if (!selectedSpecialtyId) {
      return []
    }

    return groups.filter((group) => Number(group.specialty_id) === Number(selectedSpecialtyId))
  }, [groups, selectedSpecialtyId])

  const groupStudents = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    return students.filter((student) => Number(student.group_id) === Number(selectedGroupId))
  }, [selectedGroupId, students])

  const disciplineById = useMemo(() => createRecordMap(disciplines), [disciplines])
  const subjectNameById = useMemo(() => createRecordNameMap(subjects), [subjects])
  const weekById = useMemo(() => createRecordMap(weeks), [weeks])
  const lessonPeriodById = useMemo(() => createRecordMap(lessonPeriods), [lessonPeriods])

  const journalColumns = useMemo<JournalColumn[]>(() => {
    if (!selectedGroupId) {
      return []
    }

    return scheduleItems
      .filter((scheduleItem) => Number(scheduleItem.group_id) === Number(selectedGroupId))
      .map((scheduleItem) =>
        createJournalColumn({
          scheduleItem,
          disciplineById,
          subjectNameById,
          weekById,
          lessonPeriodById
        })
      )
      .sort(compareJournalColumns)
  }, [disciplineById, lessonPeriodById, scheduleItems, selectedGroupId, subjectNameById, weekById])

  const studentColumnWidth = useMemo(() => {
    const longestNameLength = groupStudents.reduce(
      (length, student) => Math.max(length, getPersonFullName(student).length),
      0
    )
    const widthInCharacters = Math.min(Math.max(longestNameLength + 2, 18), 38)

    return `${widthInCharacters}ch`
  }, [groupStudents])

  function handleFacultyChange(value: string): void {
    setSelectedFacultyId(value)
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
  }

  function handleSpecialtyChange(value: string): void {
    setSelectedSpecialtyId(value)
    setSelectedGroupId('')
  }

  function handleGroupChange(value: string): void {
    setSelectedGroupId(value)
  }

  function resetFilters(): void {
    setSelectedFacultyId('')
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
  }

  function getLessonSession(column: JournalColumn): AdminCrudRecord | undefined {
    const scheduleItemId = toNumberOrNull(column.scheduleItem.id)
    const weekId = toNumberOrNull(column.scheduleItem.week_id)

    if (scheduleItemId === null) {
      return undefined
    }

    return lessonSessions.find((session) => {
      const sessionScheduleItemId = toNumberOrNull(session.schedule_item_id)
      const sessionWeekId = toNumberOrNull(session.week_id)

      return sessionScheduleItemId === scheduleItemId && (weekId === null || sessionWeekId === weekId)
    })
  }

  function getAttendanceRecord(
    student: AdminCrudRecord,
    column: JournalColumn
  ): AdminCrudRecord | undefined {
    const session = getLessonSession(column)

    if (!session?.id) {
      return undefined
    }

    return attendanceRecords.find(
      (record) =>
        Number(record.lesson_session_id) === Number(session.id) &&
        Number(record.student_id) === Number(student.id)
    )
  }

  function getAttendanceStatusById(statusId: unknown): AdminCrudRecord | null {
    const id = toNumberOrNull(statusId)

    if (id === null) {
      return null
    }

    return attendanceStatuses.find((status) => Number(status.id) === id) ?? null
  }

  function getAttendanceStatusKey(student: AdminCrudRecord, column: JournalColumn): string | null {
    const record = getAttendanceRecord(student, column)
    const status = record ? getAttendanceStatusById(record.attendance_status_id) : null

    return status ? String(status.item_key ?? '') : null
  }

  function renderJournalCellValue(student: AdminCrudRecord, column: JournalColumn): string {
    const statusKey = getAttendanceStatusKey(student, column)

    if (!statusKey) {
      return ''
    }

    const labels: Record<string, string> = {
      present: 'П',
      absent: 'Н',
      excused: 'УП',
      not_held: 'НБ',
      late: 'О',
      online: 'Д'
    }

    return labels[statusKey] ?? statusKey.slice(0, 2).toUpperCase()
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Фильтры журнала</CardTitle>
              <CardDescription>
                Выбери факультет, специальность и группу. Журнал ниже строится по расписанию
                выбранной группы.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void loadData()}>
                <FiRefreshCcw />
                Обновить
              </Button>

              <Button variant="ghost" onClick={resetFilters}>
                Сбросить
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <JournalFilterSelect
              label="Факультет"
              value={selectedFacultyId}
              placeholder="Выбери факультет"
              options={faculties.map(toFilterOption)}
              onChange={handleFacultyChange}
            />

            <JournalFilterSelect
              label="Специальность"
              value={selectedSpecialtyId}
              placeholder={selectedFacultyId ? 'Выбери специальность' : 'Сначала факультет'}
              disabled={!selectedFacultyId}
              options={filteredSpecialties.map(toFilterOption)}
              onChange={handleSpecialtyChange}
            />

            <JournalFilterSelect
              label="Группа"
              value={selectedGroupId}
              placeholder={selectedSpecialtyId ? 'Выбери группу' : 'Сначала специальность'}
              disabled={!selectedSpecialtyId}
              options={filteredGroups.map(toFilterOption)}
              onChange={handleGroupChange}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedFaculty ? <Badge>{getRecordName(selectedFaculty)}</Badge> : null}
            {selectedSpecialty ? <Badge>{getRecordName(selectedSpecialty)}</Badge> : null}
            {selectedGroup ? <Badge>{getRecordName(selectedGroup)}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {!selectedGroup ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Выбери группу, чтобы открыть журнал.
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Фильтры по дисциплинам и неделям убраны: журнал будет выглядеть как общая ведомость
              занятий группы.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {selectedGroup ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>Журнал группы: {getRecordName(selectedGroup)}</CardTitle>
                <CardDescription>
                  Слева — студенты, сверху — дата и день недели, ниже — дисциплины вертикально.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="muted">Студентов: {groupStudents.length}</Badge>
                <Badge variant="muted">Занятий: {journalColumns.length}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {groupStudents.length === 0 ? (
              <EmptyState text="В этой группе пока нет студентов." />
            ) : null}

            {groupStudents.length > 0 && journalColumns.length === 0 ? (
              <EmptyState text="Для этой группы пока нет записей расписания." />
            ) : null}

            {groupStudents.length > 0 && journalColumns.length > 0 ? (
              <div className="grid gap-4">
                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                  <table className="w-full table-fixed border-collapse text-xs">
                    <colgroup>
                      <col style={{ width: studentColumnWidth }} />
                      {journalColumns.map((column) => (
                        <col key={column.id} style={{ width: '4.5rem' }} />
                      ))}
                    </colgroup>

                    <thead>
                      <tr className="bg-[var(--color-surface-muted)]">
                        <th
                          rowSpan={3}
                          className="sticky left-0 z-30 whitespace-nowrap border-b border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]"
                        >
                          Студент
                        </th>

                        {journalColumns.map((column) => (
                          <th
                            key={`${column.id}-date`}
                            className="border-b border-r border-[var(--color-border)] px-1 py-2 text-center font-semibold text-[var(--color-text)] last:border-r-0"
                            title={`${formatJournalDate(column.date)} · ${column.weekLabel}`}
                          >
                            {formatJournalDate(column.date)}
                          </th>
                        ))}
                      </tr>

                      <tr className="bg-[var(--color-surface-muted)]">
                        {journalColumns.map((column) => (
                          <th
                            key={`${column.id}-day`}
                            className="border-b border-r border-[var(--color-border)] px-1 py-2 text-center font-medium text-[var(--color-text-muted)] last:border-r-0"
                            title={getWeekDayLabel(column.dayOfWeek)}
                          >
                            <span>{column.dayLabel}</span>
                            <span className="mt-0.5 block text-[10px] font-normal">
                              {column.lessonPeriodLabel}
                            </span>
                          </th>
                        ))}
                      </tr>

                      <tr className="bg-[var(--color-surface)]">
                        {journalColumns.map((column) => (
                          <th
                            key={`${column.id}-discipline`}
                            className="h-40 border-b border-r border-[var(--color-border)] px-1 py-2 text-center align-bottom last:border-r-0"
                            title={column.disciplineName}
                          >
                            <div className="mx-auto flex h-32 items-center justify-center overflow-hidden">
                              <span className="max-h-32 rotate-180 text-left text-[11px] font-semibold leading-tight text-[var(--color-text)] [writing-mode:vertical-rl]">
                                {column.disciplineName}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {groupStudents.map((student) => (
                        <tr
                          key={String(student.id)}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td
                            className="sticky left-0 z-20 truncate whitespace-nowrap border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
                            title={getPersonFullName(student)}
                          >
                            {getPersonFullName(student)}
                          </td>

                          {journalColumns.map((column) => {
                            const statusKey = getAttendanceStatusKey(student, column)
                            const value = renderJournalCellValue(student, column)

                            return (
                              <td
                                key={`${student.id}-${column.id}`}
                                className={getJournalCellClassName(statusKey)}
                                title={createJournalCellTitle(student, column, statusKey)}
                              >
                                {value || (
                                  <span className="text-[var(--color-text-muted)] opacity-40">·</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="muted">П = присутствовал</Badge>
                  <Badge variant="muted">Н = отсутствовал</Badge>
                  <Badge variant="muted">УП = уважительная причина</Badge>
                  <Badge variant="muted">НБ = не было</Badge>
                  <Badge variant="muted">О = опоздал</Badge>
                  <Badge variant="muted">Д = дистанционно</Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function JournalFilterSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange
}: {
  label: string
  value: string
  options: JournalFilterOption[]
  placeholder: string
  disabled?: boolean
  onChange: (value: string) => void
}): ReactElement {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <Select
        value={value || emptySelectValue}
        disabled={disabled}
        onValueChange={(nextValue) => onChange(nextValue === emptySelectValue ? '' : nextValue)}
      >
        <SelectTrigger className="min-w-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={emptySelectValue}>Не выбрано</SelectItem>

          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

function EmptyState({ text }: { text: string }): ReactElement {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
      {text}
    </div>
  )
}

function createJournalColumn({
  scheduleItem,
  disciplineById,
  subjectNameById,
  weekById,
  lessonPeriodById
}: {
  scheduleItem: AdminCrudRecord
  disciplineById: Map<number, AdminCrudRecord>
  subjectNameById: Map<number, string>
  weekById: Map<number, AdminCrudRecord>
  lessonPeriodById: Map<number, AdminCrudRecord>
}): JournalColumn {
  const disciplineId = toNumberOrNull(scheduleItem.discipline_id)
  const discipline = disciplineId === null ? null : (disciplineById.get(disciplineId) ?? null)
  const weekId = toNumberOrNull(scheduleItem.week_id)
  const week = weekId === null ? null : (weekById.get(weekId) ?? null)
  const lessonPeriodId = toNumberOrNull(scheduleItem.lesson_period_id)
  const lessonPeriod = lessonPeriodId === null ? null : (lessonPeriodById.get(lessonPeriodId) ?? null)
  const dayOfWeek = normalizeDayOfWeek(scheduleItem.day_of_week)
  const date = getScheduleItemDate(scheduleItem, week, dayOfWeek)
  const lessonPeriodNumber = toNumberOrNull(lessonPeriod?.number)

  return {
    id: `schedule:${String(scheduleItem.id)}`,
    scheduleItem,
    disciplineName: discipline ? getDisciplineName(discipline, subjectNameById) : 'Дисциплина',
    weekLabel: week ? getWeekLabel(week) : 'Без недели',
    date,
    dayOfWeek,
    dayLabel: getDayShortName(dayOfWeek),
    lessonPeriodLabel: lessonPeriodNumber === null ? 'пара' : `${lessonPeriodNumber} пара`,
    lessonPeriodNumber
  }
}

function toFilterOption(record: AdminCrudRecord): JournalFilterOption {
  return {
    value: String(record.id),
    label: getRecordName(record)
  }
}

function createRecordMap(items: AdminCrudRecord[]): Map<number, AdminCrudRecord> {
  return new Map(
    items
      .map((item) => [toNumberOrNull(item.id), item] as const)
      .filter((entry): entry is readonly [number, AdminCrudRecord] => entry[0] !== null)
  )
}

function createRecordNameMap(items: AdminCrudRecord[]): Map<number, string> {
  return new Map(
    items
      .map((item) => [toNumberOrNull(item.id), getRecordName(item)] as const)
      .filter((entry): entry is readonly [number, string] => entry[0] !== null)
  )
}

function getDisciplineName(
  discipline: AdminCrudRecord,
  subjectNameById: Map<number, string>
): string {
  if (discipline.name) {
    return String(discipline.name)
  }

  const subjectId = toNumberOrNull(discipline.subject_id)

  if (subjectId !== null) {
    return subjectNameById.get(subjectId) ?? `#${subjectId}`
  }

  return getRecordName(discipline)
}

function getRecordName(record: AdminCrudRecord): string {
  return record.name ? String(record.name) : `#${String(record.id)}`
}

function getPersonFullName(record: AdminCrudRecord): string {
  const fullName = [record.last_name, record.first_name, record.middle_name]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ')

  return fullName || getRecordName(record)
}

function getWeekLabel(week: AdminCrudRecord): string {
  return `${String(week.number ?? '')} неделя`
}

function getWeekDayLabel(dayOfWeek: number): string {
  return weekDayLabels.find((day) => day.value === dayOfWeek)?.label ?? String(dayOfWeek)
}

function getDayShortName(dayOfWeek: number): string {
  return weekDayLabels.find((day) => day.value === dayOfWeek)?.shortLabel ?? String(dayOfWeek)
}

function normalizeDayOfWeek(value: unknown): number {
  const dayOfWeek = toNumberOrNull(value)

  if (dayOfWeek !== null && dayOfWeek >= 1 && dayOfWeek <= 7) {
    return dayOfWeek
  }

  return 1
}

function getScheduleItemDate(
  scheduleItem: AdminCrudRecord,
  week: AdminCrudRecord | null,
  dayOfWeek: number
): string {
  const weekStart = String(week?.starts_at ?? scheduleItem.starts_on ?? '').trim()

  if (!weekStart) {
    return ''
  }

  return formatDate(addDays(parseDate(weekStart), dayOfWeek - 1))
}

function formatJournalDate(value: string): string {
  return value ? formatDateForDisplay(value) : '—'
}

function createJournalCellTitle(
  student: AdminCrudRecord,
  column: JournalColumn,
  statusKey: string | null
): string {
  const statusLabel = statusKey ? getAttendanceStatusLabel(statusKey) : 'Пусто'

  return [
    getPersonFullName(student),
    column.disciplineName,
    `${formatJournalDate(column.date)} · ${column.dayLabel} · ${column.lessonPeriodLabel}`,
    statusLabel
  ].join('\n')
}

function getAttendanceStatusLabel(statusKey: string): string {
  const labels: Record<string, string> = {
    present: 'Присутствовал',
    absent: 'Отсутствовал',
    excused: 'Уважительная причина',
    not_held: 'Не было',
    late: 'Опоздал',
    online: 'Дистанционно'
  }

  return labels[statusKey] ?? statusKey
}

function getJournalCellClassName(statusKey: string | null): string {
  const baseClassName =
    'h-10 border-r border-[var(--color-border)] px-1 text-center align-middle text-xs font-semibold last:border-r-0'

  if (statusKey === 'present') {
    return `${baseClassName} bg-[var(--color-success)]/10 text-[var(--color-success)]`
  }

  if (statusKey === 'absent') {
    return `${baseClassName} bg-[var(--color-danger)]/10 text-[var(--color-danger)]`
  }

  if (statusKey === 'excused') {
    return `${baseClassName} bg-[var(--color-warning)]/10 text-[var(--color-warning)]`
  }

  if (statusKey === 'not_held') {
    return `${baseClassName} bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]`
  }

  if (statusKey === 'late' || statusKey === 'online') {
    return `${baseClassName} bg-[var(--color-primary)]/10 text-[var(--color-primary)]`
  }

  return `${baseClassName} bg-[var(--color-surface)] text-[var(--color-text)]`
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function compareJournalColumns(firstColumn: JournalColumn, secondColumn: JournalColumn): number {
  if (firstColumn.date && secondColumn.date && firstColumn.date !== secondColumn.date) {
    return firstColumn.date.localeCompare(secondColumn.date)
  }

  if (firstColumn.dayOfWeek !== secondColumn.dayOfWeek) {
    return firstColumn.dayOfWeek - secondColumn.dayOfWeek
  }

  const firstPeriodNumber = firstColumn.lessonPeriodNumber ?? 0
  const secondPeriodNumber = secondColumn.lessonPeriodNumber ?? 0

  if (firstPeriodNumber !== secondPeriodNumber) {
    return firstPeriodNumber - secondPeriodNumber
  }

  return firstColumn.id.localeCompare(secondColumn.id)
}