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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../shared/ui'

const emptySelectValue = '__empty__'

type FilterOption = {
  value: string
  label: string
}

type GradeTone = 'empty' | 'minimum' | 'belowPassing' | 'passing' | 'maximum' | 'absent'
type GradeResultStatus = 'graded' | 'passed' | 'failed' | 'absent'

type DisciplineCompletionSummary = {
  total: number
  conducted: number
  completed: number
  remaining: number
  isCompleted: boolean
}

type GradeSaveValue = {
  score: number
  resultStatus: GradeResultStatus
}

export function FinalGradeElementsMatrix(): ReactElement {
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
  const [lessonSessions, setLessonSessions] = useState<AdminCrudRecord[]>([])
  const [lessonCompletionRecords, setLessonCompletionRecords] = useState<AdminCrudRecord[]>([])
  const [gradeElementTypes, setGradeElementTypes] = useState<AdminCrudRecord[]>([])
  const [gradeItems, setGradeItems] = useState<AdminCrudRecord[]>([])
  const [grades, setGrades] = useState<AdminCrudRecord[]>([])

  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [selectedFinalGradeItemId, setSelectedFinalGradeItemId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingGrade, setIsSavingGrade] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [gradeError, setGradeError] = useState<string | null>(null)

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
        academicYearsResult,
        semestersResult,
        weeksResult,
        scheduleItemsResult,
        lessonSessionsResult,
        lessonCompletionRecordsResult,
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
          entity: 'lesson_sessions',
          page: 1,
          pageSize: 10000,
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
      setLessonSessions(lessonSessionsResult.items)
      setLessonCompletionRecords(lessonCompletionRecordsResult.items)
      setGradeElementTypes(gradeElementTypesResult.items)
      setGradeItems(gradeItemsResult.items)
      setGrades(gradesResult.items)
    } catch (error) {
      setLoadError(getUserFacingError(error, 'Не удалось загрузить итоговую ведомость'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
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

  const selectedSemester = useMemo(
    () => semesters.find((semester) => String(semester.id) === selectedSemesterId) ?? null,
    [semesters, selectedSemesterId]
  )

  const selectedDiscipline = useMemo(
    () => disciplines.find((discipline) => String(discipline.id) === selectedDisciplineId) ?? null,
    [disciplines, selectedDisciplineId]
  )

  const gradeElementTypeById = useMemo(
    () => createRecordMap(gradeElementTypes),
    [gradeElementTypes]
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

  const semesterDisciplines = useMemo(() => {
    if (!selectedGroupId || !selectedSemesterId) {
      return []
    }

    return groupDisciplines
      .filter((discipline) => Number(discipline.semester_id) === Number(selectedSemesterId))
      .sort((firstDiscipline, secondDiscipline) =>
        getDisciplineName(firstDiscipline, subjects).localeCompare(
          getDisciplineName(secondDiscipline, subjects),
          'ru'
        )
      )
  }, [groupDisciplines, selectedGroupId, selectedSemesterId, subjects])

  const weekById = useMemo(() => createRecordMap(weeks), [weeks])
  const selectedDisciplineScheduleItems = useMemo(() => {
    if (!selectedGroupId || !selectedSemesterId || !selectedDisciplineId) {
      return []
    }

    return scheduleItems.filter((scheduleItem) => {
      if (
        Number(scheduleItem.group_id) !== Number(selectedGroupId) ||
        Number(scheduleItem.discipline_id) !== Number(selectedDisciplineId)
      ) {
        return false
      }

      const weekId = toNumberOrNull(scheduleItem.week_id)
      const week = weekId === null ? null : weekById.get(weekId)

      return Number(week?.semester_id) === Number(selectedSemesterId)
    })
  }, [scheduleItems, selectedDisciplineId, selectedGroupId, selectedSemesterId, weekById])

  const disciplineCompletionSummary = useMemo(
    () =>
      getDisciplineCompletionSummary({
        scheduleItems: selectedDisciplineScheduleItems,
        lessonSessions,
        lessonCompletionRecords
      }),
    [lessonCompletionRecords, lessonSessions, selectedDisciplineScheduleItems]
  )

  const scheduledFinalGradeItems = useMemo(() => {
    if (!selectedDisciplineId) {
      return []
    }

    return gradeItems
      .filter((gradeItem) => {
        const gradeElementTypeId = toNumberOrNull(gradeItem.grade_element_type_id)
        const gradeElementType =
          gradeElementTypeId === null ? null : gradeElementTypeById.get(gradeElementTypeId)

        return (
          Number(gradeItem.discipline_id) === Number(selectedDisciplineId) &&
          Number(gradeElementType?.is_final) === 1 &&
          toNumberOrNull(gradeItem.week_id) !== null &&
          toNumberOrNull(gradeItem.day_of_week) !== null &&
          toNumberOrNull(gradeItem.lesson_session_id) === null
        )
      })
      .sort(compareScheduledFinalGradeItems)
  }, [gradeElementTypeById, gradeItems, selectedDisciplineId])

  const selectedFinalGradeItem = useMemo(
    () =>
      scheduledFinalGradeItems.find(
        (gradeItem) => String(gradeItem.id) === selectedFinalGradeItemId
      ) ?? null,
    [scheduledFinalGradeItems, selectedFinalGradeItemId]
  )

  const selectedFinalType = useMemo(() => {
    const gradeElementTypeId = toNumberOrNull(selectedFinalGradeItem?.grade_element_type_id)

    return gradeElementTypeId === null
      ? null
      : (gradeElementTypeById.get(gradeElementTypeId) ?? null)
  }, [gradeElementTypeById, selectedFinalGradeItem])

  const hasCompleteSelection = Boolean(
    selectedFaculty &&
    selectedSpecialty &&
    selectedGroup &&
    selectedSemester &&
    selectedDiscipline &&
    selectedFinalGradeItem &&
    selectedFinalType
  )
  const isDisciplineCompleted = disciplineCompletionSummary.isCompleted
  const isGradeInputDisabled = isSavingGrade || !isDisciplineCompleted

  function handleFacultyChange(value: string): void {
    setSelectedFacultyId(value)
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalGradeItemId('')
    setGradeError(null)
  }

  function handleSpecialtyChange(value: string): void {
    setSelectedSpecialtyId(value)
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalGradeItemId('')
    setGradeError(null)
  }

  function handleGroupChange(value: string): void {
    setSelectedGroupId(value)
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalGradeItemId('')
    setGradeError(null)
  }

  function handleSemesterChange(value: string): void {
    setSelectedSemesterId(value)
    setSelectedDisciplineId('')
    setSelectedFinalGradeItemId('')
    setGradeError(null)
  }

  function handleDisciplineChange(value: string): void {
    setSelectedDisciplineId(value)
    setSelectedFinalGradeItemId('')
    setGradeError(null)
  }

  function handleFinalGradeItemChange(value: string): void {
    setSelectedFinalGradeItemId(value)
    setGradeError(null)
  }

  function resetFilters(): void {
    setSelectedFacultyId('')
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalGradeItemId('')
    setGradeError(null)
  }

  function getStudentGradeRecord(
    student: AdminCrudRecord,
    gradeItem: AdminCrudRecord | null
  ): AdminCrudRecord | null {
    if (!gradeItem?.id) {
      return null
    }

    return (
      grades.find(
        (grade) =>
          Number(grade.grade_item_id) === Number(gradeItem.id) &&
          Number(grade.student_id) === Number(student.id)
      ) ?? null
    )
  }

  async function saveStudentGrade(
    student: AdminCrudRecord,
    value: GradeSaveValue | null
  ): Promise<void> {
    if (isSavingGrade) {
      return
    }

    if (!selectedFinalGradeItem?.id) {
      setGradeError(
        'Сначала добавь итоговый оценочный элемент в расписании и выбери его в ведомости'
      )
      return
    }

    if (!isDisciplineCompleted) {
      setGradeError(
        'Итоговую ведомость можно заполнить только после завершения всех занятий дисциплины'
      )
      return
    }

    const studentId = toNumberOrNull(student.id)

    if (studentId === null) {
      setGradeError('Не удалось определить студента')
      return
    }

    setIsSavingGrade(true)
    setGradeError(null)

    try {
      const existingGrade = getStudentGradeRecord(student, selectedFinalGradeItem)

      if (value === null) {
        if (existingGrade?.id) {
          await window.api.adminCrud.delete({
            entity: 'grades',
            id: Number(existingGrade.id)
          })
          await loadData()
        }

        return
      }

      const payload = {
        score: value.score,
        result_status: value.resultStatus
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
          data: {
            grade_item_id: Number(selectedFinalGradeItem.id),
            student_id: studentId,
            ...payload,
            comment: null,
            graded_by_user_id: null
          }
        })
      }

      await loadData()
    } catch (error) {
      setGradeError(getUserFacingError(error, 'Не удалось сохранить итоговую оценку'))
    } finally {
      setIsSavingGrade(false)
    }
  }

  function handleScoreStatusChange(student: AdminCrudRecord, value: string): void {
    if (value === emptySelectValue) {
      void saveStudentGrade(student, null)
      return
    }

    if (value === 'absent') {
      void saveStudentGrade(student, { score: 0, resultStatus: 'absent' })
      return
    }
  }

  function handleScoreGradeBlur(student: AdminCrudRecord, value: string): void {
    const trimmedValue = value.trim().replace(',', '.')

    if (!trimmedValue) {
      void saveStudentGrade(student, null)
      return
    }

    const score = Number(trimmedValue)
    const minScore = getGradeElementTypeMinScore(selectedFinalType)
    const maxScore = getGradeElementTypeMaxScore(selectedFinalType)

    if (!Number.isFinite(score) || score < minScore || score > maxScore) {
      setGradeError(`Оценка должна быть числом от ${minScore} до ${maxScore}`)
      return
    }

    void saveStudentGrade(student, { score, resultStatus: 'graded' })
  }

  function handlePassFailGradeChange(student: AdminCrudRecord, value: string): void {
    if (value === emptySelectValue) {
      void saveStudentGrade(student, null)
      return
    }

    if (value === 'absent') {
      void saveStudentGrade(student, { score: 0, resultStatus: 'absent' })
      return
    }

    void saveStudentGrade(student, {
      score: value === 'passed' ? 1 : 0,
      resultStatus: value === 'passed' ? 'passed' : 'failed'
    })
  }

  function renderStatusCell(student: AdminCrudRecord): ReactElement {
    const grade = getStudentGradeRecord(student, selectedFinalGradeItem)
    const status = getGradeResultStatus(grade, selectedFinalType)

    if (selectedFinalType?.grading_mode === 'pass_fail') {
      return (
        <Select
          value={grade ? status : emptySelectValue}
          disabled={isGradeInputDisabled}
          onValueChange={(nextValue) => handlePassFailGradeChange(student, nextValue)}
        >
          <SelectTrigger className="mx-auto h-8 w-36 text-xs">
            <SelectValue placeholder="—" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={emptySelectValue}>—</SelectItem>
            <SelectItem value="absent">Неявка</SelectItem>
            <SelectItem value="passed">Сдал</SelectItem>
            <SelectItem value="failed">Не сдал</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    return (
      <Select
        value={grade ? status : emptySelectValue}
        disabled={isGradeInputDisabled}
        onValueChange={(nextValue) => handleScoreStatusChange(student, nextValue)}
      >
        <SelectTrigger className="mx-auto h-8 w-36 text-xs">
          <SelectValue placeholder="—" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={emptySelectValue}>—</SelectItem>
          <SelectItem value="absent">Неявка</SelectItem>
          <SelectItem value="graded">Оценено</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  function renderScoreCell(student: AdminCrudRecord): ReactElement {
    const grade = getStudentGradeRecord(student, selectedFinalGradeItem)
    const status = getGradeResultStatus(grade, selectedFinalType)

    if (selectedFinalType?.grading_mode === 'pass_fail') {
      return <span className="text-xs text-[var(--color-text-muted)]">—</span>
    }

    const score = status === 'absent' ? null : toNumberOrNull(grade?.score)
    const minScore = getGradeElementTypeMinScore(selectedFinalType)
    const maxScore = getGradeElementTypeMaxScore(selectedFinalType)
    const tone =
      status === 'absent'
        ? 'absent'
        : getGradeTone(
            score,
            minScore,
            maxScore,
            getGradeElementTypePassingScore(selectedFinalType)
          )

    return (
      <ScoreInput
        value={score === null ? '' : formatScoreValue(score)}
        disabled={isGradeInputDisabled || status === 'absent'}
        toneClassName={getGradeToneClassName(tone)}
        onCommit={(value) => handleScoreGradeBlur(student, value)}
      />
    )
  }

  function renderResultCell(student: AdminCrudRecord): ReactElement {
    const grade = getStudentGradeRecord(student, selectedFinalGradeItem)
    const result = getFinalResultLabel(grade, selectedFinalType)

    return <Badge variant={result.variant}>{result.label}</Badge>
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Итоговая ведомость</CardTitle>
              <CardDescription>
                Выбери группу, дисциплину и итоговый оценочный элемент, чтобы заполнить результаты
                итоговой аттестации.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void loadData()} disabled={isLoading}>
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
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <FilterSelect
              label="Факультет"
              value={selectedFacultyId}
              placeholder="Выбери факультет"
              options={faculties.map(toFilterOption)}
              onChange={handleFacultyChange}
            />

            <FilterSelect
              label="Специальность"
              value={selectedSpecialtyId}
              placeholder={selectedFacultyId ? 'Выбери специальность' : 'Сначала факультет'}
              disabled={!selectedFacultyId}
              options={filteredSpecialties.map(toFilterOption)}
              onChange={handleSpecialtyChange}
            />

            <FilterSelect
              label="Группа"
              value={selectedGroupId}
              placeholder={selectedSpecialtyId ? 'Выбери группу' : 'Сначала специальность'}
              disabled={!selectedSpecialtyId}
              options={filteredGroups.map(toFilterOption)}
              onChange={handleGroupChange}
            />

            <FilterSelect
              label="Семестр"
              value={selectedSemesterId}
              placeholder={selectedGroupId ? 'Выбери семестр' : 'Сначала группу'}
              disabled={!selectedGroupId || filteredSemesters.length === 0}
              options={filteredSemesters.map((semester) => ({
                value: String(semester.id),
                label: getSemesterLabel(semester, academicYears)
              }))}
              onChange={handleSemesterChange}
            />

            <FilterSelect
              label="Дисциплина"
              value={selectedDisciplineId}
              placeholder={selectedSemesterId ? 'Выбери дисциплину' : 'Сначала семестр'}
              disabled={!selectedSemesterId || semesterDisciplines.length === 0}
              options={semesterDisciplines.map((discipline) => ({
                value: String(discipline.id),
                label: getDisciplineName(discipline, subjects)
              }))}
              onChange={handleDisciplineChange}
            />

            <FilterSelect
              label="Итоговый элемент из расписания"
              value={selectedFinalGradeItemId}
              placeholder={
                scheduledFinalGradeItems.length > 0
                  ? 'Выбери элемент из расписания'
                  : 'Сначала добавь элемент в расписании'
              }
              disabled={!selectedDisciplineId || scheduledFinalGradeItems.length === 0}
              options={scheduledFinalGradeItems.map((gradeItem) =>
                toScheduledFinalGradeItemOption(gradeItem, gradeElementTypeById, weekById)
              )}
              onChange={handleFinalGradeItemChange}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedFaculty ? <Badge>{getRecordName(selectedFaculty)}</Badge> : null}
            {selectedSpecialty ? <Badge>{getRecordName(selectedSpecialty)}</Badge> : null}
            {selectedGroup ? <Badge>{getRecordName(selectedGroup)}</Badge> : null}
            {selectedSemester ? (
              <Badge>{getSemesterLabel(selectedSemester, academicYears)}</Badge>
            ) : null}
            {selectedDiscipline ? (
              <Badge>{getDisciplineName(selectedDiscipline, subjects)}</Badge>
            ) : null}
            {selectedFinalGradeItem ? <Badge>{getRecordName(selectedFinalGradeItem)}</Badge> : null}
            {selectedFinalType ? (
              <Badge>{getGradeElementTypeDescription(selectedFinalType)}</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {loadError}
        </div>
      ) : null}

      {gradeError ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {gradeError}
        </div>
      ) : null}

      {!hasCompleteSelection && !(selectedDisciplineId && scheduledFinalGradeItems.length === 0) ? (
        <EmptyState text="Выбери факультет, специальность, группу, семестр, дисциплину и итоговый элемент из расписания." />
      ) : null}

      {selectedDisciplineId && scheduledFinalGradeItems.length === 0 ? (
        <EmptyState text="Для выбранной дисциплины нет итогового оценочного элемента в расписании. Сначала добавь экзамен, зачёт или другой итоговый элемент в разделе «Расписание»." />
      ) : null}

      {hasCompleteSelection && !isDisciplineCompleted ? (
        <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-4 text-sm text-[var(--color-text)]">
          <p className="font-semibold">
            Итоговая ведомость доступна после завершения всех занятий по дисциплине.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="muted">Всего занятий: {disciplineCompletionSummary.total}</Badge>
            <Badge variant="muted">Проведено: {disciplineCompletionSummary.conducted}</Badge>
            <Badge variant="muted">Выполнено: {disciplineCompletionSummary.completed}</Badge>
            <Badge variant="warning">Осталось: {disciplineCompletionSummary.remaining}</Badge>
          </div>
        </div>
      ) : null}

      {hasCompleteSelection ? (
        <Card>
          <CardHeader>
            <CardTitle>Ведомость итоговой аттестации</CardTitle>
            <CardDescription>
              {selectedGroup ? getRecordName(selectedGroup) : 'Группа'} ·{' '}
              {selectedDiscipline ? getDisciplineName(selectedDiscipline, subjects) : 'Дисциплина'}{' '}
              · {selectedFinalType ? getRecordName(selectedFinalType) : 'Итоговый элемент'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {groupStudents.length === 0 ? (
              <EmptyState text="В выбранной группе пока нет студентов." />
            ) : null}

            {groupStudents.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full min-w-[56rem] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-muted)]">
                      <th className="w-12 border-b border-r border-[var(--color-border)] px-3 py-3 text-center font-semibold text-[var(--color-text-muted)]">
                        №
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                        Студент
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-4 py-3 text-center font-semibold text-[var(--color-text-muted)]">
                        Статус / результат
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-4 py-3 text-center font-semibold text-[var(--color-text-muted)]">
                        Балл
                      </th>
                      <th className="border-b border-r border-[var(--color-border)] px-4 py-3 text-center font-semibold text-[var(--color-text-muted)]">
                        Итог
                      </th>
                      <th className="border-b border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                        Комментарий
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {groupStudents.map((student, index) => {
                      const grade = getStudentGradeRecord(student, selectedFinalGradeItem)

                      return (
                        <tr
                          key={String(student.id)}
                          className="border-b border-[var(--color-border)] last:border-b-0"
                        >
                          <td className="border-r border-[var(--color-border)] px-3 py-3 text-center text-[var(--color-text-muted)]">
                            {index + 1}
                          </td>
                          <td className="border-r border-[var(--color-border)] px-4 py-3 font-medium text-[var(--color-text)]">
                            {getPersonFullName(student)}
                          </td>
                          <td className="border-r border-[var(--color-border)] px-4 py-3 text-center">
                            {renderStatusCell(student)}
                          </td>
                          <td className="border-r border-[var(--color-border)] px-4 py-3 text-center">
                            {renderScoreCell(student)}
                          </td>
                          <td className="border-r border-[var(--color-border)] px-4 py-3 text-center">
                            {renderResultCell(student)}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                            {formatValue(grade?.comment)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function FilterSelect({
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
      className={`mx-auto h-8 w-24 text-center text-xs ${toneClassName ?? ''}`}
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

function getDisciplineCompletionSummary({
  scheduleItems,
  lessonSessions,
  lessonCompletionRecords
}: {
  scheduleItems: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
  lessonCompletionRecords: AdminCrudRecord[]
}): DisciplineCompletionSummary {
  const total = scheduleItems.length
  let conducted = 0
  let completed = 0

  scheduleItems.forEach((scheduleItem) => {
    const session = getLessonSessionForScheduleItem(scheduleItem, lessonSessions)

    if (session && String(session.status ?? '') === 'conducted') {
      conducted += 1
    }

    if (!session?.id) {
      return
    }

    const completionRecord = lessonCompletionRecords.find(
      (record) => Number(record.lesson_session_id) === Number(session.id)
    )

    if (String(completionRecord?.status ?? '') === 'completed') {
      completed += 1
    }
  })

  return {
    total,
    conducted,
    completed,
    remaining: Math.max(0, total - completed),
    isCompleted: total > 0 && conducted === total && completed === total
  }
}

function getLessonSessionForScheduleItem(
  scheduleItem: AdminCrudRecord,
  lessonSessions: AdminCrudRecord[]
): AdminCrudRecord | null {
  return (
    lessonSessions.find((session) => {
      if (Number(session.schedule_item_id) !== Number(scheduleItem.id)) {
        return false
      }

      const scheduleWeekId = toNumberOrNull(scheduleItem.week_id)

      return scheduleWeekId === null || Number(session.week_id) === scheduleWeekId
    }) ?? null
  )
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

function getGradeElementTypeMinScore(gradeElementType: AdminCrudRecord | null): number {
  return toNumberOrNull(gradeElementType?.min_score) ?? 0
}

function getGradeElementTypePassingScore(gradeElementType: AdminCrudRecord | null): number | null {
  return toNumberOrNull(gradeElementType?.passing_score)
}

function getGradeElementTypeDescription(gradeElementType: AdminCrudRecord): string {
  if (gradeElementType.grading_mode === 'pass_fail') {
    return 'Сдал / не сдал'
  }

  const details = [
    `мин. ${getGradeElementTypeMinScore(gradeElementType)}`,
    `макс. ${getGradeElementTypeMaxScore(gradeElementType)}`
  ]
  const passingScore = getGradeElementTypePassingScore(gradeElementType)

  if (passingScore !== null) {
    details.push(`проходной ${passingScore}`)
  }

  return `Баллы · ${details.join(' · ')}`
}

function getGradeResultStatus(
  grade: AdminCrudRecord | null,
  gradeElementType: AdminCrudRecord | null
): GradeResultStatus {
  const rawStatus = String(grade?.result_status ?? '')

  if (rawStatus === 'absent' || rawStatus === 'passed' || rawStatus === 'failed') {
    return rawStatus
  }

  if (gradeElementType?.grading_mode === 'pass_fail' && grade) {
    return Number(grade.score) >= 1 ? 'passed' : 'failed'
  }

  return 'graded'
}

function getFinalResultLabel(
  grade: AdminCrudRecord | null,
  gradeElementType: AdminCrudRecord | null
): {
  label: string
  variant: 'default' | 'success' | 'warning' | 'danger' | 'muted'
} {
  if (!grade) {
    return { label: '—', variant: 'muted' }
  }

  const status = getGradeResultStatus(grade, gradeElementType)

  if (status === 'absent') {
    return { label: 'Неявка', variant: 'warning' }
  }

  if (status === 'passed') {
    return { label: 'Сдал', variant: 'success' }
  }

  if (status === 'failed') {
    return { label: 'Не сдал', variant: 'danger' }
  }

  const score = toNumberOrNull(grade.score)

  if (score === null) {
    return { label: '—', variant: 'muted' }
  }

  const minScore = getGradeElementTypeMinScore(gradeElementType)
  const maxScore = getGradeElementTypeMaxScore(gradeElementType)
  const passingScore = getGradeElementTypePassingScore(gradeElementType)

  if (areNumbersClose(score, maxScore)) {
    return { label: 'Максимум', variant: 'success' }
  }

  if (areNumbersClose(score, minScore)) {
    return { label: 'Минимум', variant: 'danger' }
  }

  if (passingScore !== null && score < passingScore) {
    return { label: 'Непроходной', variant: 'danger' }
  }

  return { label: 'Проходной', variant: 'success' }
}

function getGradeTone(
  score: number | null,
  minScore: number,
  maxScore: number,
  passingScore: number | null
): GradeTone {
  if (score === null) {
    return 'empty'
  }

  if (areNumbersClose(score, maxScore)) {
    return 'maximum'
  }

  if (areNumbersClose(score, minScore)) {
    return 'minimum'
  }

  if (passingScore !== null && score < passingScore) {
    return 'belowPassing'
  }

  return 'passing'
}

function getGradeToneClassName(tone: GradeTone): string {
  switch (tone) {
    case 'absent':
      return 'border-amber-200 bg-amber-50 text-amber-800'
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

function toFilterOption(record: AdminCrudRecord): FilterOption {
  return {
    value: String(record.id),
    label: getRecordName(record)
  }
}

function toScheduledFinalGradeItemOption(
  gradeItem: AdminCrudRecord,
  gradeElementTypeById: Map<number, AdminCrudRecord>,
  weekById: Map<number, AdminCrudRecord>
): FilterOption {
  const gradeElementTypeId = toNumberOrNull(gradeItem.grade_element_type_id)
  const gradeElementType =
    gradeElementTypeId === null ? null : gradeElementTypeById.get(gradeElementTypeId)
  const weekId = toNumberOrNull(gradeItem.week_id)
  const week = weekId === null ? null : weekById.get(weekId)
  const details = [
    gradeElementType ? getRecordName(gradeElementType) : getRecordName(gradeItem),
    getWeekShortLabel(week),
    getDayOfWeekLabel(gradeItem.day_of_week),
    gradeItem.grade_date ? String(gradeItem.grade_date) : null,
    gradeItem.max_score ? `максимум ${String(gradeItem.max_score)}` : null
  ].filter(Boolean)

  return {
    value: String(gradeItem.id),
    label: `${getRecordName(gradeItem)} · ${details.join(' · ')}`
  }
}

function compareScheduledFinalGradeItems(
  firstItem: AdminCrudRecord,
  secondItem: AdminCrudRecord
): number {
  const firstWeekId = toNumberOrNull(firstItem.week_id) ?? 0
  const secondWeekId = toNumberOrNull(secondItem.week_id) ?? 0

  if (firstWeekId !== secondWeekId) {
    return firstWeekId - secondWeekId
  }

  const firstDay = toNumberOrNull(firstItem.day_of_week) ?? 0
  const secondDay = toNumberOrNull(secondItem.day_of_week) ?? 0

  if (firstDay !== secondDay) {
    return firstDay - secondDay
  }

  return Number(firstItem.id ?? 0) - Number(secondItem.id ?? 0)
}

function createRecordMap(records: AdminCrudRecord[]): Map<number, AdminCrudRecord> {
  const map = new Map<number, AdminCrudRecord>()

  records.forEach((record) => {
    const id = toNumberOrNull(record.id)

    if (id !== null) {
      map.set(id, record)
    }
  })

  return map
}

function getDisciplineName(discipline: AdminCrudRecord, subjects: AdminCrudRecord[]): string {
  if (discipline.name) {
    return String(discipline.name)
  }

  const subjectId = toNumberOrNull(discipline.subject_id)
  const subject = subjectId === null ? null : subjects.find((item) => Number(item.id) === subjectId)

  return subject ? getRecordName(subject) : getRecordName(discipline)
}

function getSemesterLabel(semester: AdminCrudRecord, academicYears: AdminCrudRecord[]): string {
  const number = toNumberOrNull(semester.number)
  const academicYearId = toNumberOrNull(semester.academic_year_id)
  const academicYear =
    academicYearId === null
      ? null
      : academicYears.find((item) => Number(item.id) === academicYearId)
  const semesterName = semester.name
    ? String(semester.name)
    : number
      ? `${number} семестр`
      : getRecordName(semester)

  return academicYear ? `${semesterName} · ${getRecordName(academicYear)}` : semesterName
}

function getWeekShortLabel(week: AdminCrudRecord | null | undefined): string {
  const number = toNumberOrNull(week?.number)

  return number === null ? 'неделя не указана' : `${number} неделя`
}

function getDayOfWeekLabel(value: unknown): string {
  const labels: Record<number, string> = {
    1: 'Понедельник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четверг',
    5: 'Пятница',
    6: 'Суббота',
    7: 'Воскресенье'
  }
  const dayNumber = toNumberOrNull(value)

  return dayNumber === null ? 'день не указан' : (labels[dayNumber] ?? `день ${dayNumber}`)
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

function formatValue(value: unknown): string {
  const text = String(value ?? '').trim()

  return text || '—'
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

function getUserFacingError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback
  }

  const message = error.message
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^SqliteError:\s*/i, '')
    .trim()

  if (!message || /constraint failed|SQLITE_CONSTRAINT/i.test(message)) {
    return `${fallback}. Обнови данные и повтори попытку`
  }

  return message
}
