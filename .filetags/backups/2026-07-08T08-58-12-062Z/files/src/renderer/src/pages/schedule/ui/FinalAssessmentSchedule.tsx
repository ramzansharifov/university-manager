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
import {
  type AudienceAvailability,
  buildAudienceAvailability,
  combineDateAndTime,
  formatBusyReasonTime,
  getAudienceConflict
} from '../lib/audienceAvailability'

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

type DisciplineCompletionInfo = {
  total: number
  conducted: number
  completed: number
  remaining: number
  isCompleted: boolean
  lastLessonDateTime: Date | null
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
  const [lessonPeriods, setLessonPeriods] = useState<AdminCrudRecord[]>([])
  const [scheduleItems, setScheduleItems] = useState<AdminCrudRecord[]>([])
  const [lessonSessions, setLessonSessions] = useState<AdminCrudRecord[]>([])
  const [lessonCompletionRecords, setLessonCompletionRecords] = useState<AdminCrudRecord[]>([])
  const [curriculumItems, setCurriculumItems] = useState<AdminCrudRecord[]>([])
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
        lessonPeriodsResult,
        scheduleItemsResult,
        lessonSessionsResult,
        lessonCompletionRecordsResult,
        curriculumItemsResult,
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
          entity: 'lesson_periods',
          page: 1,
          pageSize: 200,
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
          entity: 'curriculum_items',
          page: 1,
          pageSize: 5000,
          orderBy: 'semester_id',
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
      setLessonPeriods(lessonPeriodsResult.items)
      setScheduleItems(scheduleItemsResult.items)
      setLessonSessions(lessonSessionsResult.items)
      setLessonCompletionRecords(lessonCompletionRecordsResult.items)
      setCurriculumItems(curriculumItemsResult.items)
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
  const completedSemesterDisciplines = useMemo(
    () =>
      semesterDisciplines.filter((discipline) => {
        const completionInfo = getDisciplineCompletionInfo({
          discipline,
          groupId: selectedGroupId,
          semesterId: selectedSemesterId,
          scheduleItems,
          lessonSessions,
          lessonCompletionRecords,
          lessonPeriods
        })

        return completionInfo.isCompleted
      }),
    [
      lessonCompletionRecords,
      lessonPeriods,
      lessonSessions,
      scheduleItems,
      selectedGroupId,
      selectedSemesterId,
      semesterDisciplines
    ]
  )
  const allowedFinalGradeElementTypes = useMemo(
    () =>
      resolveAllowedFinalGradeElementTypesForDiscipline({
        discipline: selectedDiscipline,
        curriculumItems,
        gradeElementTypes
      }),
    [curriculumItems, gradeElementTypes, selectedDiscipline]
  )

  useEffect(() => {
    if (!selectedDisciplineId) {
      return
    }

    if (allowedFinalGradeElementTypes.length === 1) {
      const onlyAllowedTypeId = String(allowedFinalGradeElementTypes[0].id)

      if (selectedFinalTypeId !== onlyAllowedTypeId) {
        setSelectedFinalTypeId(onlyAllowedTypeId)
      }

      return
    }

    if (
      selectedFinalTypeId &&
      !allowedFinalGradeElementTypes.some((type) => Number(type.id) === Number(selectedFinalTypeId))
    ) {
      setSelectedFinalTypeId('')
    }
  }, [allowedFinalGradeElementTypes, selectedDisciplineId, selectedFinalTypeId])

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
  const selectedDisciplineCompletionInfo = useMemo(
    () =>
      getDisciplineCompletionInfo({
        discipline: selectedDiscipline,
        groupId: selectedGroupId,
        semesterId: selectedSemesterId,
        scheduleItems,
        lessonSessions,
        lessonCompletionRecords,
        lessonPeriods
      }),
    [
      lessonCompletionRecords,
      lessonPeriods,
      lessonSessions,
      scheduleItems,
      selectedDiscipline,
      selectedGroupId,
      selectedSemesterId
    ]
  )
  const disciplineCompleted = selectedDisciplineCompletionInfo.isCompleted
  const audienceOptions = useMemo(() => audiences.map(toFilterOption), [audiences])
  const gradeElementTypeById = useMemo(
    () => createRecordMap(gradeElementTypes),
    [gradeElementTypes]
  )
  const teacherById = useMemo(() => createRecordMap(teachers), [teachers])

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

  function handleDisciplineChange(value: string): void {
    setSelectedDisciplineId(value)
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

    if (allowedFinalGradeElementTypes.length === 0) {
      setErrorMessage('В учебном плане для дисциплины не указана форма итогового контроля')
      return
    }

    if (
      !allowedFinalGradeElementTypes.some(
        (type) => Number(type.id) === Number(selectedFinalType.id)
      )
    ) {
      setErrorMessage('Выбранный итоговый тип не указан в учебном плане дисциплины')
      return
    }

    if (!disciplineCompleted) {
      setErrorMessage(
        'Итоговую аттестацию можно создать только после завершения всех занятий дисциплины'
      )
      return
    }

    const defaultTeacherId = toNumberOrNull(selectedDiscipline.teacher_id)

    if (defaultTeacherId === null) {
      setErrorMessage('У выбранной дисциплины не указан преподаватель')
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
              teacher_id: defaultTeacherId,
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

    const assessmentDiscipline =
      disciplines.find(
        (discipline) => Number(discipline.id) === Number(assessment.discipline_id)
      ) ?? null
    const defaultTeacherId = toNumberOrNull(assessmentDiscipline?.teacher_id)
    const completionInfo = getDisciplineCompletionInfo({
      discipline: assessmentDiscipline,
      groupId: assessment.group_id,
      semesterId: assessment.semester_id,
      scheduleItems,
      lessonSessions,
      lessonCompletionRecords,
      lessonPeriods
    })

    if (!completionInfo.isCompleted) {
      setErrorMessage('Тур можно назначить только после завершения всех занятий дисциплины')
      return
    }

    if (defaultTeacherId === null) {
      setErrorMessage(
        'У дисциплины не указан преподаватель. Сначала заполни преподавателя в дисциплине.'
      )
      return
    }

    const draft = roundDrafts[String(round.id)] ?? createRoundDraft(round)

    if (!draft.assessment_date || !draft.starts_at || !draft.ends_at) {
      setErrorMessage('Укажи дату, время начала и время окончания тура')
      return
    }

    const audienceId = toNumberOrNull(draft.audience_id)

    if (audienceId === null) {
      setErrorMessage('Выбери аудиторию')
      return
    }

    const lastLessonDateTime = completionInfo.lastLessonDateTime
    const roundStartDateTime = combineDateAndTime(draft.assessment_date, draft.starts_at)

    if (!lastLessonDateTime) {
      setErrorMessage('Не удалось определить окончание последней пары дисциплины')
      return
    }

    if (!roundStartDateTime) {
      setErrorMessage('Укажи корректную дату и время начала тура')
      return
    }

    if (roundStartDateTime.getTime() <= lastLessonDateTime.getTime()) {
      setErrorMessage(
        `Тур итоговой аттестации можно назначить только после последней пары дисциплины. Последняя пара заканчивается ${formatDateTime(lastLessonDateTime)}.`
      )
      return
    }

    const roundOrderError = validateRoundOrder({
      round,
      rounds: getAssessmentRounds(assessment, rounds),
      draft,
      roundStartDateTime
    })

    if (roundOrderError) {
      setErrorMessage(roundOrderError)
      return
    }

    const conflict = getAudienceConflict({
      audienceId,
      date: draft.assessment_date,
      startsAt: draft.starts_at,
      endsAt: draft.ends_at,
      scheduleItems,
      finalAssessmentRounds: rounds,
      currentFinalAssessmentRoundId: Number(round.id),
      weeks,
      lessonPeriods,
      groups,
      disciplines,
      teachers,
      finalAssessments: assessments
    })

    if (conflict) {
      setErrorMessage(`Аудитория занята: ${conflict.title} · ${formatBusyReasonTime(conflict)}`)
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
          teacher_id: defaultTeacherId,
          audience_id: audienceId,
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
              placeholder={
                selectedSemesterId
                  ? completedSemesterDisciplines.length > 0
                    ? 'Выбери дисциплину'
                    : 'Нет завершённых дисциплин'
                  : 'Сначала семестр'
              }
              options={completedSemesterDisciplines.map((discipline) => ({
                value: String(discipline.id),
                label: getDisciplineName(discipline, subjects)
              }))}
              disabled={!selectedSemesterId || completedSemesterDisciplines.length === 0}
              onChange={handleDisciplineChange}
            />
            {selectedDisciplineId && allowedFinalGradeElementTypes.length === 1 ? (
              <div className="grid gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">Итоговый тип</span>
                <div className="flex min-h-10 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text)]">
                  {getRecordName(allowedFinalGradeElementTypes[0])}
                </div>
              </div>
            ) : (
              <FilterSelect
                label="Итоговый тип"
                value={selectedFinalTypeId}
                placeholder={
                  selectedDisciplineId
                    ? allowedFinalGradeElementTypes.length > 0
                      ? 'Выбери итоговый тип'
                      : 'Форма контроля не указана'
                    : 'Сначала дисциплину'
                }
                options={allowedFinalGradeElementTypes.map(toFilterOption)}
                disabled={!selectedDisciplineId || allowedFinalGradeElementTypes.length === 0}
                onChange={setSelectedFinalTypeId}
              />
            )}
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
            {selectedDiscipline ? (
              <>
                <Badge variant={disciplineCompleted ? 'success' : 'warning'}>
                  {disciplineCompleted ? 'Занятия завершены' : 'Занятия не завершены'}
                </Badge>
                <Badge variant="muted">
                  Всего занятий: {selectedDisciplineCompletionInfo.total}
                </Badge>
                <Badge variant="muted">
                  Проведено: {selectedDisciplineCompletionInfo.conducted}
                </Badge>
                <Badge variant="muted">
                  Завершено: {selectedDisciplineCompletionInfo.completed}
                </Badge>
                <Badge
                  variant={selectedDisciplineCompletionInfo.remaining > 0 ? 'warning' : 'success'}
                >
                  Осталось: {selectedDisciplineCompletionInfo.remaining}
                </Badge>
                <Badge variant="muted">
                  Последняя пара:{' '}
                  {selectedDisciplineCompletionInfo.lastLessonDateTime
                    ? formatDateTime(selectedDisciplineCompletionInfo.lastLessonDateTime)
                    : '—'}
                </Badge>
              </>
            ) : null}
          </div>

          {selectedSemesterId && completedSemesterDisciplines.length === 0 ? (
            <div className="mt-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-text)]">
              Итоговую аттестацию можно создать только после того, как все занятия дисциплины
              проведены и завершены.
            </div>
          ) : null}

          {selectedDiscipline && !disciplineCompleted ? (
            <div className="mt-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-text)]">
              Эта дисциплина пока недоступна для итоговой аттестации. Завершите все занятия в
              журнале.
            </div>
          ) : null}

          {selectedDiscipline && allowedFinalGradeElementTypes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-text)]">
              В учебном плане для дисциплины не указана форма итогового контроля.
            </div>
          ) : null}

          <div className="mt-4">
            <Button
              disabled={
                isSaving ||
                !selectedGroupId ||
                !selectedSemesterId ||
                !selectedDisciplineId ||
                !selectedFinalTypeId ||
                !disciplineCompleted
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
        const assessmentDiscipline =
          disciplines.find(
            (discipline) => Number(discipline.id) === Number(assessment.discipline_id)
          ) ?? null
        const assessmentTeacherId = toNumberOrNull(assessmentDiscipline?.teacher_id)
        const assessmentTeacher =
          assessmentTeacherId === null ? null : (teacherById.get(assessmentTeacherId) ?? null)
        const assessmentCompletionInfo = getDisciplineCompletionInfo({
          discipline: assessmentDiscipline,
          groupId: assessment.group_id,
          semesterId: assessment.semester_id,
          scheduleItems,
          lessonSessions,
          lessonCompletionRecords,
          lessonPeriods
        })

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
                const audienceAvailability = buildAudienceAvailability({
                  audiences,
                  date: draft.assessment_date,
                  startsAt: draft.starts_at,
                  endsAt: draft.ends_at,
                  scheduleItems,
                  finalAssessmentRounds: rounds,
                  currentFinalAssessmentRoundId: Number(round.id),
                  weeks,
                  lessonPeriods,
                  groups,
                  disciplines,
                  teachers,
                  finalAssessments: assessments
                })
                const roundAudienceOptions = audienceAvailability.map((availability) => {
                  const busyReason = availability.reasons[0]
                  const busyText = busyReason
                    ? ` — занята: ${busyReason.title} · ${formatBusyReasonTime(busyReason)}`
                    : ''

                  return {
                    value: String(availability.audience.id),
                    label: `${getRecordName(availability.audience)}${busyText}`
                  }
                })
                const canShowAudienceAvailability = Boolean(
                  draft.assessment_date && draft.starts_at && draft.ends_at
                )

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
                        label="Аудитория"
                        value={draft.audience_id}
                        placeholder="Выбери аудиторию"
                        options={
                          canShowAudienceAvailability ? roundAudienceOptions : audienceOptions
                        }
                        onChange={(value) => updateRoundDraft(round.id, { audience_id: value })}
                      />
                      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm md:col-span-2 xl:col-span-1">
                        <p className="font-medium text-[var(--color-text)]">Преподаватель</p>
                        <p className="mt-1 text-[var(--color-text-muted)]">
                          {assessmentTeacher
                            ? getPersonFullName(assessmentTeacher)
                            : 'У дисциплины не указан преподаватель. Сначала заполни преподавателя в дисциплине.'}
                        </p>
                      </div>
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

                    {canShowAudienceAvailability ? (
                      <AudienceAvailabilityList availability={audienceAvailability} />
                    ) : null}

                    <div className="mt-4">
                      <Button
                        disabled={
                          isSaving ||
                          !assessmentCompletionInfo.isCompleted ||
                          assessmentTeacherId === null
                        }
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

function AudienceAvailabilityList({
  availability
}: {
  availability: AudienceAvailability[]
}): ReactElement {
  return (
    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
      <p className="text-sm font-semibold text-[var(--color-text)]">Занятость аудиторий</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {availability.map((item) => {
          const busyReason = item.reasons[0]

          return (
            <div
              key={String(item.audience.id)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[var(--color-text)]">
                  {getRecordName(item.audience)}
                </span>
                <Badge variant={item.isFree ? 'success' : 'warning'}>
                  {item.isFree ? 'Свободна' : 'Занята'}
                </Badge>
              </div>

              {busyReason ? (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {busyReason.title} · {formatBusyReasonTime(busyReason)}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
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

function getDisciplineScheduleItems({
  discipline,
  groupId,
  semesterId,
  scheduleItems
}: {
  discipline: AdminCrudRecord | null
  groupId: unknown
  semesterId: unknown
  scheduleItems: AdminCrudRecord[]
}): AdminCrudRecord[] {
  if (!discipline?.id || !groupId || !semesterId) {
    return []
  }

  return scheduleItems.filter(
    (scheduleItem) =>
      Number(scheduleItem.group_id) === Number(groupId) &&
      Number(scheduleItem.semester_id) === Number(semesterId) &&
      Number(scheduleItem.discipline_id) === Number(discipline.id)
  )
}

function getDisciplineCompletionInfo({
  discipline,
  groupId,
  semesterId,
  scheduleItems,
  lessonSessions,
  lessonCompletionRecords,
  lessonPeriods
}: {
  discipline: AdminCrudRecord | null
  groupId: unknown
  semesterId: unknown
  scheduleItems: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
  lessonCompletionRecords: AdminCrudRecord[]
  lessonPeriods: AdminCrudRecord[]
}): DisciplineCompletionInfo {
  const disciplineScheduleItems = getDisciplineScheduleItems({
    discipline,
    groupId,
    semesterId,
    scheduleItems
  })
  let conducted = 0
  let completed = 0

  disciplineScheduleItems.forEach((scheduleItem) => {
    const session = getLessonSessionForScheduleItem(scheduleItem, lessonSessions)

    if (session && String(session.status ?? '') === 'conducted') {
      conducted += 1
    }

    if (!session?.id) {
      return
    }

    const completionRecord = lessonCompletionRecords.find(
      (record) =>
        Number(record.lesson_session_id) === Number(session.id) &&
        String(record.status ?? '') === 'completed'
    )

    if (!completionRecord) {
      return
    }

    completed += 1
  })

  const total = disciplineScheduleItems.length

  return {
    total,
    conducted,
    completed,
    remaining: Math.max(0, total - completed),
    isCompleted: total > 0 && conducted === total && completed === total,
    lastLessonDateTime: getLastCompletedLessonDateTime({
      scheduleItems: disciplineScheduleItems,
      lessonSessions,
      lessonCompletionRecords,
      lessonPeriods
    })
  }
}

function getLastCompletedLessonDateTime({
  scheduleItems,
  lessonSessions,
  lessonCompletionRecords,
  lessonPeriods
}: {
  scheduleItems: AdminCrudRecord[]
  lessonSessions: AdminCrudRecord[]
  lessonCompletionRecords: AdminCrudRecord[]
  lessonPeriods: AdminCrudRecord[]
}): Date | null {
  let lastLessonDateTime: Date | null = null
  let hasMissingCompletedLessonDateTime = false

  scheduleItems.forEach((scheduleItem) => {
    const session = getLessonSessionForScheduleItem(scheduleItem, lessonSessions)

    if (!session?.id) {
      return
    }

    const completionRecord = lessonCompletionRecords.find(
      (record) =>
        Number(record.lesson_session_id) === Number(session.id) &&
        String(record.status ?? '') === 'completed'
    )

    if (!completionRecord) {
      return
    }

    const lessonDateTime = getLessonEndDateTime(scheduleItem, session, lessonPeriods)

    if (!lessonDateTime) {
      hasMissingCompletedLessonDateTime = true
      return
    }

    if (!lastLessonDateTime || lessonDateTime.getTime() > lastLessonDateTime.getTime()) {
      lastLessonDateTime = lessonDateTime
    }
  })

  return hasMissingCompletedLessonDateTime ? null : lastLessonDateTime
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

function getLessonEndDateTime(
  scheduleItem: AdminCrudRecord,
  session: AdminCrudRecord,
  lessonPeriods: AdminCrudRecord[]
): Date | null {
  const lessonPeriod =
    lessonPeriods.find((period) => Number(period.id) === Number(scheduleItem.lesson_period_id)) ??
    null

  return combineDateAndTime(session.lesson_date, lessonPeriod?.ends_at)
}

function validateRoundOrder({
  round,
  rounds,
  draft,
  roundStartDateTime
}: {
  round: AdminCrudRecord
  rounds: AdminCrudRecord[]
  draft: RoundDraft
  roundStartDateTime: Date
}): string | null {
  const roundEndDateTime = combineDateAndTime(draft.assessment_date, draft.ends_at)

  if (!roundEndDateTime || roundEndDateTime.getTime() <= roundStartDateTime.getTime()) {
    return 'Время окончания тура должно быть позже времени начала'
  }

  const roundType = String(round.round_type ?? '')

  if (roundType === 'main') {
    return null
  }

  const previousRoundType = roundType === 'commission' ? 'retake' : 'main'
  const previousRound =
    rounds.find((item) => String(item.round_type ?? '') === previousRoundType) ?? null

  if (!previousRound?.assessment_date || !previousRound.starts_at) {
    return 'Сначала назначь предыдущий тур итоговой аттестации.'
  }

  const previousRoundStartDateTime = combineDateAndTime(
    previousRound.assessment_date,
    previousRound.starts_at
  )
  const previousRoundEndDateTime = combineDateAndTime(
    previousRound.assessment_date,
    previousRound.ends_at
  )

  if (!previousRoundStartDateTime) {
    return 'Сначала назначь предыдущий тур итоговой аттестации.'
  }

  const previousRoundDateTime = previousRoundEndDateTime ?? previousRoundStartDateTime

  if (roundStartDateTime.getTime() <= previousRoundDateTime.getTime()) {
    return roundType === 'commission'
      ? 'Комиссию можно назначить только после пересдачи.'
      : 'Пересдачу можно назначить только после основного тура.'
  }

  return null
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

function formatDateTime(value: Date): string {
  return value.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getGradeElementTypeMaxScore(gradeElementType: AdminCrudRecord | null | undefined): number {
  if (gradeElementType?.grading_mode === 'pass_fail') {
    return 1
  }

  const maxScore = toNumberOrNull(gradeElementType?.max_score)

  return maxScore && maxScore > 0 ? maxScore : 100
}

function resolveAllowedFinalGradeElementTypesForDiscipline({
  discipline,
  curriculumItems,
  gradeElementTypes
}: {
  discipline: AdminCrudRecord | null
  curriculumItems: AdminCrudRecord[]
  gradeElementTypes: AdminCrudRecord[]
}): AdminCrudRecord[] {
  const curriculumItemId = toNumberOrNull(discipline?.curriculum_item_id)
  const curriculumItem =
    curriculumItemId === null
      ? null
      : (curriculumItems.find((item) => Number(item.id) === curriculumItemId) ?? null)

  if (!curriculumItem?.control_form) {
    return []
  }

  const finalTypes = gradeElementTypes.filter((type) => Number(type.is_final) === 1)
  const rawValues = parseControlFormValues(curriculumItem.control_form)
  const allowedTypeIds = new Set<number>()

  rawValues.forEach((value) => {
    const valueId = toNumberOrNull(value)

    if (valueId !== null && finalTypes.some((type) => Number(type.id) === valueId)) {
      allowedTypeIds.add(valueId)
      return
    }

    const normalizedValue = value.toLocaleLowerCase('ru-RU')
    const matchedType = finalTypes.find(
      (type) =>
        String(type.name ?? '')
          .trim()
          .toLocaleLowerCase('ru-RU') === normalizedValue
    )

    if (matchedType?.id) {
      allowedTypeIds.add(Number(matchedType.id))
    }
  })

  return finalTypes.filter((type) => allowedTypeIds.has(Number(type.id)))
}

function parseControlFormValues(value: unknown): string[] {
  const text = String(value ?? '').trim()

  if (!text) {
    return []
  }

  try {
    const parsed = JSON.parse(text)

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean)
    }
  } catch {
    // Legacy values are plain text.
  }

  return text
    .split(/\n|,|\/|\+/)
    .map((item) => item.trim())
    .filter(Boolean)
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
