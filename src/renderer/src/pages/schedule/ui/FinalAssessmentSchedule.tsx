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
  SelectValue,
  Textarea
} from '../../../shared/ui'

const emptySelectValue = '__empty__'

type FilterOption = {
  value: string
  label: string
}

type RoundDraft = {
  assessment_date: string
  starts_at: string
  ends_at: string
  teacher_id: string
  audience_id: string
  description: string
}

const roundTypes = [
  { type: 'main', number: 1, label: 'Основной тур' },
  { type: 'retake', number: 2, label: 'Пересдача' },
  { type: 'commission', number: 3, label: 'Комиссия' }
]

export function FinalAssessmentSchedule(): ReactElement {
  const [faculties, setFaculties] = useState<AdminCrudRecord[]>([])
  const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
  const [groups, setGroups] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [academicYears, setAcademicYears] = useState<AdminCrudRecord[]>([])
  const [semesters, setSemesters] = useState<AdminCrudRecord[]>([])
  const [weeks, setWeeks] = useState<AdminCrudRecord[]>([])
  const [scheduleItems, setScheduleItems] = useState<AdminCrudRecord[]>([])
  const [lessonSessions, setLessonSessions] = useState<AdminCrudRecord[]>([])
  const [lessonCompletionRecords, setLessonCompletionRecords] = useState<AdminCrudRecord[]>([])
  const [gradeElementTypes, setGradeElementTypes] = useState<AdminCrudRecord[]>([])
  const [assessments, setAssessments] = useState<AdminCrudRecord[]>([])
  const [rounds, setRounds] = useState<AdminCrudRecord[]>([])
  const [teachers, setTeachers] = useState<AdminCrudRecord[]>([])
  const [audiences, setAudiences] = useState<AdminCrudRecord[]>([])

  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [selectedFinalTypeId, setSelectedFinalTypeId] = useState('')
  const [roundDrafts, setRoundDrafts] = useState<Record<string, RoundDraft>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [
        facultiesResult,
        specialtiesResult,
        groupsResult,
        subjectsResult,
        disciplinesResult,
        academicYearsResult,
        semestersResult,
        weeksResult,
        scheduleItemsResult,
        lessonSessionsResult,
        lessonCompletionRecordsResult,
        gradeElementTypesResult,
        assessmentsResult,
        roundsResult,
        teachersResult,
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
          orderBy: 'round_number',
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
      setSubjects(subjectsResult.items)
      setDisciplines(disciplinesResult.items)
      setAcademicYears(academicYearsResult.items)
      setSemesters(semestersResult.items)
      setWeeks(weeksResult.items)
      setScheduleItems(scheduleItemsResult.items)
      setLessonSessions(lessonSessionsResult.items)
      setLessonCompletionRecords(lessonCompletionRecordsResult.items)
      setGradeElementTypes(gradeElementTypesResult.items)
      setAssessments(assessmentsResult.items)
      setRounds(roundsResult.items)
      setTeachers(teachersResult.items)
      setAudiences(audiencesResult.items)
      setRoundDrafts(createRoundDrafts(roundsResult.items))
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Не удалось загрузить расписание итоговой аттестации'))
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
  const selectedFinalType = useMemo(
    () => gradeElementTypes.find((type) => String(type.id) === selectedFinalTypeId) ?? null,
    [gradeElementTypes, selectedFinalTypeId]
  )

  const filteredSpecialties = useMemo(
    () =>
      selectedFacultyId
        ? specialties.filter(
            (specialty) => Number(specialty.faculty_id) === Number(selectedFacultyId)
          )
        : [],
    [selectedFacultyId, specialties]
  )
  const filteredGroups = useMemo(
    () =>
      selectedSpecialtyId
        ? groups.filter((group) => Number(group.specialty_id) === Number(selectedSpecialtyId))
        : [],
    [groups, selectedSpecialtyId]
  )
  const groupDisciplines = useMemo(
    () =>
      selectedGroupId
        ? disciplines.filter(
            (discipline) => Number(discipline.group_id) === Number(selectedGroupId)
          )
        : [],
    [disciplines, selectedGroupId]
  )
  const filteredSemesters = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    const semesterIds = new Set(
      groupDisciplines
        .map((discipline) => toNumberOrNull(discipline.semester_id))
        .filter((id): id is number => id !== null)
    )
    const source =
      semesterIds.size > 0
        ? semesters.filter((semester) => semesterIds.has(Number(semester.id)))
        : semesters

    return [...source].sort(compareSemesters)
  }, [groupDisciplines, selectedGroupId, semesters])
  const semesterDisciplines = useMemo(
    () =>
      selectedSemesterId
        ? groupDisciplines.filter(
            (discipline) => Number(discipline.semester_id) === Number(selectedSemesterId)
          )
        : [],
    [groupDisciplines, selectedSemesterId]
  )
  const finalGradeElementTypes = useMemo(
    () => gradeElementTypes.filter((type) => Number(type.is_final) === 1),
    [gradeElementTypes]
  )
  const selectedAssessments = useMemo(
    () =>
      assessments.filter(
        (assessment) =>
          Number(assessment.group_id) === Number(selectedGroupId) &&
          Number(assessment.semester_id) === Number(selectedSemesterId) &&
          (!selectedDisciplineId ||
            Number(assessment.discipline_id) === Number(selectedDisciplineId))
      ),
    [assessments, selectedDisciplineId, selectedGroupId, selectedSemesterId]
  )
  const selectedDisciplineScheduleItems = useMemo(
    () =>
      scheduleItems.filter(
        (item) =>
          Number(item.group_id) === Number(selectedGroupId) &&
          Number(item.discipline_id) === Number(selectedDisciplineId) &&
          Number(item.semester_id) === Number(selectedSemesterId)
      ),
    [scheduleItems, selectedDisciplineId, selectedGroupId, selectedSemesterId]
  )
  const disciplineCompleted = useMemo(
    () =>
      isDisciplineCompleted({
        scheduleItems: selectedDisciplineScheduleItems,
        lessonSessions,
        lessonCompletionRecords
      }),
    [lessonCompletionRecords, lessonSessions, selectedDisciplineScheduleItems]
  )
  const teacherOptions = useMemo(() => teachers.map(toPersonOption), [teachers])
  const audienceOptions = useMemo(() => audiences.map(toFilterOption), [audiences])
  const gradeElementTypeById = useMemo(
    () => createRecordMap(gradeElementTypes),
    [gradeElementTypes]
  )

  function handleFacultyChange(value: string): void {
    setSelectedFacultyId(value)
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
  }

  function handleSpecialtyChange(value: string): void {
    setSelectedSpecialtyId(value)
    setSelectedGroupId('')
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
  }

  function handleGroupChange(value: string): void {
    setSelectedGroupId(value)
    setSelectedSemesterId('')
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
  }

  function handleSemesterChange(value: string): void {
    setSelectedSemesterId(value)
    setSelectedDisciplineId('')
    setSelectedFinalTypeId('')
  }

  function updateRoundDraft(roundId: unknown, patch: Partial<RoundDraft>): void {
    const key = String(roundId)
    setRoundDrafts((current) => ({
      ...current,
      [key]: {
        ...createRoundDraft(null),
        ...current[key],
        ...patch
      }
    }))
  }

  async function createFinalAssessment(): Promise<void> {
    setErrorMessage(null)
    setStatusMessage(null)

    if (
      !selectedGroup?.id ||
      !selectedSemester?.id ||
      !selectedDiscipline?.id ||
      !selectedFinalType?.id
    ) {
      setErrorMessage('Выбери группу, семестр, дисциплину и итоговый тип')
      return
    }

    if (Number(selectedDiscipline.group_id) !== Number(selectedGroup.id)) {
      setErrorMessage('Дисциплина не относится к выбранной группе')
      return
    }

    if (Number(selectedDiscipline.semester_id) !== Number(selectedSemester.id)) {
      setErrorMessage('Дисциплина не относится к выбранному семестру')
      return
    }

    if (Number(selectedFinalType.is_final) !== 1) {
      setErrorMessage('Выбранный оценочный элемент не является итоговым')
      return
    }

    const alreadyExists = assessments.some(
      (assessment) =>
        Number(assessment.group_id) === Number(selectedGroup.id) &&
        Number(assessment.semester_id) === Number(selectedSemester.id) &&
        Number(assessment.discipline_id) === Number(selectedDiscipline.id) &&
        Number(assessment.grade_element_type_id) === Number(selectedFinalType.id)
    )

    if (alreadyExists) {
      setErrorMessage('Такая итоговая аттестация уже создана')
      return
    }

    setIsSaving(true)

    try {
      const name = `${getRecordName(selectedFinalType)} · ${getDisciplineName(
        selectedDiscipline,
        subjects
      )} · ${getRecordName(selectedGroup)}`
      const result = await window.api.adminCrud.create({
        entity: 'final_assessments',
        data: {
          semester_id: Number(selectedSemester.id),
          group_id: Number(selectedGroup.id),
          discipline_id: Number(selectedDiscipline.id),
          grade_element_type_id: Number(selectedFinalType.id),
          name,
          status: 'planned',
          description: null
        }
      })

      if (!result.item?.id) {
        throw new Error('Не удалось создать итоговую аттестацию')
      }

      await Promise.all(
        roundTypes.map((round) =>
          window.api.adminCrud.create({
            entity: 'final_assessment_rounds',
            data: {
              final_assessment_id: Number(result.item?.id),
              round_type: round.type,
              round_number: round.number,
              grade_item_id: null,
              week_id: null,
              day_of_week: null,
              assessment_date: null,
              starts_at: null,
              ends_at: null,
              lesson_period_id: null,
              teacher_id: null,
              audience_id: null,
              status: 'not_scheduled',
              description: null
            }
          })
        )
      )

      setStatusMessage('Итоговая аттестация создана')
      await loadData()
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Не удалось создать итоговую аттестацию'))
    } finally {
      setIsSaving(false)
    }
  }

  async function scheduleRound(assessment: AdminCrudRecord, round: AdminCrudRecord): Promise<void> {
    setErrorMessage(null)
    setStatusMessage(null)

    if (!disciplineCompleted) {
      setErrorMessage('Тур можно назначить только после завершения всех занятий дисциплины')
      return
    }

    const draft = roundDrafts[String(round.id)] ?? createRoundDraft(round)

    if (!draft.assessment_date || !draft.starts_at || !draft.ends_at) {
      setErrorMessage('Укажи дату, время начала и время окончания тура')
      return
    }

    setIsSaving(true)

    try {
      const dayOfWeek = getDateDayOfWeek(draft.assessment_date)
      const week = findWeekByDate(weeks, draft.assessment_date)
      const gradeElementType = gradeElementTypeById.get(Number(assessment.grade_element_type_id))
      const roundLabel = getRoundLabel(round.round_type)
      const gradeItemData = {
        discipline_id: Number(assessment.discipline_id),
        lesson_session_id: null,
        grade_element_type_id: Number(assessment.grade_element_type_id),
        grade_category_id: null,
        week_id: week?.id ? Number(week.id) : null,
        day_of_week: dayOfWeek,
        name: `${getRecordName(assessment)} · ${roundLabel}`,
        max_score: getGradeElementTypeMaxScore(gradeElementType),
        grade_date: draft.assessment_date,
        description: `Итоговая аттестация: ${roundLabel}`
      }
      let gradeItemId = toNumberOrNull(round.grade_item_id)

      if (gradeItemId === null) {
        const gradeItemResult = await window.api.adminCrud.create({
          entity: 'grade_items',
          data: gradeItemData
        })

        if (!gradeItemResult.item?.id) {
          throw new Error('Не удалось создать ведомость тура')
        }

        gradeItemId = Number(gradeItemResult.item.id)
      } else {
        await window.api.adminCrud.update({
          entity: 'grade_items',
          id: gradeItemId,
          data: gradeItemData
        })
      }

      await window.api.adminCrud.update({
        entity: 'final_assessment_rounds',
        id: Number(round.id),
        data: {
          grade_item_id: gradeItemId,
          week_id: week?.id ? Number(week.id) : null,
          day_of_week: dayOfWeek,
          assessment_date: draft.assessment_date,
          starts_at: draft.starts_at,
          ends_at: draft.ends_at,
          lesson_period_id: null,
          teacher_id: toNumberOrNull(draft.teacher_id),
          audience_id: toNumberOrNull(draft.audience_id),
          status: 'scheduled',
          description: draft.description.trim() || null
        }
      })

      setStatusMessage('Тур итоговой аттестации назначен')
      await loadData()
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Не удалось назначить тур'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Расписание итоговой аттестации</CardTitle>
              <CardDescription>
                Создай итоговую аттестацию по дисциплине и назначь основной тур, пересдачу и
                комиссию.
              </CardDescription>
            </div>

            <Button variant="secondary" onClick={() => void loadData()} disabled={isLoading}>
              <FiRefreshCcw />
              Обновить
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
              options={filteredSpecialties.map(toFilterOption)}
              disabled={!selectedFacultyId}
              onChange={handleSpecialtyChange}
            />
            <FilterSelect
              label="Группа"
              value={selectedGroupId}
              placeholder={selectedSpecialtyId ? 'Выбери группу' : 'Сначала специальность'}
              options={filteredGroups.map(toFilterOption)}
              disabled={!selectedSpecialtyId}
              onChange={handleGroupChange}
            />
            <FilterSelect
              label="Семестр"
              value={selectedSemesterId}
              placeholder={selectedGroupId ? 'Выбери семестр' : 'Сначала группу'}
              options={filteredSemesters.map((semester) => ({
                value: String(semester.id),
                label: getSemesterLabel(semester, academicYears)
              }))}
              disabled={!selectedGroupId}
              onChange={handleSemesterChange}
            />
            <FilterSelect
              label="Дисциплина"
              value={selectedDisciplineId}
              placeholder={selectedSemesterId ? 'Выбери дисциплину' : 'Сначала семестр'}
              options={semesterDisciplines.map((discipline) => ({
                value: String(discipline.id),
                label: getDisciplineName(discipline, subjects)
              }))}
              disabled={!selectedSemesterId}
              onChange={setSelectedDisciplineId}
            />
            <FilterSelect
              label="Итоговый тип"
              value={selectedFinalTypeId}
              placeholder="Выбери итоговый тип"
              options={finalGradeElementTypes.map(toFilterOption)}
              disabled={!selectedDisciplineId}
              onChange={setSelectedFinalTypeId}
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
            <Badge variant={disciplineCompleted ? 'success' : 'warning'}>
              {disciplineCompleted ? 'Занятия завершены' : 'Занятия не завершены'}
            </Badge>
          </div>

          <div className="mt-4">
            <Button
              disabled={
                isSaving ||
                !selectedGroupId ||
                !selectedSemesterId ||
                !selectedDisciplineId ||
                !selectedFinalTypeId
              }
              onClick={() => void createFinalAssessment()}
            >
              Создать итоговую аттестацию
            </Button>
          </div>
        </CardContent>
      </Card>

      {statusMessage ? (
        <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]">
          {statusMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </div>
      ) : null}

      {selectedAssessments.length === 0 ? (
        <EmptyState text="Для выбранных параметров итоговая аттестация пока не создана." />
      ) : null}

      {selectedAssessments.map((assessment) => {
        const assessmentRounds = getAssessmentRounds(assessment, rounds)
        const gradeElementType = gradeElementTypeById.get(Number(assessment.grade_element_type_id))

        return (
          <Card key={String(assessment.id)}>
            <CardHeader>
              <CardTitle>{getRecordName(assessment)}</CardTitle>
              <CardDescription>
                {gradeElementType ? getRecordName(gradeElementType) : 'Итоговый тип не найден'} ·{' '}
                {getStatusLabel(assessment.status)}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3">
              {assessmentRounds.map((round) => {
                const draft = roundDrafts[String(round.id)] ?? createRoundDraft(round)
                const gradeItemId = toNumberOrNull(round.grade_item_id)

                return (
                  <div
                    key={String(round.id)}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {String(round.round_number)} тур — {getRoundLabel(round.round_type)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {formatValue(round.assessment_date)} · {formatValue(round.starts_at)}–
                          {formatValue(round.ends_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={round.status === 'scheduled' ? 'success' : 'muted'}>
                          {getRoundStatusLabel(round.status)}
                        </Badge>
                        {gradeItemId !== null ? (
                          <Badge variant="default">Ведомость есть</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--color-text)]">Дата</span>
                        <Input
                          type="date"
                          value={draft.assessment_date}
                          onChange={(event) =>
                            updateRoundDraft(round.id, { assessment_date: event.target.value })
                          }
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--color-text)]">Начало</span>
                        <Input
                          type="time"
                          value={draft.starts_at}
                          onChange={(event) =>
                            updateRoundDraft(round.id, { starts_at: event.target.value })
                          }
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          Окончание
                        </span>
                        <Input
                          type="time"
                          value={draft.ends_at}
                          onChange={(event) =>
                            updateRoundDraft(round.id, { ends_at: event.target.value })
                          }
                        />
                      </label>
                      <FilterSelect
                        label="Преподаватель"
                        value={draft.teacher_id}
                        placeholder="Выбери преподавателя"
                        options={teacherOptions}
                        onChange={(value) => updateRoundDraft(round.id, { teacher_id: value })}
                      />
                      <FilterSelect
                        label="Аудитория"
                        value={draft.audience_id}
                        placeholder="Выбери аудиторию"
                        options={audienceOptions}
                        onChange={(value) => updateRoundDraft(round.id, { audience_id: value })}
                      />
                      <label className="grid gap-2 md:col-span-2 xl:col-span-3">
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          Комментарий
                        </span>
                        <Textarea
                          value={draft.description}
                          onChange={(event) =>
                            updateRoundDraft(round.id, { description: event.target.value })
                          }
                        />
                      </label>
                    </div>

                    <div className="mt-4">
                      <Button
                        disabled={isSaving || !disciplineCompleted}
                        onClick={() => void scheduleRound(assessment, round)}
                      >
                        {gradeItemId === null ? 'Назначить тур' : 'Обновить тур'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
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
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <Select
        value={value || emptySelectValue}
        disabled={disabled}
        onValueChange={(nextValue) => onChange(nextValue === emptySelectValue ? '' : nextValue)}
      >
        <SelectTrigger>
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

function createRoundDrafts(rounds: AdminCrudRecord[]): Record<string, RoundDraft> {
  return Object.fromEntries(rounds.map((round) => [String(round.id), createRoundDraft(round)]))
}

function createRoundDraft(round: AdminCrudRecord | null): RoundDraft {
  return {
    assessment_date: String(round?.assessment_date ?? ''),
    starts_at: String(round?.starts_at ?? ''),
    ends_at: String(round?.ends_at ?? ''),
    teacher_id: round?.teacher_id ? String(round.teacher_id) : '',
    audience_id: round?.audience_id ? String(round.audience_id) : '',
    description: String(round?.description ?? '')
  }
}

function getAssessmentRounds(
  assessment: AdminCrudRecord,
  rounds: AdminCrudRecord[]
): AdminCrudRecord[] {
  return rounds
    .filter((round) => Number(round.final_assessment_id) === Number(assessment.id))
    .sort((first, second) => Number(first.round_number ?? 0) - Number(second.round_number ?? 0))
}

function isDisciplineCompleted({
  scheduleItems,
  lessonSessions,
  lessonCompletionRecords
}: {
  scheduleItems: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
  lessonCompletionRecords: AdminCrudRecord[]
}): boolean {
  return (
    scheduleItems.length > 0 &&
    scheduleItems.every((scheduleItem) => {
      const session = lessonSessions.find(
        (item) =>
          Number(item.schedule_item_id) === Number(scheduleItem.id) &&
          Number(item.week_id) === Number(scheduleItem.week_id)
      )

      if (!session?.id || String(session.status ?? '') !== 'conducted') {
        return false
      }

      return lessonCompletionRecords.some(
        (record) =>
          Number(record.lesson_session_id) === Number(session.id) &&
          String(record.status ?? '') === 'completed'
      )
    })
  )
}

function findWeekByDate(weeks: AdminCrudRecord[], dateValue: string): AdminCrudRecord | null {
  const time = parseDate(dateValue).getTime()

  return (
    weeks.find((week) => {
      const startsAt = String(week.starts_at ?? '')
      const endsAt = String(week.ends_at ?? '')

      if (!startsAt || !endsAt) {
        return false
      }

      return time >= parseDate(startsAt).getTime() && time <= parseDate(endsAt).getTime()
    }) ?? null
  )
}

function getDateDayOfWeek(value: string): number {
  const day = parseDate(value).getUTCDay()

  return day === 0 ? 7 : day
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, day))
}

function getGradeElementTypeMaxScore(gradeElementType: AdminCrudRecord | null | undefined): number {
  if (gradeElementType?.grading_mode === 'pass_fail') {
    return 1
  }

  const maxScore = toNumberOrNull(gradeElementType?.max_score)

  return maxScore && maxScore > 0 ? maxScore : 100
}

function getRoundLabel(value: unknown): string {
  const type = String(value ?? '')

  return roundTypes.find((round) => round.type === type)?.label ?? type
}

function getStatusLabel(value: unknown): string {
  const labels: Record<string, string> = {
    planned: 'Запланирована',
    in_progress: 'В процессе',
    completed: 'Завершена',
    cancelled: 'Отменена'
  }

  return labels[String(value ?? '')] ?? String(value ?? '—')
}

function getRoundStatusLabel(value: unknown): string {
  const labels: Record<string, string> = {
    not_scheduled: 'Не запланирован',
    scheduled: 'Запланирован',
    conducted: 'Проведён',
    completed: 'Завершён',
    cancelled: 'Отменён'
  }

  return labels[String(value ?? '')] ?? String(value ?? '—')
}

function toFilterOption(record: AdminCrudRecord): FilterOption {
  return {
    value: String(record.id),
    label: getRecordName(record)
  }
}

function toPersonOption(record: AdminCrudRecord): FilterOption {
  return {
    value: String(record.id),
    label: getPersonFullName(record)
  }
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback
  }

  return error.message
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^SqliteError:\s*/i, '')
    .trim()
}
