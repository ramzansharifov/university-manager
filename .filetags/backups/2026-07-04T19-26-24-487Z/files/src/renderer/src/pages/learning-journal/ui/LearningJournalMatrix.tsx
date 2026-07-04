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
  SelectValue,
  Textarea
} from '../../../shared/ui'
import { formatDateForDisplay, formatDateRangeForDisplay } from '../../../shared/lib/date'

const emptySelectValue = '__empty__'
const lessonNumbers = [1, 2, 3, 4, 5]

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
  lessonNumber: number
  date: string
  scheduleItem: AdminCrudRecord
  disciplineName: string
  disciplineShortName: string
}

type EmptyJournalColumn = {
  id: string
  kind: 'empty'
  dayOfWeek: number
  lessonNumber: number
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

  const [activeTopicColumnId, setActiveTopicColumnId] = useState('')
  const [topicDraft, setTopicDraft] = useState('')
  const [isSavingTopic, setIsSavingTopic] = useState(false)
  const [topicError, setTopicError] = useState<string | null>(null)
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)

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
        .sort((firstItem, secondItem) =>
          compareScheduleItemsByLessonNumber(firstItem, secondItem, lessonPeriodById)
        )

      const columns = lessonNumbers.map<JournalColumn>((lessonNumber) => {
        const scheduleItem = dayScheduleItems.find(
          (item) => getScheduleItemLessonNumber(item, lessonPeriodById) === lessonNumber
        )

        if (!scheduleItem) {
          return {
            id: `empty:${day.value}:${lessonNumber}`,
            kind: 'empty',
            dayOfWeek: day.value,
            lessonNumber,
            date
          }
        }

        return createScheduleJournalColumn({
          scheduleItem,
          dayOfWeek: day.value,
          lessonNumber,
          date,
          disciplineById,
          subjectNameById
        })
      })

      return {
        dayOfWeek: day.value,
        dayLabel: day.shortLabel,
        fullDayLabel: day.label,
        date,
        columns
      }
    })
  }, [
    disciplineById,
    lessonPeriodById,
    scheduleItems,
    selectedGroup,
    selectedWeek,
    subjectNameById
  ])

  const journalColumns = useMemo(
    () => journalDayGroups.flatMap((dayGroup) => dayGroup.columns),
    [journalDayGroups]
  )
  const activeTopicColumn = useMemo(
    () =>
      journalColumns.find(
        (column): column is ScheduleJournalColumn =>
          column.kind === 'schedule' && column.id === activeTopicColumnId
      ) ?? null,
    [activeTopicColumnId, journalColumns]
  )

  useEffect(() => {
    if (!activeTopicColumnId) {
      return
    }

    if (!activeTopicColumn) {
      setActiveTopicColumnId('')
      setTopicDraft('')
      setTopicError(null)
    }
  }, [activeTopicColumn, activeTopicColumnId])

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

    if (statusKey === 'absent') {
      return 'Н'
    }

    if (statusKey === 'present') {
      return '·'
    }

    if (!statusKey) {
      return ''
    }

    const labels: Record<string, string> = {
      excused: 'УП',
      not_held: 'НБ',
      late: 'О',
      online: 'Д'
    }

    return labels[statusKey] ?? statusKey.slice(0, 2).toUpperCase()
  }

  function getAttendanceStatusByKey(statusKey: string): AdminCrudRecord | null {
    return attendanceStatuses.find((status) => String(status.item_key) === statusKey) ?? null
  }

  async function ensureLessonSession(column: ScheduleJournalColumn): Promise<AdminCrudRecord> {
    const existingSession = getLessonSession(column)

    if (existingSession) {
      return existingSession
    }

    const result = await window.api.adminCrud.create({
      entity: 'lesson_sessions',
      data: {
        schedule_item_id: Number(column.scheduleItem.id),
        week_id: toNumberOrNull(selectedWeek?.id),
        lesson_date: column.date,
        topic: null,
        status: 'planned',
        teacher_id: toNumberOrNull(column.scheduleItem.teacher_id)
      }
    })

    if (!result.item) {
      throw new Error('Не удалось создать занятие для отметки')
    }

    return result.item
  }

  async function toggleAttendanceMark(
    student: AdminCrudRecord,
    column: ScheduleJournalColumn
  ): Promise<void> {
    if (isSavingAttendance) {
      return
    }

    const existingRecord = getAttendanceRecord(student, column)
    const currentStatusKey = getAttendanceStatusKey(student, column)
    const nextStatusKey =
      currentStatusKey === 'absent' ? 'present' : currentStatusKey === 'present' ? null : 'absent'

    setIsSavingAttendance(true)
    setAttendanceError(null)

    try {
      if (nextStatusKey === null) {
        if (existingRecord?.id) {
          await window.api.adminCrud.delete({
            entity: 'attendance_records',
            id: Number(existingRecord.id)
          })
        }

        await loadData()
        return
      }

      const nextStatus = getAttendanceStatusByKey(nextStatusKey)

      if (!nextStatus?.id) {
        throw new Error(
          nextStatusKey === 'absent'
            ? 'Статус отсутствия не найден в справочнике'
            : 'Статус присутствия не найден в справочнике'
        )
      }

      if (existingRecord?.id) {
        await window.api.adminCrud.update({
          entity: 'attendance_records',
          id: Number(existingRecord.id),
          data: {
            attendance_status_id: Number(nextStatus.id)
          }
        })
      } else {
        const lessonSession = await ensureLessonSession(column)

        await window.api.adminCrud.create({
          entity: 'attendance_records',
          data: {
            lesson_session_id: Number(lessonSession.id),
            student_id: Number(student.id),
            attendance_status_id: Number(nextStatus.id),
            comment: null
          }
        })
      }

      await loadData()
    } catch (error) {
      setAttendanceError(
        error instanceof Error ? error.message : 'Не удалось сохранить отметку посещаемости'
      )
    } finally {
      setIsSavingAttendance(false)
    }
  }
  function getLessonTopic(column: ScheduleJournalColumn): string {
    const session = getLessonSession(column)

    return String(session?.topic ?? '').trim()
  }

  function openTopicEditor(column: ScheduleJournalColumn): void {
    setActiveTopicColumnId(column.id)
    setTopicDraft(getLessonTopic(column))
    setTopicError(null)
  }

  async function saveTopic(): Promise<void> {
    if (!activeTopicColumn) {
      return
    }

    setIsSavingTopic(true)
    setTopicError(null)

    try {
      const topic = topicDraft.trim() || null
      const existingSession = getLessonSession(activeTopicColumn)

      if (existingSession?.id) {
        await window.api.adminCrud.update({
          entity: 'lesson_sessions',
          id: Number(existingSession.id),
          data: {
            topic
          }
        })
      } else {
        const result = await window.api.adminCrud.create({
          entity: 'lesson_sessions',
          data: {
            schedule_item_id: Number(activeTopicColumn.scheduleItem.id),
            week_id: toNumberOrNull(selectedWeek?.id),
            lesson_date: activeTopicColumn.date,
            topic,
            status: 'planned',
            teacher_id: toNumberOrNull(activeTopicColumn.scheduleItem.teacher_id)
          }
        })

        if (!result.item) {
          throw new Error('Не удалось создать занятие для темы')
        }
      }

      await loadData()
    } catch (error) {
      setTopicError(error instanceof Error ? error.message : 'Не удалось сохранить тему занятия')
    } finally {
      setIsSavingTopic(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Фильтры журнала</CardTitle>
              <CardDescription>
                Выбери факультет, специальность, группу и семестр. Журнал показывает фиксированную
                неделю: 7 дней и 5 пар на каждый день.
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
              После выбора семестра журнал автоматически откроет первую неделю.
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
                  {getSemesterLabel(selectedSemester, academicYearById)} ·{' '}
                  {getWeekLabel(selectedWeek)} · {getWeekDateRangeLabel(selectedWeek)}
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

            {groupStudents.length > 0 ? (
              <div className="grid gap-4">
                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                  <table className="w-full table-fixed border-collapse text-[11px]">
                    <colgroup>
                      <col style={{ width: studentColumnWidth }} />
                      {journalColumns.map((column) => (
                        <col key={column.id} style={{ width: '2.35rem' }} />
                      ))}
                    </colgroup>

                    <thead>
                      <tr className="bg-[var(--color-surface-muted)]">
                        <th
                          rowSpan={2}
                          className="sticky left-0 z-30 whitespace-nowrap border-b border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]"
                        >
                          Студент
                        </th>

                        {journalDayGroups.map((dayGroup) => (
                          <th
                            key={dayGroup.dayOfWeek}
                            colSpan={lessonNumbers.length}
                            className="border-b border-r border-[var(--color-border)] px-1 py-2 text-center last:border-r-0"
                            title={dayGroup.fullDayLabel}
                          >
                            <span className="font-semibold text-[var(--color-text)]">
                              {formatJournalDate(dayGroup.date)} /{' '}
                            </span>
                            <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                              ({dayGroup.dayLabel})
                            </span>
                          </th>
                        ))}
                      </tr>

                      <tr className="bg-[var(--color-surface-muted)]">
                        {journalColumns.map((column) => (
                          <th
                            key={`${column.id}-lesson`}
                            className="h-7 border-b border-r border-[var(--color-border)] px-0 text-center text-[10px] font-semibold text-[var(--color-text-muted)] last:border-r-0"
                          >
                            {column.lessonNumber}
                          </th>
                        ))}
                      </tr>

                      {/* Сокращения предметов вынесены в нижнюю строку таблицы. */}
                    </thead>

                    <tbody>
                      {groupStudents.map((student) => (
                        <tr
                          key={String(student.id)}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td
                            className="sticky left-0 z-20 truncate whitespace-nowrap border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)]"
                            title={getPersonFullName(student)}
                          >
                            {getPersonFullName(student)}
                          </td>

                          {journalColumns.map((column) => {
                            if (column.kind === 'empty') {
                              return (
                                <td
                                  key={`${student.id}-${column.id}`}
                                  className="h-8 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-0 text-center align-middle last:border-r-0"
                                  title="Пары нет"
                                />
                              )
                            }

                            const statusKey = getAttendanceStatusKey(student, column)
                            const value = renderJournalCellValue(student, column)

                            return (
                              <td
                                key={`${student.id}-${column.id}`}
                                className={getJournalCellClassName(statusKey)}
                              >
                                <button
                                  type="button"
                                  disabled={isSavingAttendance}
                                  className="flex h-full min-h-8 w-full items-center justify-center transition-colors hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 focus:outline-none disabled:cursor-wait"
                                  title={createJournalCellTitle(student, column, statusKey)}
                                  onClick={() => void toggleAttendanceMark(student, column)}
                                >
                                  {value === '·' ? (
                                    <span
                                      aria-label="Точка"
                                      className="block h-1.5 w-1.5 rounded-full border-4 border-current"
                                    />
                                  ) : (
                                    value
                                  )}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[var(--color-surface-muted)]">
                        <th className="sticky left-0 z-20 whitespace-nowrap border-r border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)]">
                          Предмет
                        </th>

                        {journalColumns.map((column) => {
                          const topic = column.kind === 'schedule' ? getLessonTopic(column) : ''

                          return (
                            <th
                              key={`${column.id}-footer-subject`}
                              className="h-7 border-r border-t border-[var(--color-border)] px-0 text-center text-[10px] font-semibold text-[var(--color-text)] last:border-r-0"
                              title={
                                column.kind === 'schedule'
                                  ? createTopicColumnTitle(column, topic)
                                  : 'Нет пары'
                              }
                            >
                              {column.kind === 'schedule' ? (
                                <button
                                  type="button"
                                  className="h-full w-full transition-colors hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 focus:outline-none"
                                  onClick={() => openTopicEditor(column)}
                                >
                                  {column.disciplineShortName}
                                </button>
                              ) : null}
                            </th>
                          )
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="muted">Студентов: {groupStudents.length}</Badge>
                  <Badge variant="muted">Колонок: 35</Badge>
                  <Badge variant="muted">П = присутствовал</Badge>
                  <Badge variant="muted">Н = отсутствовал</Badge>
                  <Badge variant="muted">УП = уважительная причина</Badge>
                  <Badge variant="muted">НБ = не было</Badge>
                  <Badge variant="muted">О = опоздал</Badge>
                  <Badge variant="muted">Д = дистанционно</Badge>
                </div>
                {attendanceError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {attendanceError}
                  </div>
                ) : null}

                {activeTopicColumn ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          Тема занятия
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {getJournalPairLabel(activeTopicColumn)}
                        </p>
                      </div>

                      <Badge>{activeTopicColumn.disciplineShortName}</Badge>
                    </div>

                    {topicError ? (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {topicError}
                      </div>
                    ) : null}

                    <label className="mt-4 grid gap-2">
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        Текст темы
                      </span>
                      <Textarea
                        value={topicDraft}
                        placeholder="Например: Производные и правила дифференцирования"
                        onChange={(event) => setTopicDraft(event.target.value)}
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setActiveTopicColumnId('')
                          setTopicDraft('')
                          setTopicError(null)
                        }}
                      >
                        Закрыть
                      </Button>

                      <Button
                        type="button"
                        disabled={isSavingTopic}
                        onClick={() => void saveTopic()}
                      >
                        {isSavingTopic ? 'Сохранение...' : 'Сохранить тему'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                    Нажми на клетку студента, чтобы переключить отметку: пусто → Н → · → пусто. Тема
                    занятия редактируется через сокращение предмета в нижней строке.
                  </div>
                )}
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
  lessonNumber,
  date,
  disciplineById,
  subjectNameById
}: {
  scheduleItem: AdminCrudRecord
  dayOfWeek: number
  lessonNumber: number
  date: string
  disciplineById: Map<number, AdminCrudRecord>
  subjectNameById: Map<number, string>
}): ScheduleJournalColumn {
  const disciplineId = toNumberOrNull(scheduleItem.discipline_id)
  const discipline = disciplineId === null ? null : (disciplineById.get(disciplineId) ?? null)
  const disciplineName = discipline ? getDisciplineName(discipline, subjectNameById) : 'Дисциплина'

  return {
    id: `schedule:${String(scheduleItem.id)}:${dayOfWeek}:${lessonNumber}`,
    kind: 'schedule',
    dayOfWeek,
    lessonNumber,
    date,
    scheduleItem,
    disciplineName,
    disciplineShortName: getDisciplineShortName(disciplineName)
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
  const academicYear =
    academicYearId === null ? null : (academicYearById.get(academicYearId) ?? null)
  const semesterName = semester.name
    ? String(semester.name)
    : `${String(semester.number ?? '')} семестр`

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

function getScheduleItemLessonNumber(
  scheduleItem: AdminCrudRecord,
  lessonPeriodById: Map<number, AdminCrudRecord>
): number | null {
  const lessonPeriodId = toNumberOrNull(scheduleItem.lesson_period_id)

  if (lessonPeriodId === null) {
    return null
  }

  const lessonPeriod = lessonPeriodById.get(lessonPeriodId)
  const lessonNumber = toNumberOrNull(lessonPeriod?.number)

  return lessonNumber ?? lessonPeriodId
}

function createJournalCellTitle(
  student: AdminCrudRecord,
  column: ScheduleJournalColumn,
  statusKey: string
): string {
  const statusLabel = statusKey ? getAttendanceStatusLabel(statusKey) : 'Пусто'
  const actionLabel =
    statusKey === 'absent'
      ? 'Следующий клик: точка'
      : statusKey === 'present'
        ? 'Следующий клик: пусто'
        : 'Следующий клик: Н'

  return [
    getPersonFullName(student),
    column.disciplineName,
    `${formatJournalDate(column.date)} · ${column.lessonNumber} пара`,
    statusLabel,
    actionLabel
  ].join('\n')
}
function getJournalPairLabel(column: ScheduleJournalColumn): string {
  return `${formatJournalDate(column.date)} · ${column.lessonNumber} пара · ${column.disciplineName}`
}

function createTopicColumnTitle(column: ScheduleJournalColumn, topic: string): string {
  return [getJournalPairLabel(column), topic ? `Тема: ${topic}` : 'Тема не указана'].join('\n')
}

function getAttendanceStatusLabel(statusKey: string): string {
  const labels: Record<string, string> = {
    present: 'Точка / присутствовал',
    absent: 'Н / отсутствовал',
    excused: 'Уважительная причина',
    not_held: 'Не было',
    late: 'Опоздал',
    online: 'Дистанционно'
  }

  return labels[statusKey] ?? statusKey
}

function getJournalCellClassName(statusKey: string): string {
  const baseClassName =
    'h-8 border-r border-[var(--color-border)] px-0 text-center align-middle text-[11px] font-semibold last:border-r-0'

  if (statusKey === 'absent') {
    return `${baseClassName} bg-red-50 text-red-600`
  }

  if (statusKey === 'present') {
    return `${baseClassName} text-gray-500`
  }

  return `${baseClassName} bg-emerald-50 text-emerald-700`
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

function compareScheduleItemsByLessonNumber(
  firstItem: AdminCrudRecord,
  secondItem: AdminCrudRecord,
  lessonPeriodById: Map<number, AdminCrudRecord>
): number {
  const firstLessonNumber = getScheduleItemLessonNumber(firstItem, lessonPeriodById) ?? 0
  const secondLessonNumber = getScheduleItemLessonNumber(secondItem, lessonPeriodById) ?? 0

  if (firstLessonNumber !== secondLessonNumber) {
    return firstLessonNumber - secondLessonNumber
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
