import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { FiChevronLeft, FiChevronRight, FiRefreshCcw } from 'react-icons/fi'
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
import { formatDateForDisplay, formatDateRangeForDisplay } from '../../../shared/lib/date'

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

type ScheduleJournalColumn = {
  id: string
  kind: 'schedule'
  dayOfWeek: number
  date: string
  scheduleItem: AdminCrudRecord
  disciplineName: string
  disciplineShortName: string
  lessonPeriodLabel: string
  lessonPeriodNumber: number | null
}

type EmptyJournalColumn = {
  id: string
  kind: 'empty'
  dayOfWeek: number
  date: string
}

type JournalColumn = ScheduleJournalColumn | EmptyJournalColumn

type JournalDayGroup = {
  dayOfWeek: number
  dayLabel: string
  fullDayLabel: string
  date: string
  columns: JournalColumn[]
}

export function LearningJournalMatrix(): ReactElement {
  const [faculties, setFaculties] = useState<AdminCrudRecord[]>([])
  const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
  const [groups, setGroups] = useState<AdminCrudRecord[]>([])
  const [students, setStudents] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [academicYears, setAcademicYears] = useState<AdminCrudRecord[]>([])
  const [semesters, setSemesters] = useState<AdminCrudRecord[]>([])
  const [weeks, setWeeks] = useState<AdminCrudRecord[]>([])
  const [scheduleItems, setScheduleItems] = useState<AdminCrudRecord[]>([])
  const [lessonPeriods, setLessonPeriods] = useState<AdminCrudRecord[]>([])
  const [lessonSessions, setLessonSessions] = useState<AdminCrudRecord[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AdminCrudRecord[]>([])
  const [attendanceStatuses, setAttendanceStatuses] = useState<AdminCrudRecord[]>([])

  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedWeekId, setSelectedWeekId] = useState('')

  const loadData = useCallback(async (): Promise<void> => {
    const [
      facultiesResult,
      specialtiesResult,
      groupsResult,
      studentsResult,
      subjectsResult,
      disciplinesResult,
      academicYearsResult,
      semestersResult,
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
        entity: 'academic_years',
        page: 1,
        pageSize: 100,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'semesters',
        page: 1,
        pageSize: 500,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'weeks',
        page: 1,
        pageSize: 2000,
        orderBy: 'number',
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
    setAcademicYears(academicYearsResult.items)
    setSemesters(semestersResult.items)
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

    return students
      .filter((student) => Number(student.group_id) === Number(selectedGroupId))
      .sort((firstStudent, secondStudent) =>
        getPersonFullName(firstStudent).localeCompare(getPersonFullName(secondStudent), 'ru')
      )
  }, [selectedGroupId, students])

  const groupDisciplines = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    return disciplines.filter(
      (discipline) => Number(discipline.group_id) === Number(selectedGroupId)
    )
  }, [disciplines, selectedGroupId])

  const availableSemesterIds = useMemo(() => {
    const ids = new Set<number>()

    groupDisciplines.forEach((discipline) => {
      const semesterId = toNumberOrNull(discipline.semester_id)

      if (semesterId !== null) {
        ids.add(semesterId)
      }
    })

    return ids
  }, [groupDisciplines])

  const filteredSemesters = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    const source =
      availableSemesterIds.size > 0
        ? semesters.filter((semester) => availableSemesterIds.has(Number(semester.id)))
        : semesters

    return [...source].sort(compareSemesters)
  }, [availableSemesterIds, selectedGroupId, semesters])

  const academicYearById = useMemo(() => createRecordMap(academicYears), [academicYears])
  const disciplineById = useMemo(() => createRecordMap(disciplines), [disciplines])
  const subjectNameById = useMemo(() => createRecordNameMap(subjects), [subjects])
  const lessonPeriodById = useMemo(() => createRecordMap(lessonPeriods), [lessonPeriods])

  const selectedSemester = useMemo(
    () => filteredSemesters.find((semester) => String(semester.id) === selectedSemesterId) ?? null,
    [filteredSemesters, selectedSemesterId]
  )

  const semesterWeeks = useMemo(() => {
    if (!selectedSemesterId) {
      return []
    }

    return weeks
      .filter((week) => Number(week.semester_id) === Number(selectedSemesterId))
      .sort(compareWeeks)
  }, [selectedSemesterId, weeks])

  useEffect(() => {
    if (!selectedSemesterId) {
      if (selectedWeekId) {
        setSelectedWeekId('')
      }

      return
    }

    if (semesterWeeks.length === 0) {
      if (selectedWeekId) {
        setSelectedWeekId('')
      }

      return
    }

    const selectedWeekExists = semesterWeeks.some((week) => String(week.id) === selectedWeekId)

    if (!selectedWeekExists) {
      setSelectedWeekId(String(semesterWeeks[0].id))
    }
  }, [selectedSemesterId, selectedWeekId, semesterWeeks])

  const selectedWeek = useMemo(() => {
    if (!selectedWeekId) {
      return null
    }

    return semesterWeeks.find((week) => String(week.id) === selectedWeekId) ?? null
  }, [selectedWeekId, semesterWeeks])

  const selectedWeekIndex = useMemo(
    () => semesterWeeks.findIndex((week) => String(week.id) === selectedWeekId),
    [selectedWeekId, semesterWeeks]
  )

  const journalDayGroups = useMemo<JournalDayGroup[]>(() => {
    if (!selectedGroup || !selectedWeek) {
      return []
    }

    const selectedWeekScheduleItems = scheduleItems
      .filter((scheduleItem) => Number(scheduleItem.group_id) === Number(selectedGroup.id))
      .filter((scheduleItem) => Number(scheduleItem.week_id) === Number(selectedWeek.id))

    return weekDayLabels.map((day) => {
      const date = getDateOfWeekDay(selectedWeek, day.value)
      const dayScheduleItems = selectedWeekScheduleItems
        .filter((scheduleItem) => normalizeDayOfWeek(scheduleItem.day_of_week) === day.value)
        .sort(compareScheduleItemsForJournal)

      const columns =
        dayScheduleItems.length > 0
          ? dayScheduleItems.map((scheduleItem) =>
              createScheduleJournalColumn({
                scheduleItem,
                dayOfWeek: day.value,
                date,
                disciplineById,
                subjectNameById,
                lessonPeriodById
              })
            )
          : [
              {
                id: `empty:${day.value}`,
                kind: 'empty' as const,
                dayOfWeek: day.value,
                date
              }
            ]

      return {
        dayOfWeek: day.value,
        dayLabel: day.shortLabel,
        fullDayLabel: day.label,
        date,
        columns
      }
    })
  }, [disciplineById, lessonPeriodById, scheduleItems, selectedGroup, selectedWeek, subjectNameById])

  const journalColumns = useMemo(
    () => journalDayGroups.flatMap((dayGroup) => dayGroup.columns),
    [journalDayGroups]
  )

  const studentColumnWidth = useMemo(() => {
    const longestNameLength = groupStudents.reduce(
      (length, student) => Math.max(length, getPersonFullName(student).length),
      0
    )
    const widthInCharacters = Math.min(Math.max(longestNameLength + 2, 18), 38)

    return `${widthInCharacters}ch`
  }, [groupStudents])

  const hasCompleteSelection = Boolean(selectedGroup && selectedSemester && selectedWeek)

  function handleFacultyChange(value: string): void {
    setSelectedFacultyId(value)
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedWeekId('')
  }

  function handleSpecialtyChange(value: string): void {
    setSelectedSpecialtyId(value)
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedWeekId('')
  }

  function handleGroupChange(value: string): void {
    setSelectedGroupId(value)
    setSelectedSemesterId('')
    setSelectedWeekId('')
  }

  function handleSemesterChange(value: string): void {
    setSelectedSemesterId(value)
    setSelectedWeekId('')
  }

  function resetFilters(): void {
    setSelectedFacultyId('')
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedWeekId('')
  }

  function openPreviousWeek(): void {
    if (selectedWeekIndex > 0) {
      setSelectedWeekId(String(semesterWeeks[selectedWeekIndex - 1].id))
    }
  }

  function openNextWeek(): void {
    if (selectedWeekIndex >= 0 && selectedWeekIndex < semesterWeeks.length - 1) {
      setSelectedWeekId(String(semesterWeeks[selectedWeekIndex + 1].id))
    }
  }

  function getLessonSession(column: ScheduleJournalColumn): AdminCrudRecord | undefined {
    return lessonSessions.find(
      (session) =>
        Number(session.schedule_item_id) === Number(column.scheduleItem.id) &&
        Number(session.week_id) === Number(selectedWeek?.id)
    )
  }

  function getAttendanceRecord(
    student: AdminCrudRecord,
    column: ScheduleJournalColumn
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

  function getAttendanceStatusKey(student: AdminCrudRecord, column: ScheduleJournalColumn): string {
    const record = getAttendanceRecord(student, column)
    const status = record ? getAttendanceStatusById(record.attendance_status_id) : null

    return status ? String(status.item_key ?? '') : ''
  }

  function renderJournalCellValue(student: AdminCrudRecord, column: ScheduleJournalColumn): string {
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
                Выбери факультет, специальность, группу и семестр. Недели переключаются внутри
                выбранного семестра.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void loadData()}>
                <FiRefreshCcw />
                Обновить
              </Button>

              <Button variant="secondary" onClick={resetFilters}>
                Сбросить
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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

            <JournalFilterSelect
              label="Семестр"
              value={selectedSemesterId}
              placeholder={selectedGroupId ? 'Выбери семестр' : 'Сначала группу'}
              disabled={!selectedGroupId || filteredSemesters.length === 0}
              options={filteredSemesters.map((semester) => ({
                value: String(semester.id),
                label: getSemesterLabel(semester, academicYearById)
              }))}
              onChange={handleSemesterChange}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedFaculty ? <Badge>{getRecordName(selectedFaculty)}</Badge> : null}
            {selectedSpecialty ? <Badge>{getRecordName(selectedSpecialty)}</Badge> : null}
            {selectedGroup ? <Badge>{getRecordName(selectedGroup)}</Badge> : null}
            {selectedSemester ? (
              <Badge>{getSemesterLabel(selectedSemester, academicYearById)}</Badge>
            ) : null}
            {selectedWeek ? <Badge>{getWeekLabel(selectedWeek)}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {!hasCompleteSelection ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Выбери группу и семестр, чтобы открыть журнал.
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              После выбора семестра журнал автоматически откроет первую неделю, а дальше можно
              листать недели кнопками.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hasCompleteSelection && selectedGroup && selectedSemester && selectedWeek ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>Журнал группы: {getRecordName(selectedGroup)}</CardTitle>
                <CardDescription>
                  {getSemesterLabel(selectedSemester, academicYearById)} · {getWeekLabel(selectedWeek)} ·{' '}
                  {getWeekDateRangeLabel(selectedWeek)}
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selectedWeekIndex <= 0}
                  onClick={openPreviousWeek}
                >
                  <FiChevronLeft />
                  Предыдущая неделя
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selectedWeekIndex < 0 || selectedWeekIndex >= semesterWeeks.length - 1}
                  onClick={openNextWeek}
                >
                  Следующая неделя
                  <FiChevronRight />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {groupStudents.length === 0 ? (
              <EmptyState text="В этой группе пока нет студентов." />
            ) : null}

            {groupStudents.length > 0 && journalColumns.length === 0 ? (
              <EmptyState text="Для этой недели пока нет колонок журнала." />
            ) : null}

            {groupStudents.length > 0 && journalColumns.length > 0 ? (
              <div className="grid gap-4">
                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                  <table className="w-full table-fixed border-collapse text-xs">
                    <colgroup>
                      <col style={{ width: studentColumnWidth }} />
                      {journalColumns.map((column) => (
                        <col key={column.id} style={{ width: '4.75rem' }} />
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

                        {journalDayGroups.map((dayGroup) => (
                          <th
                            key={dayGroup.dayOfWeek}
                            colSpan={dayGroup.columns.length}
                            className="border-b border-r border-[var(--color-border)] px-2 py-2 text-center last:border-r-0"
                            title={dayGroup.fullDayLabel}
                          >
                            <span className="block font-semibold text-[var(--color-text)]">
                              {formatJournalDate(dayGroup.date)}
                            </span>
                            <span className="block text-[10px] font-medium text-[var(--color-text-muted)]">
                              {dayGroup.dayLabel}
                            </span>
                          </th>
                        ))}
                      </tr>

                      <tr className="bg-[var(--color-surface-muted)]">
                        {journalColumns.map((column) => (
                          <th
                            key={`${column.id}-period`}
                            className="border-b border-r border-[var(--color-border)] px-1 py-2 text-center text-[10px] font-medium text-[var(--color-text-muted)] last:border-r-0"
                          >
                            {column.kind === 'schedule' ? column.lessonPeriodLabel : '—'}
                          </th>
                        ))}
                      </tr>

                      <tr className="bg-[var(--color-surface)]">
                        {journalColumns.map((column) => (
                          <th
                            key={`${column.id}-subject`}
                            className="border-b border-r border-[var(--color-border)] px-1 py-2 text-center text-[11px] font-semibold text-[var(--color-text)] last:border-r-0"
                            title={column.kind === 'schedule' ? column.disciplineName : 'Нет занятий'}
                          >
                            {column.kind === 'schedule' ? column.disciplineShortName : '—'}
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
                            if (column.kind === 'empty') {
                              return (
                                <td
                                  key={`${student.id}-${column.id}`}
                                  className="h-10 border-r border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-1 text-center align-middle last:border-r-0"
                                  title="В этот день занятий нет"
                                >
                                  <span className="text-[var(--color-text-muted)] opacity-40">—</span>
                                </td>
                              )
                            }

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
                  <Badge variant="muted">Студентов: {groupStudents.length}</Badge>
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

function createScheduleJournalColumn({
  scheduleItem,
  dayOfWeek,
  date,
  disciplineById,
  subjectNameById,
  lessonPeriodById
}: {
  scheduleItem: AdminCrudRecord
  dayOfWeek: number
  date: string
  disciplineById: Map<number, AdminCrudRecord>
  subjectNameById: Map<number, string>
  lessonPeriodById: Map<number, AdminCrudRecord>
}): ScheduleJournalColumn {
  const disciplineId = toNumberOrNull(scheduleItem.discipline_id)
  const discipline = disciplineId === null ? null : (disciplineById.get(disciplineId) ?? null)
  const lessonPeriodId = toNumberOrNull(scheduleItem.lesson_period_id)
  const lessonPeriod = lessonPeriodId === null ? null : (lessonPeriodById.get(lessonPeriodId) ?? null)
  const disciplineName = discipline ? getDisciplineName(discipline, subjectNameById) : 'Дисциплина'
  const lessonPeriodNumber = toNumberOrNull(lessonPeriod?.number)

  return {
    id: `schedule:${String(scheduleItem.id)}`,
    kind: 'schedule',
    dayOfWeek,
    date,
    scheduleItem,
    disciplineName,
    disciplineShortName: getDisciplineShortName(disciplineName),
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

function getSemesterLabel(
  semester: AdminCrudRecord,
  academicYearById: Map<number, AdminCrudRecord>
): string {
  const academicYearId = toNumberOrNull(semester.academic_year_id)
  const academicYear = academicYearId === null ? null : (academicYearById.get(academicYearId) ?? null)
  const semesterName = semester.name ? String(semester.name) : `${String(semester.number ?? '')} семестр`

  return academicYear ? `${getRecordName(academicYear)} · ${semesterName}` : semesterName
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

function getDisciplineShortName(value: string): string {
  const words = value
    .replace(/[()"'«».,;:!?/\\|]+/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) {
    return 'Д.'
  }

  if (words.length === 1) {
    const letters = Array.from(words[0])
    const firstLetter = letters[0]?.toLocaleUpperCase('ru-RU') ?? 'Д'
    const secondLetter = letters[1]?.toLocaleLowerCase('ru-RU') ?? ''

    return `${firstLetter}${secondLetter}.`
  }

  return words
    .map((word) => {
      const firstLetter = Array.from(word)[0]?.toLocaleUpperCase('ru-RU') ?? ''

      return firstLetter ? `${firstLetter}.` : ''
    })
    .join('')
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

function getWeekDateRangeLabel(week: AdminCrudRecord): string {
  return formatDateRangeForDisplay(week.starts_at, week.ends_at, {
    fallback: 'Без дат'
  })
}

function getDateOfWeekDay(week: AdminCrudRecord, dayOfWeek: number): string {
  if (!week.starts_at) {
    return ''
  }

  return formatDate(addDays(parseDate(String(week.starts_at)), dayOfWeek - 1))
}

function formatJournalDate(value: string): string {
  return value ? formatDateForDisplay(value) : '—'
}

function normalizeDayOfWeek(value: unknown): number {
  const dayOfWeek = toNumberOrNull(value)

  if (dayOfWeek !== null && dayOfWeek >= 1 && dayOfWeek <= 7) {
    return dayOfWeek
  }

  return 1
}

function createJournalCellTitle(
  student: AdminCrudRecord,
  column: ScheduleJournalColumn,
  statusKey: string
): string {
  const statusLabel = statusKey ? getAttendanceStatusLabel(statusKey) : 'Пусто'

  return [
    getPersonFullName(student),
    column.disciplineName,
    `${formatJournalDate(column.date)} · ${column.lessonPeriodLabel}`,
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

function getJournalCellClassName(statusKey: string): string {
  const baseClassName =
    'h-10 border-r border-[var(--color-border)] px-1 text-center align-middle text-xs font-semibold last:border-r-0'

  if (statusKey === 'present') {
    return `${baseClassName} bg-[var(--color-primary)]/10 text-[var(--color-primary)]`
  }

  if (statusKey === 'absent') {
    return `${baseClassName} bg-[var(--color-danger)]/10 text-[var(--color-danger)]`
  }

  if (statusKey === 'excused') {
    return `${baseClassName} bg-[var(--color-primary)]/5 text-[var(--color-text)]`
  }

  if (statusKey === 'not_held') {
    return `${baseClassName} bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]`
  }

  if (statusKey === 'late' || statusKey === 'online') {
    return `${baseClassName} bg-[var(--color-primary)]/5 text-[var(--color-primary)]`
  }

  return `${baseClassName} bg-[var(--color-surface)] text-[var(--color-text)]`
}

function compareSemesters(firstSemester: AdminCrudRecord, secondSemester: AdminCrudRecord): number {
  const firstAcademicYearId = toNumberOrNull(firstSemester.academic_year_id) ?? 0
  const secondAcademicYearId = toNumberOrNull(secondSemester.academic_year_id) ?? 0

  if (firstAcademicYearId !== secondAcademicYearId) {
    return firstAcademicYearId - secondAcademicYearId
  }

  const firstNumber = toNumberOrNull(firstSemester.number) ?? 0
  const secondNumber = toNumberOrNull(secondSemester.number) ?? 0

  if (firstNumber !== secondNumber) {
    return firstNumber - secondNumber
  }

  return Number(firstSemester.id ?? 0) - Number(secondSemester.id ?? 0)
}

function compareWeeks(firstWeek: AdminCrudRecord, secondWeek: AdminCrudRecord): number {
  const firstNumber = toNumberOrNull(firstWeek.number)
  const secondNumber = toNumberOrNull(secondWeek.number)

  if (firstNumber !== null && secondNumber !== null && firstNumber !== secondNumber) {
    return firstNumber - secondNumber
  }

  return Number(firstWeek.id ?? 0) - Number(secondWeek.id ?? 0)
}

function compareScheduleItemsForJournal(
  firstItem: AdminCrudRecord,
  secondItem: AdminCrudRecord
): number {
  const firstPeriodNumber = toNumberOrNull(firstItem.lesson_period_id) ?? 0
  const secondPeriodNumber = toNumberOrNull(secondItem.lesson_period_id) ?? 0

  if (firstPeriodNumber !== secondPeriodNumber) {
    return firstPeriodNumber - secondPeriodNumber
  }

  return Number(firstItem.id ?? 0) - Number(secondItem.id ?? 0)
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