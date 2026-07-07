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
import { createDisciplineProgressMap } from '../../academic-process/lib/disciplineProgress'
import type { DisciplineProgress } from '../../academic-process/lib/disciplineProgress'

const emptySelectValue = '__empty__'

type FilterOption = {
  value: string
  label: string
}

type DisciplineSemesterGroup = {
  key: string
  title: string
  disciplines: AdminCrudRecord[]
}

type GradeItemGroup = {
  key: string
  title: string
  gradeElementType: AdminCrudRecord | null
  gradeItems: AdminCrudRecord[]
}

type LessonSessionSummary = {
  session: AdminCrudRecord
  scheduleItem: AdminCrudRecord
}

export function LearningJournalDisciplineGroup(): ReactElement {
  const [faculties, setFaculties] = useState<AdminCrudRecord[]>([])
  const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
  const [groups, setGroups] = useState<AdminCrudRecord[]>([])
  const [students, setStudents] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [curriculumItems, setCurriculumItems] = useState<AdminCrudRecord[]>([])
  const [academicYears, setAcademicYears] = useState<AdminCrudRecord[]>([])
  const [semesters, setSemesters] = useState<AdminCrudRecord[]>([])
  const [weeks, setWeeks] = useState<AdminCrudRecord[]>([])
  const [scheduleItems, setScheduleItems] = useState<AdminCrudRecord[]>([])
  const [lessonPeriods, setLessonPeriods] = useState<AdminCrudRecord[]>([])
  const [lessonSessions, setLessonSessions] = useState<AdminCrudRecord[]>([])
  const [gradeElementTypes, setGradeElementTypes] = useState<AdminCrudRecord[]>([])
  const [gradeItems, setGradeItems] = useState<AdminCrudRecord[]>([])
  const [grades, setGrades] = useState<AdminCrudRecord[]>([])
  const [teachers, setTeachers] = useState<AdminCrudRecord[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AdminCrudRecord[]>([])
  const [attendanceStatuses, setAttendanceStatuses] = useState<AdminCrudRecord[]>([])

  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const [
        facultiesResult,
        specialtiesResult,
        groupsResult,
        studentsResult,
        subjectsResult,
        disciplinesResult,
        curriculumItemsResult,
        academicYearsResult,
        semestersResult,
        weeksResult,
        scheduleItemsResult,
        lessonPeriodsResult,
        lessonSessionsResult,
        gradeElementTypesResult,
        gradeItemsResult,
        gradesResult,
        teachersResult,
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
          pageSize: 3000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'disciplines',
          page: 1,
          pageSize: 5000,
          orderBy: 'semester_id',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'curriculum_items',
          page: 1,
          pageSize: 5000,
          orderBy: 'semester_id',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'academic_years',
          page: 1,
          pageSize: 500,
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
          pageSize: 10000,
          orderBy: 'day_of_week',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'lesson_periods',
          page: 1,
          pageSize: 500,
          orderBy: 'number',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'lesson_sessions',
          page: 1,
          pageSize: 10000,
          orderBy: 'lesson_date',
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
          entity: 'teachers',
          page: 1,
          pageSize: 3000,
          orderBy: 'last_name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'attendance_records',
          page: 1,
          pageSize: 20000,
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
      setCurriculumItems(curriculumItemsResult.items)
      setAcademicYears(academicYearsResult.items)
      setSemesters(semestersResult.items)
      setWeeks(weeksResult.items)
      setScheduleItems(scheduleItemsResult.items)
      setLessonPeriods(lessonPeriodsResult.items)
      setLessonSessions(lessonSessionsResult.items)
      setGradeElementTypes(gradeElementTypesResult.items)
      setGradeItems(gradeItemsResult.items)
      setGrades(gradesResult.items)
      setTeachers(teachersResult.items)
      setAttendanceRecords(attendanceRecordsResult.items)
      setAttendanceStatuses(attendanceStatusesResult.items)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить аналитику')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  )

  const selectedDiscipline = useMemo(
    () => disciplines.find((discipline) => String(discipline.id) === selectedDisciplineId) ?? null,
    [disciplines, selectedDisciplineId]
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

  const subjectNameById = useMemo(() => createRecordNameMap(subjects), [subjects])
  const semesterById = useMemo(() => createRecordMap(semesters), [semesters])
  const academicYearById = useMemo(() => createRecordMap(academicYears), [academicYears])
  const teacherById = useMemo(() => createRecordMap(teachers), [teachers])
  const weekById = useMemo(() => createRecordMap(weeks), [weeks])
  const lessonPeriodById = useMemo(() => createRecordMap(lessonPeriods), [lessonPeriods])
  const gradeElementTypeById = useMemo(
    () => createRecordMap(gradeElementTypes),
    [gradeElementTypes]
  )
  const attendanceStatusById = useMemo(
    () => createRecordMap(attendanceStatuses),
    [attendanceStatuses]
  )

  const disciplineProgressById = useMemo(
    () =>
      createDisciplineProgressMap({
        disciplines,
        curriculumItems,
        scheduleItems,
        lessonSessions
      }),
    [curriculumItems, disciplines, lessonSessions, scheduleItems]
  )

  const disciplineSemesterGroups = useMemo(
    () =>
      createDisciplineSemesterGroups({
        disciplines: groupDisciplines,
        semesterById,
        academicYearById,
        subjectNameById
      }),
    [academicYearById, groupDisciplines, semesterById, subjectNameById]
  )

  const selectedDisciplineGradeItems = useMemo(() => {
    if (!selectedDiscipline) {
      return []
    }

    return gradeItems
      .filter((gradeItem) => Number(gradeItem.discipline_id) === Number(selectedDiscipline.id))
      .sort(compareGradeItems)
  }, [gradeItems, selectedDiscipline])

  const selectedIntermediateGradeItems = useMemo(
    () =>
      selectedDisciplineGradeItems.filter((gradeItem) =>
        isIntermediateGradeItem(gradeItem, gradeElementTypeById)
      ),
    [gradeElementTypeById, selectedDisciplineGradeItems]
  )

  const selectedFinalGradeItems = useMemo(
    () =>
      selectedDisciplineGradeItems.filter((gradeItem) =>
        isFinalGradeItem(gradeItem, gradeElementTypeById)
      ),
    [gradeElementTypeById, selectedDisciplineGradeItems]
  )

  const selectedIntermediateGradeItemGroups = useMemo(
    () => groupGradeItemsByElementType(selectedIntermediateGradeItems, gradeElementTypeById),
    [gradeElementTypeById, selectedIntermediateGradeItems]
  )

  const selectedDisciplineScheduleItems = useMemo(() => {
    if (!selectedDiscipline) {
      return []
    }

    return scheduleItems.filter(
      (scheduleItem) => Number(scheduleItem.discipline_id) === Number(selectedDiscipline.id)
    )
  }, [scheduleItems, selectedDiscipline])

  const selectedDisciplineLessonSessions = useMemo(
    () =>
      createLessonSessionSummaries({
        scheduleItems: selectedDisciplineScheduleItems,
        lessonSessions,
        weekById,
        lessonPeriodById
      }),
    [lessonPeriodById, lessonSessions, selectedDisciplineScheduleItems, weekById]
  )

  function handleFacultyChange(value: string): void {
    setSelectedFacultyId(value)
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedDisciplineId('')
  }

  function handleSpecialtyChange(value: string): void {
    setSelectedSpecialtyId(value)
    setSelectedGroupId('')
    setSelectedDisciplineId('')
  }

  function handleGroupChange(value: string): void {
    setSelectedGroupId(value)
    setSelectedDisciplineId('')
  }

  function getDisciplineProgress(discipline: AdminCrudRecord): DisciplineProgress | undefined {
    const disciplineId = toNumberOrNull(discipline.id)

    return disciplineId === null ? undefined : disciplineProgressById.get(disciplineId)
  }

  function getTeacherName(value: unknown): string {
    const teacherId = toNumberOrNull(value)

    if (teacherId === null) {
      return 'Преподаватель не указан'
    }

    const teacher = teacherById.get(teacherId)

    return teacher ? getPersonFullName(teacher) : `Преподаватель #${teacherId}`
  }

  function getStudentResult(student: AdminCrudRecord): {
    gradesCount: number
    scoreAverage: string
    passFail: string
    finalAverage: string
    attendance: string
  } {
    const disciplineGradeItemIds = new Set(
      selectedDisciplineGradeItems.map((item) => Number(item.id))
    )
    const studentGrades = grades.filter(
      (grade) =>
        Number(grade.student_id) === Number(student.id) &&
        disciplineGradeItemIds.has(Number(grade.grade_item_id))
    )
    const scoreGrades = studentGrades
      .filter((grade) => {
        const gradeItem = selectedDisciplineGradeItems.find(
          (item) => Number(item.id) === Number(grade.grade_item_id)
        )
        const gradeElementType = gradeItem
          ? getGradeElementType(gradeItem, gradeElementTypeById)
          : null

        return (
          gradeElementType?.grading_mode !== 'pass_fail' && Number(gradeElementType?.is_final) !== 1
        )
      })
      .map((grade) => toNumberOrNull(grade.score))
      .filter((score): score is number => score !== null)
    const passFailGrades = studentGrades.filter((grade) => {
      const gradeItem = selectedDisciplineGradeItems.find(
        (item) => Number(item.id) === Number(grade.grade_item_id)
      )
      const gradeElementType = gradeItem
        ? getGradeElementType(gradeItem, gradeElementTypeById)
        : null

      return (
        gradeElementType?.grading_mode === 'pass_fail' && Number(gradeElementType?.is_final) !== 1
      )
    })
    const finalScores = studentGrades
      .filter((grade) => {
        const gradeItem = selectedDisciplineGradeItems.find(
          (item) => Number(item.id) === Number(grade.grade_item_id)
        )

        return gradeItem ? isFinalGradeItem(gradeItem, gradeElementTypeById) : false
      })
      .map((grade) => toNumberOrNull(grade.score))
      .filter((score): score is number => score !== null)
    const lessonSessionIds = new Set(
      selectedDisciplineLessonSessions.map((summary) => Number(summary.session.id))
    )
    const studentAttendanceRecords = attendanceRecords.filter(
      (record) =>
        Number(record.student_id) === Number(student.id) &&
        lessonSessionIds.has(Number(record.lesson_session_id))
    )
    const presentCount = studentAttendanceRecords.filter((record) => {
      const status = attendanceStatusById.get(Number(record.attendance_status_id))
      const key = String(status?.item_key ?? '')

      return key === 'present' || key === 'late' || key === 'online'
    }).length

    return {
      gradesCount: studentGrades.length,
      scoreAverage:
        scoreGrades.length === 0 ? '—' : formatScoreValue(calculateAverage(scoreGrades)),
      passFail:
        passFailGrades.length === 0
          ? '—'
          : `Сдано ${passFailGrades.filter((grade) => Number(grade.score) >= 1).length}/${passFailGrades.length}`,
      finalAverage:
        finalScores.length === 0 ? '—' : formatScoreValue(calculateAverage(finalScores)),
      attendance: `${presentCount}/${selectedDisciplineLessonSessions.length}`
    }
  }

  function renderDisciplineCard(discipline: AdminCrudRecord): ReactElement {
    const progress = getDisciplineProgress(discipline)
    const disciplineId = Number(discipline.id)
    const intermediateItems = gradeItems.filter(
      (gradeItem) =>
        Number(gradeItem.discipline_id) === disciplineId &&
        isIntermediateGradeItem(gradeItem, gradeElementTypeById)
    )
    const finalItems = gradeItems.filter(
      (gradeItem) =>
        Number(gradeItem.discipline_id) === disciplineId &&
        isFinalGradeItem(gradeItem, gradeElementTypeById)
    )
    const isSelected = selectedDisciplineId === String(discipline.id)

    return (
      <button
        key={String(discipline.id)}
        type="button"
        className={`grid gap-3 rounded-lg border p-3 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 ${
          isSelected
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
        }`}
        onClick={() => setSelectedDisciplineId(String(discipline.id))}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {getDisciplineName(discipline, subjectNameById)}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {getTeacherName(discipline.teacher_id)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {progress?.isFullyScheduled ? (
              <Badge variant="success">Расписание заполнено</Badge>
            ) : null}
            {intermediateItems.length > 0 ? (
              <Badge variant="muted">Есть промежуточные</Badge>
            ) : null}
            {finalItems.length > 0 ? <Badge variant="warning">Есть итоговый</Badge> : null}
          </div>
        </div>

        <div className="grid gap-1 text-xs text-[var(--color-text-muted)] md:grid-cols-3">
          <span>
            Пары: проведено {progress?.conductedPairs ?? 0} / требуется{' '}
            {progress?.requiredPairs ?? 0}
          </span>
          <span>
            В расписании: {progress?.scheduledPairs ?? 0} / {progress?.requiredPairs ?? 0}
          </span>
          <span>Осталось: {progress?.remainingPairs ?? 0}</span>
        </div>
      </button>
    )
  }

  function renderDisciplineDetails(): ReactElement {
    if (!selectedDiscipline || !selectedGroup) {
      return <EmptyState text="Выбери дисциплину, чтобы открыть подробную сводку." />
    }

    const progress = getDisciplineProgress(selectedDiscipline)
    const requiredPairs = progress?.requiredPairs ?? 0
    const scheduledPairs = progress?.scheduledPairs ?? 0
    const conductedPairs = progress?.conductedPairs ?? 0
    const remainingConductedPairs = Math.max(requiredPairs - conductedPairs, 0)
    const semester = semesterById.get(Number(selectedDiscipline.semester_id))
    const scheduledPercent = getProgressPercent(scheduledPairs, requiredPairs)
    const conductedPercent = getProgressPercent(conductedPairs, requiredPairs)

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Дисциплина: {getDisciplineName(selectedDiscipline, subjectNameById)}
          </CardTitle>
          <CardDescription>
            {getRecordName(selectedGroup)} ·{' '}
            {semester ? getSemesterLabel(semester, academicYearById) : 'Без семестра'} ·{' '}
            {getTeacherName(selectedDiscipline.teacher_id)}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <div className="rounded-xl border border-[var(--color-border)] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Прогресс занятий</p>
                <div className="mt-2 grid gap-1 text-sm text-[var(--color-text-muted)] sm:grid-cols-2">
                  <span>По плану: {requiredPairs} пар</span>
                  <span>Добавлено в расписание: {scheduledPairs}</span>
                  <span>Проведено: {conductedPairs}</span>
                  <span>Осталось добавить: {progress?.remainingPairs ?? 0}</span>
                  <span>Осталось провести: {remainingConductedPairs}</span>
                </div>
              </div>

              <div className="grid min-w-64 gap-3">
                <ProgressLine label="Расписание" value={scheduledPercent} />
                <ProgressLine label="Проведено" value={conductedPercent} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-semibold text-[var(--color-text)]">Проведённые занятия</p>
              {selectedDisciplineLessonSessions.length === 0 ? (
                <EmptyState text="По этой дисциплине ещё нет проведённых занятий." />
              ) : (
                <div className="mt-3 grid gap-2">
                  {selectedDisciplineLessonSessions.map(({ session, scheduleItem }) => (
                    <div
                      key={String(session.id)}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-[var(--color-text)]">
                        {formatDateForDisplay(session.lesson_date, 'Без даты')} ·{' '}
                        {getWeekShortLabel(scheduleItem.week_id, weekById)} ·{' '}
                        {getDayOfWeekLabel(scheduleItem.day_of_week)} ·{' '}
                        {getLessonNumberLabel(scheduleItem, lessonPeriodById)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {String(session.topic ?? '').trim() || 'Тема не указана'} ·{' '}
                        {getSessionStatusLabel(session.status)} ·{' '}
                        {getTeacherName(session.teacher_id ?? scheduleItem.teacher_id)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Итоговые оценочные элементы
              </p>
              {selectedFinalGradeItems.length === 0 ? (
                <EmptyState text="Итоговые оценочные элементы ещё не добавлены." />
              ) : (
                <GradeItemsList
                  gradeItems={selectedFinalGradeItems}
                  gradeElementTypeById={gradeElementTypeById}
                  grades={grades}
                  groupStudentsCount={groupStudents.length}
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Промежуточные оценочные элементы
            </p>
            {selectedIntermediateGradeItemGroups.length === 0 ? (
              <EmptyState text="Промежуточные оценочные элементы ещё не проводились." />
            ) : (
              <div className="mt-3 grid gap-3">
                {selectedIntermediateGradeItemGroups.map((group) => (
                  <div
                    key={group.key}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 p-3"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {group.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {getGradeElementTypeDescription(group.gradeElementType)}
                        </p>
                      </div>
                      <Badge variant="muted">Работ: {group.gradeItems.length}</Badge>
                    </div>

                    <GradeItemsList
                      gradeItems={group.gradeItems}
                      gradeElementTypeById={gradeElementTypeById}
                      grades={grades}
                      groupStudentsCount={groupStudents.length}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Студенты и результаты</p>
            {groupStudents.length === 0 ? (
              <EmptyState text="В выбранной группе пока нет студентов." />
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full min-w-max border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--color-surface-muted)]">
                      <th className="border-b border-r border-[var(--color-border)] px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">
                        Студент
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-3 py-2 text-center">
                        Оценок
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-3 py-2 text-center">
                        Средний балл
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-3 py-2 text-center">
                        Сдал / не сдал
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-3 py-2 text-center">
                        Итоговые
                      </th>
                      <th className="border-b border-[var(--color-border)] px-3 py-2 text-center">
                        Посещаемость
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupStudents.map((student) => {
                      const result = getStudentResult(student)

                      return (
                        <tr
                          key={String(student.id)}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td className="border-r border-[var(--color-border)] px-3 py-2 text-[var(--color-text)]">
                            {getPersonFullName(student)}
                          </td>
                          <td className="border-r border-[var(--color-border)] px-3 py-2 text-center">
                            {result.gradesCount}
                          </td>
                          <td className="border-r border-[var(--color-border)] px-3 py-2 text-center">
                            {result.scoreAverage}
                          </td>
                          <td className="border-r border-[var(--color-border)] px-3 py-2 text-center">
                            {result.passFail}
                          </td>
                          <td className="border-r border-[var(--color-border)] px-3 py-2 text-center">
                            {result.finalAverage}
                          </td>
                          <td className="px-3 py-2 text-center">{result.attendance}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Аналитика дисциплин группы</CardTitle>
              <CardDescription>
                Выбери факультет, специальность и группу. Семестры будут показаны автоматически.
              </CardDescription>
            </div>

            <Button variant="secondary" disabled={isLoading} onClick={() => void loadData()}>
              <FiRefreshCcw />
              {isLoading ? 'Загрузка...' : 'Обновить'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <DisciplineFilterSelect
              label="Факультет"
              value={selectedFacultyId}
              placeholder="Выбери факультет"
              options={faculties.map(toFilterOption)}
              onChange={handleFacultyChange}
            />

            <DisciplineFilterSelect
              label="Специальность"
              value={selectedSpecialtyId}
              placeholder={selectedFacultyId ? 'Выбери специальность' : 'Сначала факультет'}
              disabled={!selectedFacultyId}
              options={filteredSpecialties.map(toFilterOption)}
              onChange={handleSpecialtyChange}
            />

            <DisciplineFilterSelect
              label="Группа"
              value={selectedGroupId}
              placeholder={selectedSpecialtyId ? 'Выбери группу' : 'Сначала специальность'}
              disabled={!selectedSpecialtyId}
              options={filteredGroups.map(toFilterOption)}
              onChange={handleGroupChange}
            />
          </div>

          {loadError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {loadError}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedGroup
              ? `Дисциплины группы: ${getRecordName(selectedGroup)}`
              : 'Дисциплины группы'}
          </CardTitle>
          <CardDescription>
            Дисциплины сгруппированы по семестрам без ручного выбора семестра.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!selectedGroup ? <EmptyState text="Выбери группу, чтобы увидеть дисциплины." /> : null}

          {selectedGroup && groupDisciplines.length === 0 ? (
            <EmptyState text="У выбранной группы пока нет дисциплин." />
          ) : null}

          {selectedGroup && groupDisciplines.length > 0 ? (
            <div className="grid gap-4">
              {disciplineSemesterGroups.map((semesterGroup) => (
                <div
                  key={semesterGroup.key}
                  className="rounded-xl border border-[var(--color-border)] p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {semesterGroup.title}
                    </p>
                    <Badge variant="muted">
                      {getDisciplinesCountText(semesterGroup.disciplines.length)}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {semesterGroup.disciplines.map(renderDisciplineCard)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedGroup ? renderDisciplineDetails() : null}
    </div>
  )
}

function DisciplineFilterSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  onChange
}: {
  label: string
  value: string
  options: FilterOption[]
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
    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
      {text}
    </div>
  )
}

function ProgressLine({ label, value }: { label: string; value: number }): ReactElement {
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function GradeItemsList({
  gradeItems,
  gradeElementTypeById,
  grades,
  groupStudentsCount
}: {
  gradeItems: AdminCrudRecord[]
  gradeElementTypeById: Map<number, AdminCrudRecord>
  grades: AdminCrudRecord[]
  groupStudentsCount: number
}): ReactElement {
  return (
    <div className="mt-3 grid gap-2">
      {gradeItems.map((gradeItem) => {
        const gradeElementType = getGradeElementType(gradeItem, gradeElementTypeById)
        const itemGrades = grades.filter(
          (grade) => Number(grade.grade_item_id) === Number(gradeItem.id)
        )
        const stats = getGradeItemStatsText({
          gradeElementType,
          grades: itemGrades,
          groupStudentsCount
        })

        return (
          <div
            key={String(gradeItem.id)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {String(gradeItem.name ?? 'Оценочный элемент')}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {gradeElementType ? getRecordName(gradeElementType) : 'Тип не указан'} ·{' '}
                  {formatDateForDisplay(gradeItem.grade_date, 'Без даты')} · макс.{' '}
                  {String(gradeElementType?.max_score ?? gradeItem.max_score ?? '—')}
                </p>
              </div>
              <Badge variant="muted">{stats}</Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function toFilterOption(record: AdminCrudRecord): FilterOption {
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

function createDisciplineSemesterGroups({
  disciplines,
  semesterById,
  academicYearById,
  subjectNameById
}: {
  disciplines: AdminCrudRecord[]
  semesterById: Map<number, AdminCrudRecord>
  academicYearById: Map<number, AdminCrudRecord>
  subjectNameById: Map<number, string>
}): DisciplineSemesterGroup[] {
  const groupByKey = new Map<string, DisciplineSemesterGroup>()

  disciplines.forEach((discipline) => {
    const semesterId = toNumberOrNull(discipline.semester_id)
    const semester = semesterId === null ? null : (semesterById.get(semesterId) ?? null)
    const key = semesterId === null ? 'without_semester' : String(semesterId)
    const existingGroup = groupByKey.get(key)

    if (existingGroup) {
      existingGroup.disciplines.push(discipline)
      return
    }

    groupByKey.set(key, {
      key,
      title: semester ? getSemesterLabel(semester, academicYearById) : 'Без семестра',
      disciplines: [discipline]
    })
  })

  return [...groupByKey.values()]
    .map((group) => ({
      ...group,
      disciplines: [...group.disciplines].sort((firstDiscipline, secondDiscipline) =>
        getDisciplineName(firstDiscipline, subjectNameById).localeCompare(
          getDisciplineName(secondDiscipline, subjectNameById),
          'ru'
        )
      )
    }))
    .sort((firstGroup, secondGroup) => {
      if (firstGroup.key === 'without_semester') {
        return 1
      }

      if (secondGroup.key === 'without_semester') {
        return -1
      }

      return Number(firstGroup.key) - Number(secondGroup.key)
    })
}

function groupGradeItemsByElementType(
  gradeItems: AdminCrudRecord[],
  gradeElementTypeById: Map<number, AdminCrudRecord>
): GradeItemGroup[] {
  const groupByKey = new Map<string, GradeItemGroup>()

  gradeItems.forEach((gradeItem) => {
    const gradeElementType = getGradeElementType(gradeItem, gradeElementTypeById)
    const key = gradeElementType?.id ? String(gradeElementType.id) : 'unknown'
    const existingGroup = groupByKey.get(key)

    if (existingGroup) {
      existingGroup.gradeItems.push(gradeItem)
      return
    }

    groupByKey.set(key, {
      key,
      title: gradeElementType ? getRecordName(gradeElementType) : 'Тип не указан',
      gradeElementType,
      gradeItems: [gradeItem]
    })
  })

  return [...groupByKey.values()]
    .map((group) => ({
      ...group,
      gradeItems: [...group.gradeItems].sort(compareGradeItems)
    }))
    .sort((firstGroup, secondGroup) => firstGroup.title.localeCompare(secondGroup.title, 'ru'))
}

function createLessonSessionSummaries({
  scheduleItems,
  lessonSessions,
  weekById,
  lessonPeriodById
}: {
  scheduleItems: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
  weekById: Map<number, AdminCrudRecord>
  lessonPeriodById: Map<number, AdminCrudRecord>
}): LessonSessionSummary[] {
  const scheduleItemById = createRecordMap(scheduleItems)
  const scheduleItemIds = new Set(scheduleItems.map((item) => Number(item.id)))

  return lessonSessions
    .filter(
      (session) =>
        String(session.status ?? '') === 'conducted' &&
        scheduleItemIds.has(Number(session.schedule_item_id))
    )
    .map((session) => {
      const scheduleItem = scheduleItemById.get(Number(session.schedule_item_id))

      return scheduleItem ? { session, scheduleItem } : null
    })
    .filter((entry): entry is LessonSessionSummary => entry !== null)
    .sort((firstSummary, secondSummary) => {
      const firstDate = String(firstSummary.session.lesson_date ?? '')
      const secondDate = String(secondSummary.session.lesson_date ?? '')

      if (firstDate !== secondDate) {
        return firstDate.localeCompare(secondDate)
      }

      const firstWeek = weekById.get(Number(firstSummary.scheduleItem.week_id))
      const secondWeek = weekById.get(Number(secondSummary.scheduleItem.week_id))
      const firstWeekNumber = toNumberOrNull(firstWeek?.number) ?? 0
      const secondWeekNumber = toNumberOrNull(secondWeek?.number) ?? 0

      if (firstWeekNumber !== secondWeekNumber) {
        return firstWeekNumber - secondWeekNumber
      }

      const firstDayOfWeek = toNumberOrNull(firstSummary.scheduleItem.day_of_week) ?? 0
      const secondDayOfWeek = toNumberOrNull(secondSummary.scheduleItem.day_of_week) ?? 0

      if (firstDayOfWeek !== secondDayOfWeek) {
        return firstDayOfWeek - secondDayOfWeek
      }

      return (
        getLessonPeriodNumber(firstSummary.scheduleItem, lessonPeriodById) -
        getLessonPeriodNumber(secondSummary.scheduleItem, lessonPeriodById)
      )
    })
}

function isIntermediateGradeItem(
  gradeItem: AdminCrudRecord,
  gradeElementTypeById: Map<number, AdminCrudRecord>
): boolean {
  return Number(getGradeElementType(gradeItem, gradeElementTypeById)?.is_intermediate) === 1
}

function isFinalGradeItem(
  gradeItem: AdminCrudRecord,
  gradeElementTypeById: Map<number, AdminCrudRecord>
): boolean {
  return Number(getGradeElementType(gradeItem, gradeElementTypeById)?.is_final) === 1
}

function getGradeElementType(
  gradeItem: AdminCrudRecord,
  gradeElementTypeById: Map<number, AdminCrudRecord>
): AdminCrudRecord | null {
  const gradeElementTypeId = toNumberOrNull(gradeItem.grade_element_type_id)

  return gradeElementTypeId === null ? null : (gradeElementTypeById.get(gradeElementTypeId) ?? null)
}

function getGradeElementTypeDescription(gradeElementType: AdminCrudRecord | null): string {
  if (!gradeElementType) {
    return 'Правила оценивания не указаны'
  }

  if (gradeElementType.grading_mode === 'pass_fail') {
    return 'Сдал / не сдал'
  }

  const minScore = toNumberOrNull(gradeElementType.min_score) ?? 0
  const maxScore = toNumberOrNull(gradeElementType.max_score)
  const passingScore = toNumberOrNull(gradeElementType.passing_score)

  return [
    'Баллы',
    `мин. ${minScore}`,
    maxScore !== null ? `макс. ${maxScore}` : 'макс. не задан',
    passingScore !== null ? `проходной ${passingScore}` : 'проходной не задан'
  ].join(' · ')
}

function getGradeItemStatsText({
  gradeElementType,
  grades,
  groupStudentsCount
}: {
  gradeElementType: AdminCrudRecord | null
  grades: AdminCrudRecord[]
  groupStudentsCount: number
}): string {
  if (gradeElementType?.grading_mode === 'pass_fail') {
    const passedCount = grades.filter((grade) => Number(grade.score) >= 1).length

    return grades.length === 0 ? '—' : `Сдано ${passedCount}/${groupStudentsCount}`
  }

  const scores = grades
    .map((grade) => toNumberOrNull(grade.score))
    .filter((score): score is number => score !== null)

  return scores.length === 0 ? '—' : `Средний балл ${formatScoreValue(calculateAverage(scores))}`
}

function compareGradeItems(firstItem: AdminCrudRecord, secondItem: AdminCrudRecord): number {
  const firstDate = String(firstItem.grade_date ?? '')
  const secondDate = String(secondItem.grade_date ?? '')

  if (firstDate !== secondDate) {
    return firstDate.localeCompare(secondDate)
  }

  return Number(firstItem.id ?? 0) - Number(secondItem.id ?? 0)
}

function getDisciplineName(
  discipline: AdminCrudRecord,
  subjectNameById: Map<number, string>
): string {
  if (discipline.name) {
    return String(discipline.name)
  }

  const subjectId = toNumberOrNull(discipline.subject_id)

  return subjectId === null
    ? getRecordName(discipline)
    : (subjectNameById.get(subjectId) ?? `#${subjectId}`)
}

function getSemesterLabel(
  semester: AdminCrudRecord,
  academicYearById: Map<number, AdminCrudRecord>
): string {
  const academicYear = academicYearById.get(Number(semester.academic_year_id))
  const semesterName = semester.name
    ? String(semester.name)
    : `${String(semester.number ?? '')} семестр`

  return academicYear ? `${getRecordName(academicYear)} · ${semesterName}` : semesterName
}

function getDisciplinesCountText(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${count} дисциплина`
  }

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `${count} дисциплины`
  }

  return `${count} дисциплин`
}

function getWeekShortLabel(value: unknown, weekById: Map<number, AdminCrudRecord>): string {
  const week = weekById.get(Number(value))

  return week ? `${String(week.number ?? '')} неделя` : 'Неделя не указана'
}

function getDayOfWeekLabel(value: unknown): string {
  const labels: Record<number, string> = {
    1: 'Пн',
    2: 'Вт',
    3: 'Ср',
    4: 'Чт',
    5: 'Пт',
    6: 'Сб',
    7: 'Вс'
  }
  const dayOfWeek = toNumberOrNull(value)

  return dayOfWeek === null ? 'День не указан' : (labels[dayOfWeek] ?? `День ${dayOfWeek}`)
}

function getLessonNumberLabel(
  scheduleItem: AdminCrudRecord,
  lessonPeriodById: Map<number, AdminCrudRecord>
): string {
  return `${getLessonPeriodNumber(scheduleItem, lessonPeriodById)} пара`
}

function getLessonPeriodNumber(
  scheduleItem: AdminCrudRecord,
  lessonPeriodById: Map<number, AdminCrudRecord>
): number {
  const lessonPeriod = lessonPeriodById.get(Number(scheduleItem.lesson_period_id))

  return toNumberOrNull(lessonPeriod?.number) ?? toNumberOrNull(scheduleItem.lesson_period_id) ?? 0
}

function getSessionStatusLabel(value: unknown): string {
  const status = String(value ?? '')

  if (status === 'conducted') {
    return 'Проведено'
  }

  if (status === 'planned') {
    return 'Запланировано'
  }

  return status || 'Статус не указан'
}

function getProgressPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return Math.min(Math.round((value / total) * 100), 100)
}

function calculateAverage(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function formatScoreValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(2).replace(/\.?0+$/, '')
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

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
