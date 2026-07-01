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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '../../../shared/ui'

const emptySelectValue = '__empty__'

const weekDayLabels = [
  { value: 1, shortLabel: 'Пн' },
  { value: 2, shortLabel: 'Вт' },
  { value: 3, shortLabel: 'Ср' },
  { value: 4, shortLabel: 'Чт' },
  { value: 5, shortLabel: 'Пт' },
  { value: 6, shortLabel: 'Сб' },
  { value: 7, shortLabel: 'Вс' }
]

type AttendanceJournalColumn = {
  id: string
  kind: 'attendance'
  dayOfWeek: number
  date: string
  title: string
  subtitle: string
  scheduleItem: AdminCrudRecord
}

type GradeJournalColumn = {
  id: string
  kind: 'grade'
  dayOfWeek: number
  date: string
  title: string
  subtitle: string
  gradeItem: AdminCrudRecord
  gradeElementType: AdminCrudRecord | null
}

type EmptyJournalColumn = {
  id: string
  kind: 'empty'
  dayOfWeek: number
  date: string
  title: string
  subtitle: string
}

type EditableJournalColumn = AttendanceJournalColumn | GradeJournalColumn
type JournalColumn = EditableJournalColumn | EmptyJournalColumn

type ActiveJournalCell = {
  student: AdminCrudRecord
  column: EditableJournalColumn
}

type JournalFilterOption = {
  value: string
  label: string
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
  const [gradeElementTypes, setGradeElementTypes] = useState<AdminCrudRecord[]>([])
  const [gradeItems, setGradeItems] = useState<AdminCrudRecord[]>([])
  const [grades, setGrades] = useState<AdminCrudRecord[]>([])

  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [selectedWeekId, setSelectedWeekId] = useState('')

  const [activeCell, setActiveCell] = useState<ActiveJournalCell | null>(null)
  const [attendanceStatusKey, setAttendanceStatusKey] = useState('')
  const [gradeScore, setGradeScore] = useState('')
  const [cellComment, setCellComment] = useState('')
  const [isSavingCell, setIsSavingCell] = useState(false)
  const [cellError, setCellError] = useState<string | null>(null)

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
      attendanceStatusesResult,
      gradeElementTypesResult,
      gradeItemsResult,
      gradesResult
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
        pageSize: 2000,
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
        pageSize: 2000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'weeks',
        page: 1,
        pageSize: 1000,
        orderBy: 'number',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'schedule_items',
        page: 1,
        pageSize: 3000,
        orderBy: 'day_of_week',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'lesson_periods',
        page: 1,
        pageSize: 100,
        orderBy: 'number',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'lesson_sessions',
        page: 1,
        pageSize: 3000,
        orderBy: 'lesson_date',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'attendance_records',
        page: 1,
        pageSize: 10000,
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
      }),
      window.api.adminCrud.list({
        entity: 'grade_element_types',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'grade_items',
        page: 1,
        pageSize: 2000,
        orderBy: 'grade_date',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'grades',
        page: 1,
        pageSize: 5000,
        orderBy: 'id',
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
    setGradeElementTypes(gradeElementTypesResult.items)
    setGradeItems(gradeItemsResult.items)
    setGrades(gradesResult.items)
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

  const groupDisciplines = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    return disciplines.filter(
      (discipline) => Number(discipline.group_id) === Number(selectedGroupId)
    )
  }, [disciplines, selectedGroupId])

  const selectedDiscipline = useMemo(() => {
    if (!selectedDisciplineId) {
      return null
    }

    return (
      groupDisciplines.find((discipline) => String(discipline.id) === selectedDisciplineId) ?? null
    )
  }, [groupDisciplines, selectedDisciplineId])

  const subjectNameById = useMemo(() => createRecordNameMap(subjects), [subjects])
  const gradeElementTypeById = useMemo(
    () => createRecordMap(gradeElementTypes),
    [gradeElementTypes]
  )

  const gradeByStudentAndItem = useMemo(() => {
    const map = new Map<string, AdminCrudRecord>()

    grades.forEach((grade) => {
      const studentId = toNumberOrNull(grade.student_id)
      const gradeItemId = toNumberOrNull(grade.grade_item_id)

      if (studentId !== null && gradeItemId !== null) {
        map.set(createGradeKey(studentId, gradeItemId), grade)
      }
    })

    return map
  }, [grades])

  const semesterWeeks = useMemo(() => {
    const semesterId = toNumberOrNull(selectedDiscipline?.semester_id)

    if (semesterId === null) {
      return []
    }

    return weeks.filter((week) => Number(week.semester_id) === semesterId).sort(compareWeeks)
  }, [selectedDiscipline, weeks])

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

  const selectedWeekGradeItems = useMemo(() => {
    if (!selectedDiscipline || !selectedWeek) {
      return []
    }

    return gradeItems
      .filter((item) => Number(item.discipline_id) === Number(selectedDiscipline.id))
      .filter((item) => isGradeItemInWeek(item, selectedWeek))
      .sort(compareGradeItems)
  }, [gradeItems, selectedDiscipline, selectedWeek])

  const selectedWeekScheduleItems = useMemo(() => {
    if (!selectedGroup || !selectedDiscipline || !selectedWeek) {
      return []
    }

    return scheduleItems
      .filter((item) => Number(item.group_id) === Number(selectedGroup.id))
      .filter((item) => Number(item.discipline_id) === Number(selectedDiscipline.id))
      .filter((item) => Number(item.week_id) === Number(selectedWeek.id))
      .sort(compareScheduleItemsForJournal)
  }, [scheduleItems, selectedDiscipline, selectedGroup, selectedWeek])

  const journalColumns = useMemo<JournalColumn[]>(() => {
    if (!selectedWeek) {
      return []
    }

    const attendanceColumns: AttendanceJournalColumn[] = selectedWeekScheduleItems.map(
      (scheduleItem) => {
        const dayOfWeek = Number(scheduleItem.day_of_week)
        const lessonPeriod = lessonPeriods.find(
          (period) => Number(period.id) === Number(scheduleItem.lesson_period_id)
        )

        return {
          id: `attendance:${String(scheduleItem.id)}`,
          kind: 'attendance',
          dayOfWeek,
          date: getDateOfWeekDay(selectedWeek, dayOfWeek),
          title: getDayShortName(dayOfWeek),
          subtitle: lessonPeriod ? `${String(lessonPeriod.number)}п` : 'пара',
          scheduleItem
        }
      }
    )

    const gradeColumns: GradeJournalColumn[] = selectedWeekGradeItems.map((gradeItem) => {
      const dayOfWeek = getGradeItemDayOfWeek(gradeItem, selectedWeek) ?? 1
      const elementTypeId = toNumberOrNull(gradeItem.grade_element_type_id)
      const gradeElementType =
        elementTypeId === null ? null : (gradeElementTypeById.get(elementTypeId) ?? null)

      return {
        id: `grade:${String(gradeItem.id)}`,
        kind: 'grade',
        dayOfWeek,
        date: getDateOfWeekDay(selectedWeek, dayOfWeek),
        title: getGradeElementShortName(gradeElementType, gradeItem),
        subtitle: getDayShortName(dayOfWeek),
        gradeItem,
        gradeElementType
      }
    })

    const populatedDays = new Set(
      [...attendanceColumns, ...gradeColumns].map((column) => column.dayOfWeek)
    )
    const emptyColumns: EmptyJournalColumn[] = weekDayLabels
      .filter((day) => !populatedDays.has(day.value))
      .map((day) => {
        const date = getDateOfWeekDay(selectedWeek, day.value)

        return {
          id: `empty:${day.value}`,
          kind: 'empty',
          dayOfWeek: day.value,
          date,
          title: day.shortLabel,
          subtitle: formatShortDateLabel(date)
        }
      })

    return [...attendanceColumns, ...gradeColumns, ...emptyColumns].sort(compareJournalColumns)
  }, [
    gradeElementTypeById,
    lessonPeriods,
    selectedWeek,
    selectedWeekGradeItems,
    selectedWeekScheduleItems
  ])

  const studentColumnWidth = useMemo(() => {
    const longestNameLength = groupStudents.reduce(
      (length, student) => Math.max(length, getPersonFullName(student).length),
      0
    )
    const widthInCharacters = Math.min(Math.max(longestNameLength + 2, 14), 34)

    return `${widthInCharacters}ch`
  }, [groupStudents])

  function handleFacultyChange(value: string): void {
    setSelectedFacultyId(value)
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function handleSpecialtyChange(value: string): void {
    setSelectedSpecialtyId(value)
    setSelectedGroupId('')
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function handleGroupChange(value: string): void {
    setSelectedGroupId(value)
    setSelectedDisciplineId('')
    setSelectedWeekId('')
  }

  function handleDisciplineChange(value: string): void {
    setSelectedDisciplineId(value)
    setSelectedWeekId('')
  }

  function resetFilters(): void {
    handleFacultyChange('')
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

  function getAttendanceRecord(
    student: AdminCrudRecord,
    column: AttendanceJournalColumn
  ): AdminCrudRecord | undefined {
    const session = lessonSessions.find(
      (item) =>
        Number(item.schedule_item_id) === Number(column.scheduleItem.id) &&
        Number(item.week_id) === Number(selectedWeek?.id)
    )

    if (!session) {
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

  function getAttendanceShortLabel(record: AdminCrudRecord): string {
    const key = String(getAttendanceStatusById(record.attendance_status_id)?.item_key ?? '')
    const labels: Record<string, string> = {
      present: 'П',
      absent: 'Н',
      excused: 'УП',
      not_held: 'НБ',
      late: 'О',
      online: 'Д'
    }

    return labels[key] ?? ''
  }

  function renderJournalCellValue(student: AdminCrudRecord, column: JournalColumn): string {
    if (column.kind === 'empty') {
      return ''
    }

    if (column.kind === 'attendance') {
      const record = getAttendanceRecord(student, column)
      return record ? getAttendanceShortLabel(record) : ''
    }

    const grade = gradeByStudentAndItem.get(
      createGradeKey(Number(student.id), Number(column.gradeItem.id))
    )

    return grade ? String(grade.score ?? '') : ''
  }

  function openJournalCell(student: AdminCrudRecord, column: EditableJournalColumn): void {
    setCellError(null)
    setActiveCell({ student, column })

    if (column.kind === 'attendance') {
      const record = getAttendanceRecord(student, column)
      const status = record ? getAttendanceStatusById(record.attendance_status_id) : null

      setAttendanceStatusKey(status ? String(status.item_key) : '')
      setGradeScore('')
      setCellComment(record?.comment ? String(record.comment) : '')
      return
    }

    const grade = gradeByStudentAndItem.get(
      createGradeKey(Number(student.id), Number(column.gradeItem.id))
    )

    setGradeScore(grade?.score === null || grade?.score === undefined ? '' : String(grade.score))
    setAttendanceStatusKey('')
    setCellComment(grade?.comment ? String(grade.comment) : '')
  }

  async function ensureLessonSession(column: AttendanceJournalColumn): Promise<AdminCrudRecord> {
    const existingSession = lessonSessions.find(
      (session) =>
        Number(session.schedule_item_id) === Number(column.scheduleItem.id) &&
        Number(session.week_id) === Number(selectedWeek?.id)
    )

    if (existingSession) {
      return existingSession
    }

    const teacherId = toNumberOrNull(column.scheduleItem.teacher_id)
    const result = await window.api.adminCrud.create({
      entity: 'lesson_sessions',
      data: {
        schedule_item_id: Number(column.scheduleItem.id),
        week_id: Number(selectedWeek?.id),
        lesson_date: column.date,
        teacher_id: teacherId,
        topic: 'Занятие',
        status: 'conducted'
      }
    })

    if (!result.item) {
      throw new Error('Не удалось создать занятие журнала')
    }

    return result.item
  }

  async function saveAttendanceCell(
    student: AdminCrudRecord,
    column: AttendanceJournalColumn
  ): Promise<void> {
    const existingRecord = getAttendanceRecord(student, column)

    if (!attendanceStatusKey) {
      if (existingRecord?.id) {
        await window.api.adminCrud.delete({
          entity: 'attendance_records',
          id: Number(existingRecord.id)
        })
      }

      return
    }

    const status = attendanceStatuses.find((item) => String(item.item_key) === attendanceStatusKey)

    if (!status?.id) {
      throw new Error('Статус посещения не найден')
    }

    const lessonSession = await ensureLessonSession(column)
    const payload = {
      lesson_session_id: Number(lessonSession.id),
      student_id: Number(student.id),
      attendance_status_id: Number(status.id),
      comment: cellComment.trim() || null
    }

    if (existingRecord?.id) {
      await window.api.adminCrud.update({
        entity: 'attendance_records',
        id: Number(existingRecord.id),
        data: payload
      })
    } else {
      await window.api.adminCrud.create({
        entity: 'attendance_records',
        data: payload
      })
    }
  }

  async function saveGradeCell(
    student: AdminCrudRecord,
    column: GradeJournalColumn
  ): Promise<void> {
    const existingGrade = gradeByStudentAndItem.get(
      createGradeKey(Number(student.id), Number(column.gradeItem.id))
    )

    if (!gradeScore.trim()) {
      if (existingGrade?.id) {
        await window.api.adminCrud.delete({
          entity: 'grades',
          id: Number(existingGrade.id)
        })
      }

      return
    }

    const score = Number(gradeScore)

    if (!Number.isFinite(score)) {
      throw new Error('Укажи корректный балл')
    }

    const minScore = toNumberOrNull(column.gradeElementType?.min_score) ?? 0
    const maxScore =
      toNumberOrNull(column.gradeItem.max_score) ??
      toNumberOrNull(column.gradeElementType?.max_score) ??
      100

    if (score < minScore || score > maxScore) {
      throw new Error(`Балл должен быть от ${minScore} до ${maxScore}`)
    }

    const payload = {
      grade_item_id: Number(column.gradeItem.id),
      student_id: Number(student.id),
      score,
      comment: cellComment.trim() || null
    }

    if (existingGrade?.id) {
      await window.api.adminCrud.update({
        entity: 'grades',
        id: Number(existingGrade.id),
        data: payload
      })
    } else {
      await window.api.adminCrud.create({
        entity: 'grades',
        data: payload
      })
    }
  }

  async function saveActiveCell(): Promise<void> {
    if (!activeCell) {
      return
    }

    setIsSavingCell(true)
    setCellError(null)

    try {
      if (activeCell.column.kind === 'attendance') {
        await saveAttendanceCell(activeCell.student, activeCell.column)
      } else {
        await saveGradeCell(activeCell.student, activeCell.column)
      }

      setActiveCell(null)
      await loadData()
    } catch (error) {
      setCellError(error instanceof Error ? error.message : 'Не удалось сохранить клетку')
    } finally {
      setIsSavingCell(false)
    }
  }

  const hasCompleteSelection = Boolean(selectedGroup && selectedDiscipline && selectedWeek)

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Фильтры журнала</CardTitle>
              <CardDescription>
                Выбери факультет, специальность, группу, дисциплину и неделю.
              </CardDescription>
            </div>

            <Button variant="secondary" onClick={resetFilters}>
              <FiRefreshCcw />
              Сбросить фильтры
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
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
              label="Дисциплина"
              value={selectedDisciplineId}
              placeholder={selectedGroupId ? 'Выбери дисциплину' : 'Сначала группу'}
              disabled={!selectedGroupId || groupDisciplines.length === 0}
              options={groupDisciplines.map((item) => ({
                value: String(item.id),
                label: getDisciplineName(item, subjectNameById)
              }))}
              onChange={handleDisciplineChange}
            />

            <JournalFilterSelect
              label="Неделя"
              value={selectedWeekId}
              placeholder={selectedDisciplineId ? 'Выбери неделю' : 'Сначала дисциплину'}
              disabled={!selectedDisciplineId || semesterWeeks.length === 0}
              options={semesterWeeks.map((item) => ({
                value: String(item.id),
                label: `${getWeekLabel(item)} · ${getWeekDateRangeLabel(item)}`
              }))}
              onChange={setSelectedWeekId}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedFaculty ? <Badge>{getRecordName(selectedFaculty)}</Badge> : null}
            {selectedSpecialty ? <Badge>{getRecordName(selectedSpecialty)}</Badge> : null}
            {selectedGroup ? <Badge>{getRecordName(selectedGroup)}</Badge> : null}
            {selectedDiscipline ? (
              <Badge>{getDisciplineName(selectedDiscipline, subjectNameById)}</Badge>
            ) : null}
            {selectedWeek ? <Badge>{getWeekLabel(selectedWeek)}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {!hasCompleteSelection ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Выбери все фильтры, чтобы открыть журнал.
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              После выбора группы, дисциплины и недели здесь появится электронный журнал.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hasCompleteSelection && selectedGroup && selectedDiscipline && selectedWeek ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>
                  Журнал: {getRecordName(selectedGroup)} ·{' '}
                  {getDisciplineName(selectedDiscipline, subjectNameById)}
                </CardTitle>
                <CardDescription>
                  {getMonthYearLabel(selectedWeek)} · {getWeekLabel(selectedWeek)} ·{' '}
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
                  Пред. неделя
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selectedWeekIndex < 0 || selectedWeekIndex >= semesterWeeks.length - 1}
                  onClick={openNextWeek}
                >
                  След. неделя
                  <FiChevronRight />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {groupStudents.length === 0 ? (
              <EmptyState text="В этой группе пока нет студентов." />
            ) : null}

            {groupStudents.length > 0 && journalColumns.length > 0 ? (
              <div className="grid gap-4">
                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                  <table className="w-full table-fixed border-collapse text-xs">
                    <colgroup>
                      <col style={{ width: studentColumnWidth }} />
                      {journalColumns.map((column) => (
                        <col key={column.id} />
                      ))}
                    </colgroup>

                    <thead>
                      <tr className="bg-[var(--color-surface-muted)]">
                        <th className="sticky left-0 z-20 whitespace-nowrap border-b border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">
                          Студент
                        </th>

                        {journalColumns.map((column) => (
                          <th
                            key={column.id}
                            className="w-14 min-w-14 border-b border-r border-[var(--color-border)] px-1 py-2 text-center last:border-r-0"
                            title={`${column.title} · ${column.subtitle} · ${formatDateLabel(column.date)}`}
                          >
                            <div className="grid gap-0.5">
                              <span className="font-semibold text-[var(--color-text)]">
                                {column.title}
                              </span>
                              <span className="text-[10px] font-normal text-[var(--color-text-muted)]">
                                {column.subtitle}
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
                            className="sticky left-0 z-10 truncate whitespace-nowrap border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
                            title={getPersonFullName(student)}
                          >
                            {getPersonFullName(student)}
                          </td>

                          {journalColumns.map((column) => {
                            const cellClassName =
                              'h-9 w-14 min-w-14 border-r border-[var(--color-border)] p-0 text-center align-middle last:border-r-0'

                            if (column.kind === 'empty') {
                              return <td key={column.id} className={cellClassName} />
                            }

                            return (
                              <td key={column.id} className={cellClassName}>
                                <button
                                  type="button"
                                  className="h-9 w-full text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 focus:outline-none"
                                  title="Редактировать клетку"
                                  onClick={() => openJournalCell(student, column)}
                                >
                                  {renderJournalCellValue(student, column)}
                                </button>
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
                  <Badge variant="muted">Колонок: {journalColumns.length}</Badge>
                  <Badge variant="muted">П = присутствовал</Badge>
                  <Badge variant="muted">Н = отсутствовал</Badge>
                  <Badge variant="muted">УП = уважительная причина</Badge>
                  <Badge variant="muted">НБ = не было</Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={Boolean(activeCell)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveCell(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeCell?.column.kind === 'attendance' ? 'Посещаемость' : 'Оценка'}
            </DialogTitle>
            <DialogDescription>
              {activeCell ? getPersonFullName(activeCell.student) : ''}
            </DialogDescription>
          </DialogHeader>

          {cellError ? (
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              {cellError}
            </div>
          ) : null}

          {activeCell?.column.kind === 'attendance' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Статус</span>
              <Select
                value={attendanceStatusKey || emptySelectValue}
                onValueChange={(value) =>
                  setAttendanceStatusKey(value === emptySelectValue ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={emptySelectValue}>Пусто</SelectItem>
                  <SelectItem value="not_held">Не было</SelectItem>
                  <SelectItem value="present">Присутствовал</SelectItem>
                  <SelectItem value="absent">Отсутствовал</SelectItem>
                  <SelectItem value="excused">Уважительная причина</SelectItem>
                </SelectContent>
              </Select>
            </label>
          ) : null}

          {activeCell?.column.kind === 'grade' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Балл</span>
              <Input
                type="number"
                value={gradeScore}
                placeholder="Например: 85"
                min={toNumberOrNull(activeCell.column.gradeElementType?.min_score) ?? 0}
                max={
                  toNumberOrNull(activeCell.column.gradeItem.max_score) ??
                  toNumberOrNull(activeCell.column.gradeElementType?.max_score) ??
                  100
                }
                onChange={(event) => setGradeScore(event.target.value)}
              />
            </label>
          ) : null}

          <label className="mt-3 grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Комментарий</span>
            <Textarea
              value={cellComment}
              placeholder="Комментарий"
              onChange={(event) => setCellComment(event.target.value)}
            />
          </label>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setActiveCell(null)}>
              Отмена
            </Button>
            <Button type="button" disabled={isSavingCell} onClick={() => void saveActiveCell()}>
              {isSavingCell ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <SelectItem value={emptySelectValue}>{placeholder}</SelectItem>
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
    <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
      {text}
    </div>
  )
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

function getWeekLabel(week: AdminCrudRecord): string {
  return `${String(week.number ?? '')} неделя`
}

function getMonthYearLabel(week: AdminCrudRecord): string {
  const date = week.starts_at ? parseDate(String(week.starts_at)) : new Date()

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric'
  }).format(date)
}

function getWeekDateRangeLabel(week: AdminCrudRecord): string {
  if (!week.starts_at || !week.ends_at) {
    return 'Без дат'
  }

  return `${formatDateLabel(String(week.starts_at))}–${formatDateLabel(String(week.ends_at))}`
}

function getGradeItemDayOfWeek(
  item: AdminCrudRecord,
  selectedWeek: AdminCrudRecord | null
): number | null {
  const explicitDay = toNumberOrNull(item.day_of_week)

  if (explicitDay !== null && explicitDay >= 1 && explicitDay <= 7) {
    return explicitDay
  }

  if (!item.grade_date || !selectedWeek?.starts_at) {
    return null
  }

  const gradeDate = parseDate(String(item.grade_date))
  const weekStartDate = parseDate(String(selectedWeek.starts_at))
  const diffDays = Math.floor(
    (gradeDate.getTime() - weekStartDate.getTime()) / (24 * 60 * 60 * 1000)
  )

  return diffDays >= 0 && diffDays <= 6 ? diffDays + 1 : null
}

function isGradeItemInWeek(item: AdminCrudRecord, week: AdminCrudRecord): boolean {
  const itemWeekId = toNumberOrNull(item.week_id)

  if (itemWeekId !== null) {
    return itemWeekId === Number(week.id)
  }

  if (!item.grade_date || !week.starts_at || !week.ends_at) {
    return false
  }

  const gradeDate = String(item.grade_date)

  return gradeDate >= String(week.starts_at) && gradeDate <= String(week.ends_at)
}

function compareGradeItems(firstItem: AdminCrudRecord, secondItem: AdminCrudRecord): number {
  const firstDay = toNumberOrNull(firstItem.day_of_week)
  const secondDay = toNumberOrNull(secondItem.day_of_week)

  if (firstDay !== null && secondDay !== null && firstDay !== secondDay) {
    return firstDay - secondDay
  }

  const firstDate = String(firstItem.grade_date ?? '')
  const secondDate = String(secondItem.grade_date ?? '')

  return firstDate !== secondDate
    ? firstDate.localeCompare(secondDate)
    : Number(firstItem.id) - Number(secondItem.id)
}

function compareWeeks(firstWeek: AdminCrudRecord, secondWeek: AdminCrudRecord): number {
  const firstNumber = toNumberOrNull(firstWeek.number)
  const secondNumber = toNumberOrNull(secondWeek.number)

  if (firstNumber !== null && secondNumber !== null && firstNumber !== secondNumber) {
    return firstNumber - secondNumber
  }

  return Number(firstWeek.id) - Number(secondWeek.id)
}

function createGradeKey(studentId: number, gradeItemId: number): string {
  return `${studentId}:${gradeItemId}`
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

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split('-')

  return year && month && day ? `${day}.${month}.${year}` : value
}

function formatShortDateLabel(value: string): string {
  const [, month, day] = value.split('-')

  return month && day ? `${day}.${month}` : ''
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

function getGradeElementShortName(
  gradeElementType: AdminCrudRecord | null,
  gradeItem: AdminCrudRecord
): string {
  const source = String(gradeElementType?.name ?? gradeItem.name ?? '').trim()

  if (!source) {
    return 'ОЦ'
  }

  return source
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4)
}

function getDayShortName(dayOfWeek: number): string {
  return weekDayLabels.find((day) => day.value === dayOfWeek)?.shortLabel ?? String(dayOfWeek)
}

function getDateOfWeekDay(week: AdminCrudRecord, dayOfWeek: number): string {
  if (!week.starts_at) {
    return ''
  }

  return formatDate(addDays(parseDate(String(week.starts_at)), dayOfWeek - 1))
}

function compareScheduleItemsForJournal(
  firstItem: AdminCrudRecord,
  secondItem: AdminCrudRecord
): number {
  const dayDiff = Number(firstItem.day_of_week ?? 0) - Number(secondItem.day_of_week ?? 0)

  return dayDiff !== 0
    ? dayDiff
    : Number(firstItem.lesson_period_id ?? 0) - Number(secondItem.lesson_period_id ?? 0)
}

function compareJournalColumns(firstColumn: JournalColumn, secondColumn: JournalColumn): number {
  if (firstColumn.dayOfWeek !== secondColumn.dayOfWeek) {
    return firstColumn.dayOfWeek - secondColumn.dayOfWeek
  }

  if (firstColumn.kind !== secondColumn.kind) {
    return firstColumn.kind === 'attendance' ? -1 : 1
  }

  return firstColumn.id.localeCompare(secondColumn.id)
}
