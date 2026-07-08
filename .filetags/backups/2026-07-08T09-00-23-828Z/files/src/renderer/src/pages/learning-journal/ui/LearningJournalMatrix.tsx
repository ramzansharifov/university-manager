import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { FiChevronLeft, FiChevronRight, FiEdit2, FiRefreshCcw } from 'react-icons/fi'
import type { AdminCrudRecord } from '../../../features/admin-crud'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
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

type IntermediateGradeItemGroup = {
  key: string
  gradeElementType: AdminCrudRecord | null
  title: string
  gradeItems: AdminCrudRecord[]
}

type GradeSummary =
  | {
      kind: 'score'
      value: number | null
      filledCount: number
      totalCount: number
    }
  | {
      kind: 'pass_fail'
      passedCount: number
      filledCount: number
      totalCount: number
    }

type GradeTone = 'empty' | 'minimum' | 'belowPassing' | 'passing' | 'maximum'

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
  const [lessonCompletionRecords, setLessonCompletionRecords] = useState<AdminCrudRecord[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AdminCrudRecord[]>([])
  const [attendanceStatuses, setAttendanceStatuses] = useState<AdminCrudRecord[]>([])
  const [teachers, setTeachers] = useState<AdminCrudRecord[]>([])
  const [gradeElementTypes, setGradeElementTypes] = useState<AdminCrudRecord[]>([])
  const [gradeItems, setGradeItems] = useState<AdminCrudRecord[]>([])
  const [grades, setGrades] = useState<AdminCrudRecord[]>([])
  const [finalAssessments, setFinalAssessments] = useState<AdminCrudRecord[]>([])
  const [finalAssessmentRounds, setFinalAssessmentRounds] = useState<AdminCrudRecord[]>([])
  const [audiences, setAudiences] = useState<AdminCrudRecord[]>([])

  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedWeekId, setSelectedWeekId] = useState('')

  const [activeTopicColumnId, setActiveTopicColumnId] = useState('')
  const [activeFinalAssessmentRoundId, setActiveFinalAssessmentRoundId] = useState('')
  const [topicDraft, setTopicDraft] = useState('')
  const [lessonNoteDraft, setLessonNoteDraft] = useState('')
  const [isLessonEditorEditing, setIsLessonEditorEditing] = useState(false)
  const [isSavingTopic, setIsSavingTopic] = useState(false)
  const [isSavingCompletion, setIsSavingCompletion] = useState(false)
  const [topicError, setTopicError] = useState<string | null>(null)
  const [selectedIntermediateTypeId, setSelectedIntermediateTypeId] = useState('')
  const [intermediateGradeItemNameDraft, setIntermediateGradeItemNameDraft] = useState('')
  const [isSavingIntermediateGradeItem, setIsSavingIntermediateGradeItem] = useState(false)
  const [isSavingGrade, setIsSavingGrade] = useState(false)
  const [gradeError, setGradeError] = useState<string | null>(null)
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
      teachersResult,
      academicYearsResult,
      semestersResult,
      weeksResult,
      scheduleItemsResult,
      lessonPeriodsResult,
      lessonSessionsResult,
      lessonCompletionRecordsResult,
      attendanceRecordsResult,
      attendanceStatusesResult,
      gradeElementTypesResult,
      gradeItemsResult,
      gradesResult,
      finalAssessmentsResult,
      finalAssessmentRoundsResult,
      audiencesResult
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
        entity: 'teachers',
        page: 1,
        pageSize: 3000,
        orderBy: 'last_name',
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
        entity: 'lesson_completion_records',
        page: 1,
        pageSize: 10000,
        orderBy: 'id',
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
        pageSize: 10000,
        orderBy: 'grade_date',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'grades',
        page: 1,
        pageSize: 20000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'final_assessments',
        page: 1,
        pageSize: 5000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'final_assessment_rounds',
        page: 1,
        pageSize: 15000,
        orderBy: 'assessment_date',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'audiences',
        page: 1,
        pageSize: 1000,
        orderBy: 'name',
        orderDirection: 'asc'
      })
    ])

    setFaculties(facultiesResult.items)
    setSpecialties(specialtiesResult.items)
    setGroups(groupsResult.items)
    setStudents(studentsResult.items)
    setSubjects(subjectsResult.items)
    setDisciplines(disciplinesResult.items)
    setTeachers(teachersResult.items)
    setAcademicYears(academicYearsResult.items)
    setSemesters(semestersResult.items)
    setWeeks(weeksResult.items)
    setScheduleItems(scheduleItemsResult.items)
    setLessonPeriods(lessonPeriodsResult.items)
    setLessonSessions(lessonSessionsResult.items)
    setLessonCompletionRecords(lessonCompletionRecordsResult.items)
    setAttendanceRecords(attendanceRecordsResult.items)
    setAttendanceStatuses(attendanceStatusesResult.items)
    setGradeElementTypes(gradeElementTypesResult.items)
    setGradeItems(gradeItemsResult.items)
    setGrades(gradesResult.items)
    setFinalAssessments(finalAssessmentsResult.items)
    setFinalAssessmentRounds(finalAssessmentRoundsResult.items)
    setAudiences(audiencesResult.items)
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
  const teacherById = useMemo(() => createRecordMap(teachers), [teachers])
  const audienceById = useMemo(() => createRecordMap(audiences), [audiences])
  const gradeElementTypeById = useMemo(
    () => createRecordMap(gradeElementTypes),
    [gradeElementTypes]
  )
  const intermediateGradeElementTypes = useMemo(
    () => gradeElementTypes.filter((item) => Number(item.is_intermediate) === 1),
    [gradeElementTypes]
  )

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

  const selectedWeekFinalAssessmentRounds = useMemo(
    () =>
      filterFinalAssessmentRoundsForWeek({
        finalAssessmentRounds,
        finalAssessments,
        selectedGroupId: selectedGroup?.id,
        selectedSemesterId: selectedSemester?.id,
        selectedWeekId: selectedWeek?.id
      }),
    [finalAssessmentRounds, finalAssessments, selectedGroup, selectedSemester, selectedWeek]
  )
  const activeFinalAssessmentRound = useMemo(
    () =>
      selectedWeekFinalAssessmentRounds.find(
        (round) => String(round.id) === activeFinalAssessmentRoundId
      ) ?? null,
    [activeFinalAssessmentRoundId, selectedWeekFinalAssessmentRounds]
  )
  const activeFinalAssessment = useMemo(
    () =>
      activeFinalAssessmentRound
        ? getFinalAssessmentForRound(activeFinalAssessmentRound, finalAssessments)
        : null,
    [activeFinalAssessmentRound, finalAssessments]
  )
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

  const activeDisciplineIntermediateGradeItems = activeTopicColumn
    ? getIntermediateGradeItemsForColumn(activeTopicColumn)
    : []

  useEffect(() => {
    if (!activeTopicColumnId) {
      return
    }

    if (!activeTopicColumn) {
      setActiveTopicColumnId('')
      setTopicDraft('')
      setLessonNoteDraft('')
      setIsLessonEditorEditing(false)
      setTopicError(null)
      clearIntermediateGradeDraft()
    }
  }, [activeTopicColumn, activeTopicColumnId])
  useEffect(() => {
    if (activeFinalAssessmentRoundId && !activeFinalAssessmentRound) {
      setActiveFinalAssessmentRoundId('')
    }
  }, [activeFinalAssessmentRound, activeFinalAssessmentRoundId])

  const activeLessonCompleted = activeTopicColumn ? isLessonCompleted(activeTopicColumn) : false
  const activeLessonHasSavedDetails = activeTopicColumn
    ? hasSavedLessonDetails(activeTopicColumn)
    : false

  const shouldShowLessonDetailsCard = Boolean(
    activeTopicColumn && activeLessonHasSavedDetails && !isLessonEditorEditing
  )

  const studentColumnWidth = useMemo(() => {
    const longestNameLength = groupStudents.reduce(
      (length, student) => Math.max(length, Array.from(getPersonShortName(student)).length),
      Array.from('Студент').length
    )
    return `calc(${longestNameLength}ch + 2rem)`
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

  function getLessonCompletionRecord(column: ScheduleJournalColumn): AdminCrudRecord | undefined {
    const session = getLessonSession(column)

    if (!session?.id) {
      return undefined
    }

    return lessonCompletionRecords.find(
      (record) => Number(record.lesson_session_id) === Number(session.id)
    )
  }

  function isLessonCompleted(column: ScheduleJournalColumn): boolean {
    return String(getLessonCompletionRecord(column)?.status ?? '') === 'completed'
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

  function getLessonNote(column: ScheduleJournalColumn): string {
    const session = getLessonSession(column)

    return String(session?.comment ?? '').trim()
  }
  function hasSavedLessonDetails(column: ScheduleJournalColumn): boolean {
    const session = getLessonSession(column)

    if (!session?.id) {
      return false
    }

    return Boolean(String(session.topic ?? '').trim() || String(session.comment ?? '').trim())
  }
  function getLessonTeacherName(column: ScheduleJournalColumn): string {
    const session = getLessonSession(column)
    const teacherId =
      toNumberOrNull(session?.teacher_id) ?? toNumberOrNull(column.scheduleItem.teacher_id)

    if (teacherId === null) {
      return 'Преподаватель не указан'
    }

    const teacher = teacherById.get(teacherId)

    return teacher ? getPersonFullName(teacher) : `Преподаватель #${teacherId}`
  }

  function openTopicEditor(column: ScheduleJournalColumn): void {
    const hasSavedDetails = hasSavedLessonDetails(column)

    setActiveTopicColumnId(column.id)
    setTopicDraft(getLessonTopic(column))
    setLessonNoteDraft(getLessonNote(column))
    setIsLessonEditorEditing(!hasSavedDetails)
    setTopicError(null)
    setGradeError(null)
    initializeIntermediateGradeDraft(column)
  }

  function clearIntermediateGradeDraft(): void {
    setSelectedIntermediateTypeId('')
    setIntermediateGradeItemNameDraft('')
    setGradeError(null)
  }

  function getGradeElementTypeById(value: unknown): AdminCrudRecord | null {
    const id = toNumberOrNull(value)

    return id === null ? null : (gradeElementTypeById.get(id) ?? null)
  }

  function getIntermediateGradeItemsForColumn(column: ScheduleJournalColumn): AdminCrudRecord[] {
    const disciplineId = toNumberOrNull(column.scheduleItem.discipline_id)

    if (disciplineId === null) {
      return []
    }

    return gradeItems
      .filter((gradeItem) => Number(gradeItem.discipline_id) === disciplineId)
      .filter((gradeItem) => {
        const gradeElementType = getGradeElementTypeById(gradeItem.grade_element_type_id)

        return Number(gradeElementType?.is_intermediate) === 1
      })
      .sort(compareGradeItems)
  }

  function getIntermediateGradeItemForLesson(
    column: ScheduleJournalColumn
  ): AdminCrudRecord | null {
    const lessonSession = getLessonSession(column)
    const lessonSessionId = toNumberOrNull(lessonSession?.id)
    const disciplineId = toNumberOrNull(column.scheduleItem.discipline_id)
    const weekId = toNumberOrNull(selectedWeek?.id)

    if (lessonSessionId !== null) {
      const byLessonSession = gradeItems.find((gradeItem) => {
        const gradeElementType = getGradeElementTypeById(gradeItem.grade_element_type_id)

        return (
          Number(gradeItem.lesson_session_id) === lessonSessionId &&
          Number(gradeElementType?.is_intermediate) === 1
        )
      })

      if (byLessonSession) {
        return byLessonSession
      }
    }

    if (disciplineId === null || weekId === null) {
      return null
    }

    return (
      gradeItems.find((gradeItem) => {
        const gradeElementType = getGradeElementTypeById(gradeItem.grade_element_type_id)

        return (
          Number(gradeItem.discipline_id) === disciplineId &&
          Number(gradeItem.week_id) === weekId &&
          Number(gradeItem.day_of_week) === column.dayOfWeek &&
          String(gradeItem.grade_date ?? '') === column.date &&
          Number(gradeElementType?.is_intermediate) === 1
        )
      }) ?? null
    )
  }

  function initializeIntermediateGradeDraft(column: ScheduleJournalColumn): void {
    const gradeItem = getIntermediateGradeItemForLesson(column)

    if (!gradeItem) {
      clearIntermediateGradeDraft()
      return
    }

    setSelectedIntermediateTypeId(String(gradeItem.grade_element_type_id ?? ''))
    setIntermediateGradeItemNameDraft(String(gradeItem.name ?? ''))
  }

  function handleIntermediateTypeChange(value: string): void {
    const nextValue = value === emptySelectValue ? '' : value

    setSelectedIntermediateTypeId(nextValue)
    setGradeError(null)

    if (!nextValue || !activeTopicColumn) {
      setIntermediateGradeItemNameDraft('')
      return
    }

    const gradeElementType = getGradeElementTypeById(nextValue)

    setIntermediateGradeItemNameDraft((current) => {
      const trimmed = current.trim()

      return trimmed || createDefaultGradeItemName(gradeElementType, activeTopicColumn)
    })
  }

  async function ensureIntermediateGradeItem(
    column: ScheduleJournalColumn,
    lessonSession: AdminCrudRecord
  ): Promise<void> {
    if (!selectedIntermediateTypeId) {
      return
    }

    const gradeElementType = getGradeElementTypeById(selectedIntermediateTypeId)

    if (!gradeElementType?.id || Number(gradeElementType.is_intermediate) !== 1) {
      throw new Error('Выбери промежуточный оценочный элемент')
    }

    const name = intermediateGradeItemNameDraft.trim()

    if (!name) {
      throw new Error('Укажи название промежуточной работы')
    }

    const maxScore = getGradeElementTypeMaxScore(gradeElementType)

    const payload = {
      discipline_id: Number(column.scheduleItem.discipline_id),
      lesson_session_id: Number(lessonSession.id),
      grade_element_type_id: Number(gradeElementType.id),
      week_id: Number(selectedWeek?.id),
      day_of_week: column.dayOfWeek,
      name,
      max_score: maxScore,
      grade_date: column.date,
      description: lessonNoteDraft.trim() || null
    }

    const existingGradeItem =
      getIntermediateGradeItemForLesson(column) ??
      gradeItems.find(
        (gradeItem) =>
          Number(gradeItem.lesson_session_id) === Number(lessonSession.id) &&
          Number(gradeItem.grade_element_type_id) === Number(gradeElementType.id) &&
          String(gradeItem.name ?? '').trim() === name
      )

    if (existingGradeItem?.id) {
      await window.api.adminCrud.update({
        entity: 'grade_items',
        id: Number(existingGradeItem.id),
        data: payload
      })
      return
    }

    await window.api.adminCrud.create({
      entity: 'grade_items',
      data: payload
    })
  }

  async function ensureLessonSessionForIntermediateGradeItem(
    column: ScheduleJournalColumn
  ): Promise<AdminCrudRecord> {
    const topic = topicDraft.trim() || null
    const comment = lessonNoteDraft.trim() || null
    const existingSession = getLessonSession(column)

    if (existingSession?.id) {
      const result = await window.api.adminCrud.update({
        entity: 'lesson_sessions',
        id: Number(existingSession.id),
        data: {
          topic,
          comment,
          teacher_id: toNumberOrNull(column.scheduleItem.teacher_id)
        }
      })

      return result.item ?? { ...existingSession, topic, comment }
    }

    const weekId = toNumberOrNull(selectedWeek?.id)

    if (weekId === null) {
      throw new Error('Не удалось определить выбранную неделю')
    }

    const result = await window.api.adminCrud.create({
      entity: 'lesson_sessions',
      data: {
        schedule_item_id: Number(column.scheduleItem.id),
        week_id: weekId,
        lesson_date: column.date,
        topic,
        comment,
        status: 'planned',
        teacher_id: toNumberOrNull(column.scheduleItem.teacher_id)
      }
    })

    if (!result.item?.id) {
      throw new Error('Не удалось создать занятие для промежуточного элемента')
    }

    return result.item
  }

  async function saveIntermediateGradeItemForActiveLesson(): Promise<void> {
    if (!activeTopicColumn || isSavingIntermediateGradeItem) {
      return
    }

    if (!selectedIntermediateTypeId) {
      setGradeError('Выбери промежуточный оценочный элемент')
      return
    }

    setIsSavingIntermediateGradeItem(true)
    setGradeError(null)

    try {
      const lessonSession = await ensureLessonSessionForIntermediateGradeItem(activeTopicColumn)
      await ensureIntermediateGradeItem(activeTopicColumn, lessonSession)
      await loadData()
    } catch (error) {
      setGradeError(
        getUserFacingError(error, 'Не удалось сохранить промежуточный оценочный элемент')
      )
    } finally {
      setIsSavingIntermediateGradeItem(false)
    }
  }

  function getGradeItemElementType(gradeItem: AdminCrudRecord): AdminCrudRecord | null {
    return getGradeElementTypeById(gradeItem.grade_element_type_id)
  }

  function getGradeItemMaxScore(gradeItem: AdminCrudRecord): number {
    const gradeElementType = getGradeItemElementType(gradeItem)
    const typeMaxScore = toNumberOrNull(gradeElementType?.max_score)

    if (typeMaxScore !== null) {
      return typeMaxScore
    }

    return toNumberOrNull(gradeItem.max_score) ?? 100
  }

  function getGradeItemMinScore(gradeItem: AdminCrudRecord): number {
    const gradeElementType = getGradeItemElementType(gradeItem)
    const minScore = toNumberOrNull(gradeElementType?.min_score)

    return minScore ?? 0
  }

  function getGradeItemPassingScore(gradeItem: AdminCrudRecord): number | null {
    const gradeElementType = getGradeItemElementType(gradeItem)

    return toNumberOrNull(gradeElementType?.passing_score)
  }

  function getGradeItemScoreDescription(gradeItem: AdminCrudRecord): string {
    const gradeElementType = getGradeItemElementType(gradeItem)

    if (gradeElementType?.grading_mode === 'pass_fail') {
      return 'Сдал / не сдал'
    }

    const details = [
      `мин. ${getGradeItemMinScore(gradeItem)}`,
      `макс. ${getGradeItemMaxScore(gradeItem)}`
    ]
    const passingScore = getGradeItemPassingScore(gradeItem)

    if (passingScore !== null) {
      details.push(`проходной ${passingScore}`)
    }

    return `Баллы · ${details.join(' · ')}`
  }

  function getGradeElementTypeScoreDescription(gradeElementType: AdminCrudRecord): string {
    if (gradeElementType.grading_mode === 'pass_fail') {
      return 'Тип оценивания: Сдал / не сдал'
    }

    const minScore = toNumberOrNull(gradeElementType.min_score) ?? 0
    const maxScore = toNumberOrNull(gradeElementType.max_score)
    const passingScore = toNumberOrNull(gradeElementType.passing_score)
    const details = [
      `Тип оценивания: Баллы`,
      `мин. ${minScore}`,
      maxScore !== null && maxScore > 0 ? `макс. ${maxScore}` : 'макс. не задан'
    ]

    if (passingScore !== null) {
      details.push(`проходной ${passingScore}`)
    }

    return details.join(' · ')
  }

  function getIntermediateGroupScoreDescription(group: IntermediateGradeItemGroup): string {
    const gradeElementType = group.gradeElementType

    if (!gradeElementType) {
      const firstGradeItem = group.gradeItems[0]

      return firstGradeItem ? getGradeItemScoreDescription(firstGradeItem) : 'Правила не заданы'
    }

    if (gradeElementType.grading_mode === 'pass_fail') {
      return 'Сдал / не сдал'
    }

    const minScore = toNumberOrNull(gradeElementType.min_score) ?? 0
    const maxScore = toNumberOrNull(gradeElementType.max_score)
    const passingScore = toNumberOrNull(gradeElementType.passing_score)
    const details = [
      'Баллы',
      `мин. ${minScore}`,
      maxScore !== null ? `макс. ${maxScore}` : 'макс. не задан',
      passingScore !== null ? `проходной ${passingScore}` : 'проходной не задан'
    ]

    return details.join(' · ')
  }

  function getStudentGradeRecord(
    student: AdminCrudRecord,
    gradeItem: AdminCrudRecord
  ): AdminCrudRecord | undefined {
    return grades.find(
      (grade) =>
        Number(grade.grade_item_id) === Number(gradeItem.id) &&
        Number(grade.student_id) === Number(student.id)
    )
  }

  function getStudentGradeValue(student: AdminCrudRecord, gradeItem: AdminCrudRecord): string {
    const score = toNumberOrNull(getStudentGradeRecord(student, gradeItem)?.score)

    return score === null ? '' : String(score)
  }

  function getStudentPassFailValue(student: AdminCrudRecord, gradeItem: AdminCrudRecord): string {
    const score = toNumberOrNull(getStudentGradeRecord(student, gradeItem)?.score)

    if (score === null) {
      return ''
    }

    return score >= 1 ? 'pass' : 'fail'
  }

  function getScoreGradeTone(score: number | null, gradeItem: AdminCrudRecord): GradeTone {
    if (score === null) {
      return 'empty'
    }

    const minScore = getGradeItemMinScore(gradeItem)
    const passingScore = getGradeItemPassingScore(gradeItem)
    const maxScore = getGradeItemMaxScore(gradeItem)

    if (maxScore <= minScore) {
      return 'empty'
    }

    if (areNumbersClose(score, maxScore)) {
      return 'maximum'
    }

    if (areNumbersClose(score, minScore)) {
      return 'minimum'
    }

    if (passingScore !== null) {
      return score < passingScore ? 'belowPassing' : 'passing'
    }

    return score <= minScore ? 'minimum' : 'passing'
  }

  function getPassFailTone(value: string): GradeTone {
    if (value === 'pass') {
      return 'maximum'
    }

    if (value === 'fail') {
      return 'belowPassing'
    }

    return 'empty'
  }

  function calculateStudentIntermediateSummary(
    student: AdminCrudRecord,
    group: IntermediateGradeItemGroup
  ): GradeSummary {
    const isPassFail = group.gradeElementType?.grading_mode === 'pass_fail'
    const totalCount = group.gradeItems.length
    const scores = group.gradeItems
      .map((gradeItem) => toNumberOrNull(getStudentGradeRecord(student, gradeItem)?.score))
      .filter((score): score is number => score !== null)

    if (isPassFail) {
      return {
        kind: 'pass_fail',
        passedCount: scores.filter((score) => score >= 1).length,
        filledCount: scores.length,
        totalCount
      }
    }

    return {
      kind: 'score',
      value:
        scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
      filledCount: scores.length,
      totalCount
    }
  }

  function renderIntermediateSummaryCell(
    student: AdminCrudRecord,
    group: IntermediateGradeItemGroup
  ): ReactElement {
    const summary = calculateStudentIntermediateSummary(student, group)
    const baseClassName =
      'border-l border-r border-[var(--color-border)] px-3 py-2 text-center font-semibold'

    if (summary.kind === 'pass_fail') {
      const tone =
        summary.filledCount === 0
          ? 'empty'
          : summary.passedCount === summary.totalCount
            ? 'maximum'
            : 'belowPassing'

      return (
        <td
          className={`${baseClassName} ${getGradeToneClassName(tone)}`}
          title={`Заполнено ${summary.filledCount}/${summary.totalCount}`}
        >
          {summary.filledCount === 0 ? '—' : `Сдано ${summary.passedCount}/${summary.totalCount}`}
        </td>
      )
    }

    const firstGradeItem = group.gradeItems[0]
    const tone =
      summary.value === null || !firstGradeItem
        ? 'empty'
        : getScoreGradeTone(summary.value, firstGradeItem)

    return (
      <td
        className={`${baseClassName} ${getGradeToneClassName(tone)}`}
        title={`Заполнено ${summary.filledCount}/${summary.totalCount}`}
      >
        {summary.value === null ? '—' : formatScoreValue(summary.value)}
      </td>
    )
  }

  async function saveStudentGrade(
    student: AdminCrudRecord,
    gradeItem: AdminCrudRecord,
    score: number | null
  ): Promise<void> {
    if (isSavingGrade) {
      return
    }

    const gradeItemId = toNumberOrNull(gradeItem.id)
    const studentId = toNumberOrNull(student.id)

    if (gradeItemId === null || studentId === null) {
      setGradeError('Не удалось определить студента или оценочный элемент')
      return
    }

    const existingGrade = getStudentGradeRecord(student, gradeItem)

    if (score === null && !existingGrade?.id) {
      return
    }

    setIsSavingGrade(true)
    setGradeError(null)

    try {
      if (score === null) {
        await window.api.adminCrud.delete({
          entity: 'grades',
          id: Number(existingGrade?.id)
        })
        await loadData()
        return
      }

      if (existingGrade?.id) {
        await window.api.adminCrud.update({
          entity: 'grades',
          id: Number(existingGrade.id),
          data: {
            score
          }
        })
      } else {
        await window.api.adminCrud.create({
          entity: 'grades',
          data: {
            grade_item_id: gradeItemId,
            student_id: studentId,
            score,
            comment: null,
            graded_by_user_id: null
          }
        })
      }

      await loadData()
    } catch (error) {
      setGradeError(getUserFacingError(error, 'Не удалось сохранить оценку'))
    } finally {
      setIsSavingGrade(false)
    }
  }

  function handleScoreGradeBlur(
    student: AdminCrudRecord,
    gradeItem: AdminCrudRecord,
    value: string
  ): void {
    const trimmedValue = value.trim().replace(',', '.')

    if (!trimmedValue) {
      void saveStudentGrade(student, gradeItem, null)
      return
    }

    const score = Number(trimmedValue)
    const minScore = getGradeItemMinScore(gradeItem)
    const maxScore = getGradeItemMaxScore(gradeItem)

    if (!Number.isFinite(score) || score < minScore || score > maxScore) {
      setGradeError(`Оценка должна быть числом от ${minScore} до ${maxScore}`)
      return
    }

    void saveStudentGrade(student, gradeItem, score)
  }

  function handlePassFailGradeChange(
    student: AdminCrudRecord,
    gradeItem: AdminCrudRecord,
    value: string
  ): void {
    if (value === emptySelectValue) {
      void saveStudentGrade(student, gradeItem, null)
      return
    }

    void saveStudentGrade(student, gradeItem, value === 'pass' ? 1 : 0)
  }

  function renderIntermediateGradeItemEditor(): ReactElement {
    const selectedGradeElementType = selectedIntermediateTypeId
      ? getGradeElementTypeById(selectedIntermediateTypeId)
      : null

    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Промежуточный оценочный элемент
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Выбери уже созданный тип оценочного элемента и зафиксируй конкретную работу занятия.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={
              isSavingIntermediateGradeItem ||
              isSavingTopic ||
              isSavingCompletion ||
              !selectedIntermediateTypeId
            }
            onClick={() => void saveIntermediateGradeItemForActiveLesson()}
          >
            {isSavingIntermediateGradeItem ? 'Сохранение...' : 'Сохранить промежуточный элемент'}
          </Button>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">
              Провели оценочный элемент
            </span>
            <Select
              value={selectedIntermediateTypeId || emptySelectValue}
              disabled={intermediateGradeElementTypes.length === 0}
              onValueChange={handleIntermediateTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выбери тип работы" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={emptySelectValue}>Не проводили</SelectItem>

                {intermediateGradeElementTypes.map((gradeElementType) => (
                  <SelectItem key={String(gradeElementType.id)} value={String(gradeElementType.id)}>
                    {getRecordName(gradeElementType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {selectedGradeElementType ? (
            <>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  Название работы
                </span>
                <Input
                  value={intermediateGradeItemNameDraft}
                  placeholder="Например: Самостоятельная работа"
                  onChange={(event) => {
                    setIntermediateGradeItemNameDraft(event.target.value)
                    setGradeError(null)
                  }}
                />
              </label>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-3 py-2 text-xs text-[var(--color-text-muted)] lg:col-span-2">
                {getGradeElementTypeScoreDescription(selectedGradeElementType)}
              </div>
            </>
          ) : null}
        </div>

        {intermediateGradeElementTypes.length === 0 ? (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Сначала создай промежуточные оценочные элементы в разделе «Журнал обучения».
          </p>
        ) : null}
      </div>
    )
  }

  function renderIntermediateGradesJournal(): ReactElement | null {
    if (!activeTopicColumn) {
      return null
    }

    const intermediateGradeItemGroups = createIntermediateGradeItemGroups(
      activeDisciplineIntermediateGradeItems,
      getGradeItemElementType
    )

    return (
      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Мини-журнал промежуточных оценок
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {activeTopicColumn.disciplineName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="muted">
              Элементов: {activeDisciplineIntermediateGradeItems.length}
            </Badge>
            <Badge variant="muted">Журналов: {intermediateGradeItemGroups.length}</Badge>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--color-text-muted)]">
          <span className={`rounded-md border px-2 py-1 ${getGradeToneClassName('minimum')}`}>
            Минимум
          </span>
          <span className={`rounded-md border px-2 py-1 ${getGradeToneClassName('belowPassing')}`}>
            Ниже проходного
          </span>
          <span className={`rounded-md border px-2 py-1 ${getGradeToneClassName('passing')}`}>
            Проходной и выше
          </span>
          <span className={`rounded-md border px-2 py-1 ${getGradeToneClassName('maximum')}`}>
            Максимум
          </span>
        </div>

        {gradeError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {gradeError}
          </div>
        ) : null}

        {activeDisciplineIntermediateGradeItems.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
            Для этой дисциплины пока нет промежуточных оценочных элементов.
          </div>
        ) : (
          <div className="mt-3 grid gap-4">
            {intermediateGradeItemGroups.map((group) => (
              <div
                key={group.key}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{group.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {getIntermediateGroupScoreDescription(group)}
                    </p>
                  </div>

                  <Badge variant="muted">Работ: {group.gradeItems.length}</Badge>
                </div>

                <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--color-border)]">
                  <table className="w-full min-w-max border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--color-surface-muted)]">
                        <th className="sticky left-0 z-20 whitespace-nowrap border-b border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">
                          Студент
                        </th>

                        {group.gradeItems.map((gradeItem) => (
                          <th
                            key={String(gradeItem.id)}
                            className="min-w-40 border-b border-r border-[var(--color-border)] px-3 py-2 text-center font-semibold text-[var(--color-text)]"
                          >
                            <span className="block">{String(gradeItem.name ?? 'Оценка')}</span>
                            <span className="mt-1 block text-[10px] font-medium text-[var(--color-text-muted)]">
                              {getGradeItemScoreDescription(gradeItem)}
                            </span>
                          </th>
                        ))}

                        <th className="min-w-28 border-b border-l border-[var(--color-border)] px-3 py-2 text-center font-semibold text-[var(--color-text)]">
                          Итоги
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {groupStudents.map((student, index) => (
                        <tr
                          key={`${group.key}:${String(student.id)}`}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td className="sticky left-0 z-10 whitespace-nowrap border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]">
                            {index + 1}) {getPersonShortName(student)}
                          </td>

                          {group.gradeItems.map((gradeItem) => {
                            const gradeElementType = getGradeItemElementType(gradeItem)
                            const isPassFail = gradeElementType?.grading_mode === 'pass_fail'
                            const currentValue = getStudentGradeValue(student, gradeItem)

                            if (isPassFail) {
                              const passFailValue = getStudentPassFailValue(student, gradeItem)

                              return (
                                <td
                                  key={`${String(student.id)}:${String(gradeItem.id)}`}
                                  className="border-r border-[var(--color-border)] px-2 py-2 text-center"
                                >
                                  <Select
                                    value={passFailValue || emptySelectValue}
                                    disabled={isSavingGrade}
                                    onValueChange={(value) =>
                                      handlePassFailGradeChange(student, gradeItem, value)
                                    }
                                  >
                                    <SelectTrigger
                                      className={`h-8 min-w-28 text-xs ${getGradeToneClassName(getPassFailTone(passFailValue))}`}
                                    >
                                      <SelectValue placeholder="—" />
                                    </SelectTrigger>

                                    <SelectContent>
                                      <SelectItem value={emptySelectValue}>—</SelectItem>
                                      <SelectItem value="pass">Сдал</SelectItem>
                                      <SelectItem value="fail">Не сдал</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                              )
                            }

                            const score = toNumberOrNull(
                              getStudentGradeRecord(student, gradeItem)?.score
                            )

                            return (
                              <td
                                key={`${String(student.id)}:${String(gradeItem.id)}`}
                                className="border-r border-[var(--color-border)] px-2 py-2 text-center"
                              >
                                <ScoreInput
                                  value={currentValue}
                                  min={getGradeItemMinScore(gradeItem)}
                                  max={getGradeItemMaxScore(gradeItem)}
                                  disabled={isSavingGrade}
                                  toneClassName={getGradeToneClassName(
                                    getScoreGradeTone(score, gradeItem)
                                  )}
                                  onCommit={(value) =>
                                    handleScoreGradeBlur(student, gradeItem, value)
                                  }
                                />
                              </td>
                            )
                          })}

                          {renderIntermediateSummaryCell(student, group)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  async function ensureLessonSessionForTopic(
    column: ScheduleJournalColumn
  ): Promise<AdminCrudRecord> {
    const topic = topicDraft.trim()

    if (!topic) {
      throw new Error('Сначала укажите тему занятия')
    }

    const comment = lessonNoteDraft.trim() || null
    const existingSession = getLessonSession(column)

    if (existingSession?.id) {
      const result = await window.api.adminCrud.update({
        entity: 'lesson_sessions',
        id: Number(existingSession.id),
        data: {
          topic,
          comment,
          status: 'conducted'
        }
      })

      return (
        result.item ?? {
          ...existingSession,
          topic,
          comment,
          status: 'conducted'
        }
      )
    }

    const weekId = toNumberOrNull(selectedWeek?.id)

    if (weekId === null) {
      throw new Error('Не удалось определить выбранную неделю')
    }

    const result = await window.api.adminCrud.create({
      entity: 'lesson_sessions',
      data: {
        schedule_item_id: Number(column.scheduleItem.id),
        week_id: weekId,
        lesson_date: column.date,
        topic,
        comment,
        status: 'conducted',
        teacher_id: toNumberOrNull(column.scheduleItem.teacher_id)
      }
    })

    if (!result.item?.id) {
      throw new Error('Не удалось создать занятие')
    }

    return result.item
  }

  async function completeLesson(): Promise<void> {
    if (!activeTopicColumn || isSavingCompletion) {
      return
    }

    if (!topicDraft.trim()) {
      setTopicError('Сначала укажите тему занятия')
      return
    }

    setIsSavingCompletion(true)
    setTopicError(null)

    try {
      const existingCompletionRecord = getLessonCompletionRecord(activeTopicColumn)
      const lessonSession = await ensureLessonSessionForTopic(activeTopicColumn)
      await ensureIntermediateGradeItem(activeTopicColumn, lessonSession)

      if (existingCompletionRecord?.id) {
        await window.api.adminCrud.update({
          entity: 'lesson_completion_records',
          id: Number(existingCompletionRecord.id),
          data: {
            status: 'completed',
            topic_completed: 1,
            comment: null
          }
        })
      } else {
        await window.api.adminCrud.create({
          entity: 'lesson_completion_records',
          data: {
            lesson_session_id: Number(lessonSession.id),
            status: 'completed',
            topic_completed: 1,
            comment: null
          }
        })
      }

      await loadData()
    } catch (error) {
      setTopicError(getUserFacingError(error, 'Не удалось провести занятие'))
    } finally {
      setIsSavingCompletion(false)
    }
  }

  async function cancelLessonCompletion(): Promise<void> {
    if (!activeTopicColumn || isSavingCompletion) {
      return
    }

    const lessonSession = getLessonSession(activeTopicColumn)
    const completionRecord = getLessonCompletionRecord(activeTopicColumn)

    setIsSavingCompletion(true)
    setTopicError(null)

    try {
      if (completionRecord?.id) {
        await window.api.adminCrud.update({
          entity: 'lesson_completion_records',
          id: Number(completionRecord.id),
          data: {
            status: 'not_completed',
            topic_completed: 0
          }
        })
      }

      if (lessonSession?.id) {
        await window.api.adminCrud.update({
          entity: 'lesson_sessions',
          id: Number(lessonSession.id),
          data: {
            status: 'planned'
          }
        })
      }

      await loadData()
    } catch (error) {
      setTopicError(getUserFacingError(error, 'Не удалось отменить проведение занятия'))
    } finally {
      setIsSavingCompletion(false)
    }
  }

  async function saveTopic(): Promise<void> {
    if (!activeTopicColumn) {
      return
    }

    setIsSavingTopic(true)
    setTopicError(null)

    try {
      const topic = topicDraft.trim() || null
      const comment = lessonNoteDraft.trim() || null
      const existingSession = getLessonSession(activeTopicColumn)
      let savedSession: AdminCrudRecord | null = null

      if (existingSession?.id) {
        const result = await window.api.adminCrud.update({
          entity: 'lesson_sessions',
          id: Number(existingSession.id),
          data: {
            topic,
            comment
          }
        })
        savedSession = result.item ?? { ...existingSession, topic, comment }
      } else {
        const result = await window.api.adminCrud.create({
          entity: 'lesson_sessions',
          data: {
            schedule_item_id: Number(activeTopicColumn.scheduleItem.id),
            week_id: toNumberOrNull(selectedWeek?.id),
            lesson_date: activeTopicColumn.date,
            topic,
            comment,
            status: 'planned',
            teacher_id: toNumberOrNull(activeTopicColumn.scheduleItem.teacher_id)
          }
        })

        if (!result.item) {
          throw new Error('Не удалось создать занятие для темы')
        }

        savedSession = result.item
      }

      if (savedSession) {
        await ensureIntermediateGradeItem(activeTopicColumn, savedSession)
      }

      await loadData()
    } catch (error) {
      setTopicError(getUserFacingError(error, 'Не удалось сохранить тему занятия'))
    } finally {
      setIsSavingTopic(false)
    }
  }

  function renderActiveFinalAssessmentDetails(): ReactElement | null {
    if (!activeFinalAssessmentRound) {
      return null
    }

    const gradeElementTypeId = toNumberOrNull(activeFinalAssessment?.grade_element_type_id)
    const gradeElementType =
      gradeElementTypeId === null ? null : (gradeElementTypeById.get(gradeElementTypeId) ?? null)
    const disciplineId = toNumberOrNull(activeFinalAssessment?.discipline_id)
    const discipline = disciplineId === null ? null : (disciplineById.get(disciplineId) ?? null)
    const teacherId = toNumberOrNull(activeFinalAssessmentRound.teacher_id)
    const teacher = teacherId === null ? null : (teacherById.get(teacherId) ?? null)
    const audienceId = toNumberOrNull(activeFinalAssessmentRound.audience_id)
    const audience = audienceId === null ? null : (audienceById.get(audienceId) ?? null)

    return (
      <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Справка по итоговой аттестации
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Это read-only событие из расписания итоговой аттестации. Посещаемость, тема занятия и
              проведение пары здесь не редактируются.
            </p>
          </div>
          <Badge variant="warning">Итог</Badge>
        </div>

        <div className="mt-3 grid gap-2 text-sm text-[var(--color-text)]">
          <p className="font-semibold">
            {gradeElementType ? getRecordName(gradeElementType) : 'Итоговая аттестация'} ·{' '}
            {discipline
              ? getDisciplineName(discipline, subjectNameById)
              : getRecordName(activeFinalAssessment ?? activeFinalAssessmentRound)}
          </p>
          <p>
            {String(activeFinalAssessmentRound.round_number ?? '—')} тур —{' '}
            {getRoundLabel(activeFinalAssessmentRound.round_type)}
          </p>
          <p>{formatFinalAssessmentRoundDateTime(activeFinalAssessmentRound)}</p>
          <p>Преподаватель: {teacher ? getPersonFullName(teacher) : '—'}</p>
          <p>Аудитория: {audience ? getRecordName(audience) : '—'}</p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setActiveFinalAssessmentRoundId('')}
          >
            Закрыть справку
          </Button>
        </div>
      </div>
    )
  }

  return (
      <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Итоговая аттестация на этой неделе
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Эти события показаны только для информации. Посещаемость, темы и проведение занятия
              здесь не редактируются.
            </p>
          </div>
          <Badge variant="warning">Read-only</Badge>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {selectedWeekFinalAssessmentRounds.map((round) => {
            const assessment = getFinalAssessmentForRound(round, finalAssessments)
            const gradeElementTypeId = toNumberOrNull(assessment?.grade_element_type_id)
            const gradeElementType =
              gradeElementTypeId === null
                ? null
                : (gradeElementTypeById.get(gradeElementTypeId) ?? null)
            const disciplineId = toNumberOrNull(assessment?.discipline_id)
            const discipline =
              disciplineId === null ? null : (disciplineById.get(disciplineId) ?? null)
            const teacherId = toNumberOrNull(round.teacher_id)
            const teacher = teacherId === null ? null : (teacherById.get(teacherId) ?? null)
            const audienceId = toNumberOrNull(round.audience_id)
            const audience = audienceId === null ? null : (audienceById.get(audienceId) ?? null)

            return (
              <div
                key={String(round.id)}
                className="grid gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">Итог</Badge>
                  <Badge variant="muted">
                    {String(round.round_number ?? '—')} тур — {getRoundLabel(round.round_type)}
                  </Badge>
                </div>

                <p className="font-semibold text-[var(--color-text)]">
                  {gradeElementType ? getRecordName(gradeElementType) : 'Итоговая аттестация'} ·{' '}
                  {discipline
                    ? getDisciplineName(discipline, subjectNameById)
                    : getRecordName(assessment ?? round)}
                </p>

                <div className="grid gap-1 text-xs text-[var(--color-text-muted)]">
                  <span>{formatFinalAssessmentRoundDateTime(round)}</span>
                  <span>Преподаватель: {teacher ? getPersonFullName(teacher) : '—'}</span>
                  <span>Аудитория: {audience ? getRecordName(audience) : '—'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
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
                {renderFinalAssessmentWeekNotice()}

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
                          className="sticky left-0 z-30 whitespace-nowrap border-b border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-center font-semibold text-[var(--color-text-muted)]"
                        >
                          СТУДЕНТЫ
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
                      {groupStudents.map((student, index) => (
                        <tr
                          key={String(student.id)}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td
                            className="sticky left-0 z-20 truncate whitespace-nowrap border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)]"
                            title={getPersonFullName(student)}
                          >
                            {index + 1}) {getPersonShortName(student)}
                          </td>

                          {journalColumns.map((column) => {
                            const finalAssessmentRound = getFinalAssessmentRoundForColumn(column)

                            if (finalAssessmentRound) {
                              return (
                                <td
                                  key={`${student.id}-${column.id}`}
                                  className="h-8 border-r border-[var(--color-border)] bg-[var(--color-warning)]/10 px-0 text-center align-middle text-[11px] font-semibold text-[var(--color-text)] last:border-r-0"
                                  title={createFinalAssessmentColumnTitle(finalAssessmentRound)}
                                />
                              )
                            }
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
                        <th className="sticky left-0 z-20 whitespace-nowrap border-r border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-center text-[10px] font-semibold text-[var(--color-text-muted)]">
                          ПРЕДМЕТЫ
                        </th>

                        {journalColumns.map((column) => {
                          const finalAssessmentRound = getFinalAssessmentRoundForColumn(column)

                          if (finalAssessmentRound) {
                            return (
                              <th
                                key={`${column.id}-footer-final-assessment`}
                                className="h-7 border-r border-t border-[var(--color-border)] bg-[var(--color-warning)]/10 px-0 text-center text-[10px] font-semibold text-[var(--color-text)] last:border-r-0"
                                title={createFinalAssessmentColumnTitle(finalAssessmentRound)}
                              >
                                <button
                                  type="button"
                                  className="h-full w-full transition-colors hover:bg-[var(--color-warning)]/20 focus:bg-[var(--color-warning)]/20 focus:outline-none"
                                  onClick={() => openFinalAssessmentInfo(finalAssessmentRound)}
                                >
                                  {getFinalAssessmentColumnLabel(finalAssessmentRound)}
                                </button>
                              </th>
                            )
                          }
                          const topic = column.kind === 'schedule' ? getLessonTopic(column) : ''
                          const note = column.kind === 'schedule' ? getLessonNote(column) : ''
                          const teacherName =
                            column.kind === 'schedule' ? getLessonTeacherName(column) : ''

                          return (
                            <th
                              key={`${column.id}-footer-subject`}
                              className="h-7 border-r border-t border-[var(--color-border)] px-0 text-center text-[10px] font-semibold text-[var(--color-text)] last:border-r-0"
                              title={
                                column.kind === 'schedule'
                                  ? createTopicColumnTitle(column, topic, note, teacherName)
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
                {renderActiveFinalAssessmentDetails()}

                {activeTopicColumn ? (
                  <div className="grid gap-4">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text)]">
                            Данные занятия
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {getJournalPairLabel(activeTopicColumn)}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            Преподаватель: {getLessonTeacherName(activeTopicColumn)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={activeLessonCompleted ? 'success' : 'warning'}>
                            {activeLessonCompleted ? 'Проведено' : 'Не проведено'}
                          </Badge>
                          <Badge>{activeTopicColumn.disciplineShortName}</Badge>
                        </div>
                      </div>

                      {topicError ? (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                          {topicError}
                        </div>
                      ) : null}

                      {shouldShowLessonDetailsCard ? (
                        <div className="mt-4 grid gap-4">
                          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="grid flex-1 gap-4">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Тема занятия
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-[var(--color-text)]">
                                    {getLessonTopic(activeTopicColumn) || 'Тема не указана'}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Заметки
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text)]">
                                    {getLessonNote(activeTopicColumn) || 'Заметки не указаны'}
                                  </p>
                                </div>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setIsLessonEditorEditing(true)}
                              >
                                <FiEdit2 />
                                Редактировать
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setActiveTopicColumnId('')
                                setTopicDraft('')
                                setLessonNoteDraft('')
                                setIsLessonEditorEditing(false)
                                setTopicError(null)
                              }}
                            >
                              Закрыть
                            </Button>

                            <Button
                              type="button"
                              variant={activeLessonCompleted ? 'secondary' : 'primary'}
                              disabled={isSavingTopic || isSavingCompletion}
                              onClick={() =>
                                void (activeLessonCompleted
                                  ? cancelLessonCompletion()
                                  : completeLesson())
                              }
                            >
                              {isSavingCompletion
                                ? 'Сохранение...'
                                : activeLessonCompleted
                                  ? 'Отменить проведение'
                                  : 'Провести занятие'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mt-4 grid gap-4">
                            <label className="grid gap-2">
                              <span className="text-sm font-medium text-[var(--color-text)]">
                                Тема занятия
                              </span>
                              <Input
                                value={topicDraft}
                                placeholder="Например: Производные и правила дифференцирования"
                                onChange={(event) => {
                                  setTopicDraft(event.target.value)
                                  setTopicError(null)
                                }}
                              />
                            </label>

                            <label className="grid gap-2">
                              <span className="text-sm font-medium text-[var(--color-text)]">
                                Заметки
                              </span>
                              <Textarea
                                value={lessonNoteDraft}
                                placeholder="Например: что объяснили, что задали, что нужно повторить"
                                onChange={(event) => setLessonNoteDraft(event.target.value)}
                              />
                            </label>
                          </div>

                          <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setActiveTopicColumnId('')
                                setTopicDraft('')
                                setLessonNoteDraft('')
                                setIsLessonEditorEditing(false)
                                setTopicError(null)
                              }}
                            >
                              Закрыть
                            </Button>

                            <Button
                              type="button"
                              variant={activeLessonCompleted ? 'secondary' : 'primary'}
                              disabled={isSavingTopic || isSavingCompletion}
                              onClick={() =>
                                void (activeLessonCompleted
                                  ? cancelLessonCompletion()
                                  : completeLesson())
                              }
                            >
                              {isSavingCompletion
                                ? 'Сохранение...'
                                : activeLessonCompleted
                                  ? 'Отменить проведение'
                                  : 'Провести занятие'}
                            </Button>

                            <Button
                              type="button"
                              disabled={isSavingTopic || isSavingCompletion}
                              onClick={() => void saveTopic()}
                            >
                              {isSavingTopic ? 'Сохранение...' : 'Сохранить занятие'}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    {renderIntermediateGradeItemEditor()}
                    {renderIntermediateGradesJournal()}
                  </div>
                ) : !activeFinalAssessmentRound ? (
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

function ScoreInput({
  value,
  disabled,
  toneClassName,
  onCommit
}: {
  value: string
  min: number
  max: number
  disabled?: boolean
  toneClassName?: string
  onCommit: (value: string) => void
}): ReactElement {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <Input
      value={draft}
      inputMode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
      disabled={disabled}
      className={`h-8 w-24 text-center text-xs ${toneClassName ?? ''}`}
      placeholder="—"
      onChange={(event) => {
        setDraft(sanitizeScoreInput(event.target.value))
      }}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
      }}
    />
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

function createIntermediateGradeItemGroups(
  gradeItems: AdminCrudRecord[],
  getGradeItemElementType: (gradeItem: AdminCrudRecord) => AdminCrudRecord | null
): IntermediateGradeItemGroup[] {
  const groupByKey = new Map<string, IntermediateGradeItemGroup>()

  gradeItems.forEach((gradeItem) => {
    const gradeElementType = getGradeItemElementType(gradeItem)
    const key = gradeElementType?.id ? String(gradeElementType.id) : 'unknown'
    const existingGroup = groupByKey.get(key)

    if (existingGroup) {
      existingGroup.gradeItems.push(gradeItem)
      return
    }

    groupByKey.set(key, {
      key,
      gradeElementType,
      title: gradeElementType ? getRecordName(gradeElementType) : 'Тип не указан',
      gradeItems: [gradeItem]
    })
  })

  return [...groupByKey.values()]
    .map((group) => ({
      ...group,
      gradeItems: [...group.gradeItems].sort(compareGradeItems)
    }))
    .sort((firstGroup, secondGroup) => {
      const titleComparison = firstGroup.title.localeCompare(secondGroup.title, 'ru')

      if (titleComparison !== 0) {
        return titleComparison
      }

      return firstGroup.key.localeCompare(secondGroup.key, 'ru')
    })
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

function compareGradeItems(firstItem: AdminCrudRecord, secondItem: AdminCrudRecord): number {
  const firstDate = String(firstItem.grade_date ?? '')
  const secondDate = String(secondItem.grade_date ?? '')

  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate)
  }

  const firstWeekId = toNumberOrNull(firstItem.week_id) ?? 0
  const secondWeekId = toNumberOrNull(secondItem.week_id) ?? 0

  if (firstWeekId !== secondWeekId) {
    return firstWeekId - secondWeekId
  }

  const firstDayOfWeek = toNumberOrNull(firstItem.day_of_week) ?? 0
  const secondDayOfWeek = toNumberOrNull(secondItem.day_of_week) ?? 0

  if (firstDayOfWeek !== secondDayOfWeek) {
    return firstDayOfWeek - secondDayOfWeek
  }

  return Number(firstItem.id ?? 0) - Number(secondItem.id ?? 0)
}

function createDefaultGradeItemName(
  gradeElementType: AdminCrudRecord | null,
  column: ScheduleJournalColumn
): string {
  const gradeElementName = gradeElementType ? getRecordName(gradeElementType) : 'Оценочный элемент'

  return `${gradeElementName} - ${formatJournalDate(column.date)}`
}

function getGradeElementTypeMaxScore(gradeElementType: AdminCrudRecord | null): number {
  if (gradeElementType?.grading_mode === 'pass_fail') {
    return 1
  }

  const maxScore = toNumberOrNull(gradeElementType?.max_score)

  if (maxScore === null || maxScore <= 0) {
    throw new Error('У выбранного оценочного элемента некорректно задан максимальный балл')
  }

  return maxScore
}

function sanitizeScoreInput(value: string): string {
  const normalized = value.replace(/[^\d.,]/g, '').replace(',', '.')
  const parts = normalized.split('.')

  if (parts.length <= 1) {
    return normalized
  }

  return `${parts[0]}.${parts.slice(1).join('')}`
}

function areNumbersClose(firstValue: number, secondValue: number): boolean {
  return Math.abs(firstValue - secondValue) < 0.0001
}

function formatScoreValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(2).replace(/\.?0+$/, '')
}

function getGradeToneClassName(tone: GradeTone): string {
  switch (tone) {
    case 'minimum':
      return 'border-red-300 bg-red-100 text-red-900'
    case 'belowPassing':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'passing':
      return 'border-lime-200 bg-lime-50 text-lime-800'
    case 'maximum':
      return 'border-green-400 bg-green-100 text-green-900 font-semibold'
    default:
      return ''
  }
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
function getPersonShortName(record: AdminCrudRecord): string {
  const lastName = String(record.last_name ?? '').trim()
  const initials = [record.first_name, record.middle_name]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .map((value) => {
      const firstLetter = Array.from(value)[0]?.toLocaleUpperCase('ru-RU') ?? ''

      return firstLetter ? `${firstLetter}.` : ''
    })
    .filter(Boolean)
    .join(' ')

  if (lastName && initials) {
    return `${lastName} ${initials}`
  }

  if (lastName) {
    return lastName
  }

  return getPersonFullName(record)
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

function createTopicColumnTitle(
  column: ScheduleJournalColumn,
  topic: string,
  note: string,
  teacherName: string
): string {
  return [
    getJournalPairLabel(column),
    teacherName ? `Преподаватель: ${teacherName}` : 'Преподаватель не указан',
    topic ? `Тема: ${topic}` : 'Тема не указана',
    note ? `Заметки: ${note}` : 'Заметки не указаны'
  ].join('\n')
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

function filterFinalAssessmentRoundsForWeek({
  finalAssessmentRounds,
  finalAssessments,
  selectedGroupId,
  selectedSemesterId,
  selectedWeekId
}: {
  finalAssessmentRounds: AdminCrudRecord[]
  finalAssessments: AdminCrudRecord[]
  selectedGroupId: unknown
  selectedSemesterId: unknown
  selectedWeekId: unknown
}): AdminCrudRecord[] {
  const groupId = toNumberOrNull(selectedGroupId)
  const semesterId = toNumberOrNull(selectedSemesterId)
  const weekId = toNumberOrNull(selectedWeekId)

  if (groupId === null || semesterId === null || weekId === null) {
    return []
  }

  return finalAssessmentRounds
    .filter((round) => {
      if (String(round.status ?? '') === 'cancelled') {
        return false
      }

      if (!round.assessment_date || !round.starts_at || !round.ends_at) {
        return false
      }

      if (Number(round.week_id) !== weekId) {
        return false
      }

      const assessment = getFinalAssessmentForRound(round, finalAssessments)

      if (!assessment) {
        return false
      }

      return (
        Number(assessment.group_id) === groupId && Number(assessment.semester_id) === semesterId
      )
    })
    .sort(compareFinalAssessmentRounds)
}

function getFinalAssessmentForRound(
  round: AdminCrudRecord,
  finalAssessments: AdminCrudRecord[]
): AdminCrudRecord | null {
  return (
    finalAssessments.find(
      (assessment) => Number(assessment.id) === Number(round.final_assessment_id)
    ) ?? null
  )
}

function getLessonPeriodByNumber(
  lessonNumber: number,
  lessonPeriods: AdminCrudRecord[]
): AdminCrudRecord | null {
  return (
    lessonPeriods.find((lessonPeriod) => {
      const number = toNumberOrNull(lessonPeriod.number) ?? toNumberOrNull(lessonPeriod.id)

      return number === lessonNumber
    }) ?? null
  )
}

function doTimeRangesOverlapByText(
  firstStartValue: unknown,
  firstEndValue: unknown,
  secondStartValue: unknown,
  secondEndValue: unknown
): boolean {
  const firstStart = parseTimeToMinutes(firstStartValue)
  const firstEnd = parseTimeToMinutes(firstEndValue)
  const secondStart = parseTimeToMinutes(secondStartValue)
  const secondEnd = parseTimeToMinutes(secondEndValue)

  if (
    firstStart === null ||
    firstEnd === null ||
    secondStart === null ||
    secondEnd === null
  ) {
    return false
  }

  return firstStart < secondEnd && secondStart < firstEnd
}

function parseTimeToMinutes(value: unknown): number | null {
  const match = String(value ?? '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})/)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return hours * 60 + minutes
}
function formatFinalAssessmentRoundDateTime(round: AdminCrudRecord): string {
  const date = formatJournalDate(String(round.assessment_date ?? ''))
  const startsAt = String(round.starts_at ?? '').trim()
  const endsAt = String(round.ends_at ?? '').trim()

  return startsAt && endsAt ? `${date} · ${startsAt}–${endsAt}` : date
}

function getRoundLabel(value: unknown): string {
  const labels: Record<string, string> = {
    main: 'Основной тур',
    retake: 'Пересдача',
    commission: 'Комиссия'
  }

  return labels[String(value ?? '')] ?? String(value ?? '—')
}

function compareFinalAssessmentRounds(
  firstRound: AdminCrudRecord,
  secondRound: AdminCrudRecord
): number {
  const firstDate = String(firstRound.assessment_date ?? '')
  const secondDate = String(secondRound.assessment_date ?? '')

  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate)
  }

  const firstTime = String(firstRound.starts_at ?? '')
  const secondTime = String(secondRound.starts_at ?? '')

  if (firstTime !== secondTime) {
    return firstTime.localeCompare(secondTime)
  }

  return Number(firstRound.id ?? 0) - Number(secondRound.id ?? 0)
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

function getUserFacingError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback
  }

  const message = error.message
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^SqliteError:\s*/i, '')
    .trim()

  if (!message || /constraint failed|SQLITE_CONSTRAINT/i.test(message)) {
    return `${fallback}. Обновите данные и повторите попытку`
  }

  return message
}
