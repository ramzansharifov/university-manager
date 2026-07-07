import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { FiClock, FiEdit2, FiMapPin, FiPlus, FiRefreshCcw, FiTrash2, FiUser } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { resolveGroupAcademicYearId } from '../../../shared/lib/academicYear'
import { createDisciplineProgressMap } from '../../academic-process/lib/disciplineProgress'
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
import {
  createDisciplineOptions,
  createGroupScheduleItemColumns,
  createGroupScheduleItemFields,
  createLessonPeriodOptions,
  createOptions,
  createOptionsMap,
  createWeekOptions,
  createWeekTypeMap,
  dayOfWeekOptions,
  getPersonName,
  getRecordName,
  getSemesterName
} from '../config/scheduleCrudConfig'

const dayNumbers = [1, 2, 3, 4, 5, 6, 7]

type ScheduleColumnsPerRow = 1 | 2 | 3 | 4

const scheduleColumnOptions: AdminCrudSelectOption[] = [1, 2, 3, 4].map((value) => ({
  value: String(value),
  label: String(value)
}))

const scheduleGridClasses: Record<ScheduleColumnsPerRow, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
}

interface GradeItemForm {
  day_of_week: string
  discipline_id: string
  grade_element_type_id: string
  name: string
  max_score: string
  description: string
}

const emptyGradeItemForm: GradeItemForm = {
  day_of_week: '',
  discipline_id: '',
  grade_element_type_id: '',
  name: '',
  max_score: '',
  description: ''
}

export function ScheduleItemsDrilldown(): ReactElement {
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedWeekId, setSelectedWeekId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [scheduleColumnsPerRow, setScheduleColumnsPerRow] = useState<ScheduleColumnsPerRow>(4)

  const [faculties, setFaculties] = useState<AdminCrudRecord[]>([])
  const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
  const [groups, setGroups] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [weeks, setWeeks] = useState<AdminCrudRecord[]>([])
  const [semesters, setSemesters] = useState<AdminCrudRecord[]>([])
  const [lessonPeriods, setLessonPeriods] = useState<AdminCrudRecord[]>([])
  const [gradeElementTypes, setGradeElementTypes] = useState<AdminCrudRecord[]>([])
  const [gradeItems, setGradeItems] = useState<AdminCrudRecord[]>([])
  const [academicYears, setAcademicYears] = useState<AdminCrudRecord[]>([])
  const [curriculumItems, setCurriculumItems] = useState<AdminCrudRecord[]>([])
  const [scheduleItems, setScheduleItems] = useState<AdminCrudRecord[]>([])
  const [lessonSessions, setLessonSessions] = useState<AdminCrudRecord[]>([])

  const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])
  const [weekOptions, setWeekOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [audienceOptions, setAudienceOptions] = useState<AdminCrudSelectOption[]>([])
  const [lessonTypeOptions, setLessonTypeOptions] = useState<AdminCrudSelectOption[]>([])
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [gradeForm, setGradeForm] = useState<GradeItemForm>(emptyGradeItemForm)
  const [gradeDialogError, setGradeDialogError] = useState<string | null>(null)
  const [isCreatingGradeItem, setIsCreatingGradeItem] = useState(false)

  const loadOptions = useCallback(async (): Promise<void> => {
    const [
      facultiesResult,
      specialtiesResult,
      groupsResult,
      subjectsResult,
      disciplinesResult,
      semestersResult,
      weeksResult,
      lessonPeriodsResult,
      teachersResult,
      audiencesResult,
      lessonTypesResult,
      gradeElementTypesResult,
      gradeItemsResult,
      academicYearsResult,
      curriculumItemsResult,
      scheduleItemsResult,
      lessonSessionsResult
    ] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'faculties',
        page: 1,
        pageSize: 300,
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
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'disciplines',
        page: 1,
        pageSize: 1000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'semesters',
        page: 1,
        pageSize: 100,
        orderBy: 'number',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'weeks',
        page: 1,
        pageSize: 500,
        orderBy: 'number',
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
        entity: 'teachers',
        page: 1,
        pageSize: 300,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'audiences',
        page: 1,
        pageSize: 300,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'dictionary_items',
        page: 1,
        pageSize: 100,
        filters: { dictionary_key: 'lesson_types' },
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
        entity: 'academic_years',
        page: 1,
        pageSize: 500,
        orderBy: 'starts_at',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'curriculum_items',
        page: 1,
        pageSize: 5000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'schedule_items',
        page: 1,
        pageSize: 10000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'lesson_sessions',
        page: 1,
        pageSize: 10000,
        orderBy: 'id',
        orderDirection: 'asc'
      })
    ])

    setFaculties(facultiesResult.items)
    setSpecialties(specialtiesResult.items)
    setGroups(groupsResult.items)
    setSubjects(subjectsResult.items)
    setDisciplines(disciplinesResult.items)
    setLessonPeriods(lessonPeriodsResult.items)
    setGradeElementTypes(gradeElementTypesResult.items)
    setGradeItems(gradeItemsResult.items)
    setAcademicYears(academicYearsResult.items)
    setCurriculumItems(curriculumItemsResult.items)
    setScheduleItems(scheduleItemsResult.items)
    setLessonSessions(lessonSessionsResult.items)

    setSemesterOptions(createOptions(semestersResult.items, getSemesterName))
    setSemesters(semestersResult.items)

    setWeeks(weeksResult.items)
    setWeekOptions(createWeekOptions(weeksResult.items))
    setTeacherOptions(createOptions(teachersResult.items, getPersonName))
    setAudienceOptions(createOptions(audiencesResult.items, getRecordName))
    setLessonTypeOptions(createOptions(lessonTypesResult.items, getRecordName))
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOptions()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadOptions])

  const facultyOptions = useMemo(() => createOptions(faculties, getRecordName), [faculties])

  const filteredSpecialties = useMemo(() => {
    if (!selectedFacultyId) {
      return []
    }

    return specialties.filter((specialty) => {
      return Number(specialty.faculty_id) === Number(selectedFacultyId)
    })
  }, [selectedFacultyId, specialties])

  const specialtyOptions = useMemo(
    () => createOptions(filteredSpecialties, getRecordName),
    [filteredSpecialties]
  )

  const filteredGroups = useMemo(() => {
    if (!selectedSpecialtyId) {
      return []
    }

    return groups.filter((group) => {
      return Number(group.specialty_id) === Number(selectedSpecialtyId)
    })
  }, [groups, selectedSpecialtyId])

  const groupOptions = useMemo(() => createOptions(filteredGroups, getRecordName), [filteredGroups])

  const allGroupOptions = useMemo(() => createOptions(groups, getRecordName), [groups])
  const subjectOptions = useMemo(() => createOptions(subjects, getRecordName), [subjects])

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

  const selectedWeek = useMemo(
    () => weeks.find((week) => String(week.id) === selectedWeekId) ?? null,
    [selectedWeekId, weeks]
  )

  const selectedGroupDisciplines = useMemo(() => {
    if (!selectedGroup) {
      return []
    }

    return disciplines.filter(
      (discipline) => Number(discipline.group_id) === Number(selectedGroup.id)
    )
  }, [disciplines, selectedGroup])

  const selectedGroupSemesterIds = useMemo(() => {
    return new Set(
      selectedGroupDisciplines
        .map((discipline) => toNumberOrNull(discipline.semester_id))
        .filter((semesterId): semesterId is number => semesterId !== null)
    )
  }, [selectedGroupDisciplines])

  const availableSemesterOptions = useMemo(() => {
    if (!selectedGroup) {
      return []
    }

    const admissionAcademicYearId = toNumberOrNull(selectedGroup.academic_year_id)
    const selectedGroupAcademicYearId = resolveGroupAcademicYearId(selectedGroup, academicYears)

    if (admissionAcademicYearId !== null) {
      if (selectedGroupAcademicYearId === null) {
        return []
      }

      return semesterOptions.filter((semesterOption) => {
        const semester = semesters.find((item) => String(item.id) === semesterOption.value)

        return (
          semester !== undefined &&
          normalizeNumber(semester.academic_year_id) === selectedGroupAcademicYearId
        )
      })
    }

    if (selectedGroupSemesterIds.size === 0) {
      return []
    }

    return semesterOptions.filter((semesterOption) => {
      return selectedGroupSemesterIds.has(Number(semesterOption.value))
    })
  }, [academicYears, selectedGroup, selectedGroupSemesterIds, semesterOptions, semesters])

  const availableWeekOptions = useMemo(() => {
    if (!selectedSemesterId) {
      return []
    }

    return weekOptions.filter((weekOption) => {
      const semesterId = toNumberOrNull(weekOption.meta?.semester_id)

      return semesterId !== null && semesterId === Number(selectedSemesterId)
    })
  }, [selectedSemesterId, weekOptions])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!selectedGroupId) {
        setSelectedSemesterId('')
        setSelectedWeekId('')
        return
      }

      const selectedSemesterStillAvailable = availableSemesterOptions.some(
        (semesterOption) => semesterOption.value === selectedSemesterId
      )

      if (selectedSemesterId && !selectedSemesterStillAvailable) {
        setSelectedSemesterId('')
        setSelectedWeekId('')
        return
      }

      if (!selectedSemesterId && availableSemesterOptions.length > 0) {
        setSelectedSemesterId(availableSemesterOptions[0].value)
        setSelectedWeekId('')
        return
      }

      const selectedWeekStillAvailable = availableWeekOptions.some(
        (weekOption) => weekOption.value === selectedWeekId
      )

      if (selectedWeekId && !selectedWeekStillAvailable) {
        setSelectedWeekId('')
        return
      }

      if (!selectedWeekId && availableWeekOptions.length > 0) {
        setSelectedWeekId(availableWeekOptions[0].value)
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [
    availableSemesterOptions,
    availableWeekOptions,
    selectedGroupId,
    selectedSemesterId,
    selectedWeekId
  ])

  const subjectNameById = useMemo(() => createOptionsMap(subjectOptions), [subjectOptions])
  const groupNameById = useMemo(() => createOptionsMap(allGroupOptions), [allGroupOptions])

  const selectedSemesterDisciplines = useMemo(() => {
    if (!selectedSemesterId) {
      return []
    }

    return selectedGroupDisciplines.filter(
      (discipline) => Number(discipline.semester_id) === Number(selectedSemesterId)
    )
  }, [selectedGroupDisciplines, selectedSemesterId])

  const selectedWeekDisciplines = selectedSemesterDisciplines

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

  const fullyScheduledDisciplines = useMemo(
    () =>
      selectedWeekDisciplines.filter((discipline) => {
        const progress = disciplineProgressById.get(Number(discipline.id))

        return progress?.isFullyScheduled === true
      }),
    [disciplineProgressById, selectedWeekDisciplines]
  )

  const disciplineOptions = useMemo(
    () =>
      createDisciplineOptions(selectedSemesterDisciplines, {
        subjectNameById,
        groupNameById
      }),
    [groupNameById, selectedSemesterDisciplines, subjectNameById]
  )
  const gradeDisciplineOptions = useMemo(
    () =>
      createDisciplineOptions(fullyScheduledDisciplines, {
        subjectNameById,
        groupNameById
      }),
    [fullyScheduledDisciplines, groupNameById, subjectNameById]
  )

  const semesterNameById = useMemo(() => createOptionsMap(semesterOptions), [semesterOptions])
  const weekNameById = useMemo(() => createOptionsMap(weekOptions), [weekOptions])
  const lessonPeriodOptions = useMemo(
    () => createLessonPeriodOptions(lessonPeriods),
    [lessonPeriods]
  )
  const lessonPeriodNameById = useMemo(
    () => createOptionsMap(lessonPeriodOptions),
    [lessonPeriodOptions]
  )
  const disciplineNameById = useMemo(() => createOptionsMap(disciplineOptions), [disciplineOptions])
  const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
  const audienceNameById = useMemo(() => createOptionsMap(audienceOptions), [audienceOptions])
  const lessonTypeNameById = useMemo(() => createOptionsMap(lessonTypeOptions), [lessonTypeOptions])
  const finalGradeElementTypes = useMemo(
    () => gradeElementTypes.filter((gradeElementType) => Number(gradeElementType.is_final) === 1),
    [gradeElementTypes]
  )
  const gradeElementTypeOptions = useMemo(
    () => createOptions(finalGradeElementTypes, getRecordName),
    [finalGradeElementTypes]
  )
  const allGradeElementTypeOptions = useMemo(
    () => createOptions(gradeElementTypes, getRecordName),
    [gradeElementTypes]
  )
  const gradeElementTypeNameById = useMemo(
    () => createOptionsMap(allGradeElementTypeOptions),
    [allGradeElementTypeOptions]
  )
  const dayOfWeekNameById = useMemo(() => createOptionsMap(dayOfWeekOptions), [])
  const weekTypeNameByValue = useMemo(() => createWeekTypeMap(), [])

  const selectedWeekGradeItems = useMemo(() => {
    if (!selectedWeekId) {
      return []
    }

    const disciplineIds = new Set(
      selectedGroupDisciplines.map((discipline) => Number(discipline.id))
    )

    return gradeItems.filter(
      (item) =>
        Number(item.week_id) === Number(selectedWeekId) &&
        disciplineIds.has(Number(item.discipline_id))
    )
  }, [gradeItems, selectedGroupDisciplines, selectedWeekId])

  const lessonPeriodById = useMemo(() => {
    return new Map(
      lessonPeriods
        .map((lessonPeriod) => [toNumberOrNull(lessonPeriod.id), lessonPeriod])
        .filter((entry): entry is [number, AdminCrudRecord] => entry[0] !== null)
    )
  }, [lessonPeriods])

  const scheduleItemFields = useMemo(
    () =>
      createGroupScheduleItemFields({
        semesterOptions,
        weekOptions,
        lessonPeriodOptions,
        groupOptions: allGroupOptions,
        disciplineOptions,
        teacherOptions,
        audienceOptions,
        lessonTypeOptions
      }).filter((field) => field.key !== 'week_id'),
    [
      allGroupOptions,
      audienceOptions,
      disciplineOptions,
      lessonPeriodOptions,
      lessonTypeOptions,
      semesterOptions,
      teacherOptions,
      weekOptions
    ]
  )

  const scheduleItemColumns = useMemo(
    () =>
      createGroupScheduleItemColumns({
        semesterNameById,
        lessonPeriodNameById,
        groupNameById,
        disciplineNameById,
        teacherNameById,
        audienceNameById,
        lessonTypeNameById,
        dayOfWeekNameById,
        weekTypeNameByValue,
        weekNameById
      }),
    [
      audienceNameById,
      dayOfWeekNameById,
      disciplineNameById,
      groupNameById,
      lessonPeriodNameById,
      lessonTypeNameById,
      semesterNameById,
      teacherNameById,
      weekNameById,
      weekTypeNameByValue
    ]
  )

  const scheduleFilters = useMemo(() => {
    if (!selectedGroupId || !selectedSemesterId || !selectedWeekId) {
      return undefined
    }

    return {
      group_id: Number(selectedGroupId),
      semester_id: Number(selectedSemesterId),
      week_id: Number(selectedWeekId)
    }
  }, [selectedGroupId, selectedSemesterId, selectedWeekId])

  const scheduleFixedData = useMemo(() => {
    if (!selectedGroupId || !selectedSemesterId || !selectedWeekId) {
      return undefined
    }

    return {
      group_id: Number(selectedGroupId),
      semester_id: Number(selectedSemesterId),
      week_id: Number(selectedWeekId)
    }
  }, [selectedGroupId, selectedSemesterId, selectedWeekId])

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

  function handleScheduleColumnsChange(value: string): void {
    const nextValue = Number(value)

    if (nextValue >= 1 && nextValue <= 4) {
      setScheduleColumnsPerRow(nextValue as ScheduleColumnsPerRow)
    }
  }

  const canShowSchedule = Boolean(selectedGroup && selectedSemesterId && selectedWeek)
  const canCreateScheduleItem = canShowSchedule && selectedSemesterDisciplines.length > 0
  const canCreateGradeItem =
    canShowSchedule && fullyScheduledDisciplines.length > 0 && gradeElementTypeOptions.length > 0

  function openGradeItemDialog(): void {
    setGradeDialogError(null)
    setGradeForm({
      day_of_week: '1',
      discipline_id: fullyScheduledDisciplines[0]?.id
        ? String(fullyScheduledDisciplines[0].id)
        : '',
      grade_element_type_id: gradeElementTypeOptions[0]?.value ?? '',
      name: '',
      max_score: '',
      description: ''
    })
    setGradeDialogOpen(true)
  }

  function updateGradeFormField(field: keyof GradeItemForm, value: string): void {
    setGradeForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  async function createGradeItemFromSchedule(): Promise<void> {
    setGradeDialogError(null)

    if (!selectedWeekId) {
      setGradeDialogError('Сначала выбери неделю')
      return
    }

    if (!gradeForm.day_of_week) {
      setGradeDialogError('Выбери день недели')
      return
    }

    if (!gradeForm.discipline_id) {
      setGradeDialogError('Выбери дисциплину')
      return
    }

    if (!gradeForm.grade_element_type_id) {
      setGradeDialogError('Выбери тип оценочного элемента')
      return
    }

    if (
      !gradeElementTypeOptions.some((option) => option.value === gradeForm.grade_element_type_id)
    ) {
      setGradeDialogError('Выбери итоговый тип оценочного элемента')
      return
    }

    const selectedDisciplineProgress = disciplineProgressById.get(Number(gradeForm.discipline_id))

    if (!selectedDisciplineProgress?.isFullyScheduled) {
      const scheduledPairs = selectedDisciplineProgress?.scheduledPairs ?? 0
      const requiredPairs = selectedDisciplineProgress?.requiredPairs ?? 0

      setGradeDialogError(
        `Нельзя добавить итоговый оценочный элемент: по дисциплине ещё не заполнены все пары расписания. Запланировано ${scheduledPairs} из ${requiredPairs}.`
      )
      return
    }

    const name = gradeForm.name.trim()

    if (!name) {
      setGradeDialogError('Укажи название оценочного элемента')
      return
    }

    const maxScore = Number(gradeForm.max_score)

    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      setGradeDialogError('Укажи корректный максимальный балл')
      return
    }

    setIsCreatingGradeItem(true)

    try {
      await window.api.adminCrud.create({
        entity: 'grade_items',
        data: {
          discipline_id: Number(gradeForm.discipline_id),
          grade_element_type_id: Number(gradeForm.grade_element_type_id),
          week_id: Number(selectedWeekId),
          day_of_week: Number(gradeForm.day_of_week),
          name,
          max_score: maxScore,
          description: gradeForm.description.trim() || null
        }
      })

      setGradeDialogOpen(false)
      await loadOptions()
    } catch (error) {
      setGradeDialogError(
        error instanceof Error ? error.message : 'Не удалось создать оценочный элемент'
      )
    } finally {
      setIsCreatingGradeItem(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Расписание занятий</CardTitle>
              <CardDescription>
                Выбери факультет, специальность, группу, семестр и неделю. Ниже расписание будет
                показано карточками по дням недели.
              </CardDescription>
            </div>

            <Button variant="secondary" onClick={resetFilters}>
              <FiRefreshCcw />
              Сбросить фильтры
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 xl:grid-cols-5">
            <ScheduleFilterSelect
              label="Факультет"
              value={selectedFacultyId}
              placeholder="Выбери факультет"
              options={facultyOptions}
              onChange={handleFacultyChange}
            />

            <ScheduleFilterSelect
              label="Специальность"
              value={selectedSpecialtyId}
              placeholder={selectedFacultyId ? 'Выбери специальность' : 'Сначала факультет'}
              options={specialtyOptions}
              disabled={!selectedFacultyId || specialtyOptions.length === 0}
              onChange={handleSpecialtyChange}
            />

            <ScheduleFilterSelect
              label="Группа"
              value={selectedGroupId}
              placeholder={selectedSpecialtyId ? 'Выбери группу' : 'Сначала специальность'}
              options={groupOptions}
              disabled={!selectedSpecialtyId || groupOptions.length === 0}
              onChange={handleGroupChange}
            />
            <ScheduleFilterSelect
              label="Семестр"
              value={selectedSemesterId}
              placeholder={selectedGroupId ? 'Выбери семестр' : 'Сначала группу'}
              options={availableSemesterOptions}
              disabled={!selectedGroupId || availableSemesterOptions.length === 0}
              onChange={handleSemesterChange}
            />

            <ScheduleFilterSelect
              label="Неделя"
              value={selectedWeekId}
              placeholder={selectedSemesterId ? 'Выбери неделю' : 'Сначала семестр'}
              options={availableWeekOptions}
              disabled={!selectedSemesterId || availableWeekOptions.length === 0}
              onChange={setSelectedWeekId}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {selectedFaculty ? <Badge>{getRecordName(selectedFaculty)}</Badge> : null}
            {selectedSpecialty ? <Badge>{getRecordName(selectedSpecialty)}</Badge> : null}
            {selectedGroup ? <Badge>{getRecordName(selectedGroup)}</Badge> : null}
            {selectedSemesterId ? (
              <Badge>{semesterNameById.get(Number(selectedSemesterId))}</Badge>
            ) : null}
            {selectedWeek ? <Badge>{weekNameById.get(Number(selectedWeek.id))}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {!canShowSchedule ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Выбери факультет, специальность, группу, семестр и неделю.
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              После выбора фильтров здесь появится расписание недели в виде карточек по дням.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {selectedGroup && selectedGroupDisciplines.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--color-text-muted)]">
              У выбранной группы пока нет дисциплин. Добавь дисциплины в разделе «Учебный процесс →
              Дисциплины групп», после этого можно будет составлять расписание.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {canShowSchedule ? (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Оценочные элементы недели
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Добавь контрольную, лабораторную, зачёт или другой элемент, чтобы он появился в
                журнале обучения.
              </p>
              {gradeElementTypeOptions.length === 0 ? (
                <p className="mt-2 text-xs font-medium text-[var(--color-warning)]">
                  Сначала создай типы оценочных элементов в разделе «Журнал обучения → Оценочные
                  элементы».
                </p>
              ) : null}
              {gradeElementTypeOptions.length > 0 &&
              selectedWeekDisciplines.length > 0 &&
              fullyScheduledDisciplines.length === 0 ? (
                <p className="mt-2 text-xs font-medium text-[var(--color-warning)]">
                  Итоговый элемент можно добавить после того, как все пары дисциплины будут внесены
                  в расписание.
                </p>
              ) : null}
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={!canCreateGradeItem}
              onClick={openGradeItemDialog}
            >
              Добавить оценочный элемент
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {canShowSchedule ? (
        <AdminCrudEntityPanel
          entity="schedule_items"
          title={`Неделя: ${weekNameById.get(Number(selectedWeekId)) ?? 'выбранная неделя'}`}
          description={`Расписание группы «${selectedGroup ? getRecordName(selectedGroup) : ''}» по дням недели.`}
          createButtonLabel="Добавить занятие"
          fields={scheduleItemFields}
          columns={scheduleItemColumns}
          filters={scheduleFilters}
          fixedData={scheduleFixedData}
          emptyMessage="Для выбранной недели расписание пока не создано."
          orderBy="day_of_week"
          orderDirection="asc"
          canCreate={canCreateScheduleItem}
          hideSearch
          headerActions={
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--color-text-muted)]">Колонок</span>
              <Select
                value={String(scheduleColumnsPerRow)}
                onValueChange={handleScheduleColumnsChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleColumnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          onAfterMutation={loadOptions}
          renderItems={({
            items,
            isLoading,
            emptyMessage,
            canEdit,
            canDelete,
            openCreateDialog,
            openEditDialog,
            requestDelete
          }) => (
            <ScheduleWeekBoard
              items={items}
              isLoading={isLoading}
              emptyMessage={emptyMessage}
              canEdit={canEdit}
              canDelete={canDelete}
              lessonPeriodById={lessonPeriodById}
              lessonPeriodNameById={lessonPeriodNameById}
              disciplineNameById={disciplineNameById}
              teacherNameById={teacherNameById}
              audienceNameById={audienceNameById}
              lessonTypeNameById={lessonTypeNameById}
              gradeItems={selectedWeekGradeItems}
              gradeElementTypeNameById={gradeElementTypeNameById}
              columnsPerRow={scheduleColumnsPerRow}
              canCreate={canCreateScheduleItem}
              onCreateDay={(dayNumber) => openCreateDialog({ day_of_week: dayNumber })}
              onEdit={openEditDialog}
              onDelete={requestDelete}
            />
          )}
        />
      ) : null}

      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent
          onPointerDownOutside={(event) => {
            event.preventDefault()
          }}
          onInteractOutside={(event) => {
            const target = event.target

            if (
              target instanceof HTMLElement &&
              target.closest('[data-university-manager-select-content]')
            ) {
              event.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Добавить оценочный элемент</DialogTitle>
            <DialogDescription>
              Элемент появится в расписании выбранной недели и отдельной колонкой в журнале
              обучения.
            </DialogDescription>
          </DialogHeader>

          {gradeDialogError ? (
            <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              {gradeDialogError}
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <GradeItemSelectField
              label="День недели"
              value={gradeForm.day_of_week}
              placeholder="Выбери день"
              options={dayOfWeekOptions}
              onChange={(value) => updateGradeFormField('day_of_week', value)}
            />

            <GradeItemSelectField
              label="Дисциплина"
              value={gradeForm.discipline_id}
              placeholder="Выбери дисциплину"
              options={gradeDisciplineOptions}
              hint="Доступны только дисциплины, по которым расписание заполнено полностью."
              onChange={(value) => updateGradeFormField('discipline_id', value)}
            />

            <GradeItemSelectField
              label="Тип оценочного элемента"
              value={gradeForm.grade_element_type_id}
              placeholder="Выбери тип элемента"
              options={gradeElementTypeOptions}
              onChange={(value) => updateGradeFormField('grade_element_type_id', value)}
            />

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--color-text)]">
                Максимальный балл
              </span>
              <Input
                type="number"
                min="1"
                value={gradeForm.max_score}
                placeholder="Например: 100"
                onChange={(event) => updateGradeFormField('max_score', event.target.value)}
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Название работы</span>
              <Input
                value={gradeForm.name}
                placeholder="Например: Контрольная работа №1"
                onChange={(event) => updateGradeFormField('name', event.target.value)}
              />
            </label>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Описание</span>
              <Textarea
                value={gradeForm.description}
                placeholder="Дополнительная информация"
                onChange={(event) => updateGradeFormField('description', event.target.value)}
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setGradeDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              disabled={isCreatingGradeItem}
              onClick={() => void createGradeItemFromSchedule()}
            >
              {isCreatingGradeItem ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ScheduleFilterSelect({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange
}: {
  label: string
  value: string
  placeholder: string
  options: AdminCrudSelectOption[]
  disabled?: boolean
  onChange: (value: string) => void
}): ReactElement {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>

      <Select value={value || undefined} disabled={disabled} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
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

function GradeItemSelectField({
  label,
  value,
  placeholder,
  options,
  hint,
  onChange
}: {
  label: string
  value: string
  placeholder: string
  options: AdminCrudSelectOption[]
  hint?: string
  onChange: (value: string) => void
}): ReactElement {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>

      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hint ? <span className="text-xs text-[var(--color-text-muted)]">{hint}</span> : null}
    </label>
  )
}

function ScheduleWeekBoard({
  items,
  isLoading,
  emptyMessage,
  canEdit,
  canDelete,
  lessonPeriodById,
  lessonPeriodNameById,
  disciplineNameById,
  teacherNameById,
  audienceNameById,
  lessonTypeNameById,
  gradeItems,
  gradeElementTypeNameById,
  columnsPerRow,
  canCreate,
  onCreateDay,
  onEdit,
  onDelete
}: {
  items: AdminCrudRecord[]
  isLoading: boolean
  emptyMessage: string
  canEdit: boolean
  canDelete: boolean
  lessonPeriodById: Map<number, AdminCrudRecord>
  lessonPeriodNameById: Map<number, string>
  disciplineNameById: Map<number, string>
  teacherNameById: Map<number, string>
  audienceNameById: Map<number, string>
  lessonTypeNameById: Map<number, string>
  gradeItems: AdminCrudRecord[]
  gradeElementTypeNameById: Map<number, string>
  columnsPerRow: ScheduleColumnsPerRow
  canCreate: boolean
  onCreateDay: (dayNumber: number) => void
  onEdit: (record: AdminCrudRecord) => void
  onDelete: (record: AdminCrudRecord) => void
}): ReactElement {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
        Загрузка расписания...
      </div>
    )
  }

  const sortedItems = [...items].sort((firstItem, secondItem) => {
    const dayDiff = Number(firstItem.day_of_week ?? 0) - Number(secondItem.day_of_week ?? 0)

    if (dayDiff !== 0) {
      return dayDiff
    }

    return (
      getLessonPeriodSortValue(firstItem, lessonPeriodById) -
      getLessonPeriodSortValue(secondItem, lessonPeriodById)
    )
  })

  const itemsByDay = createItemsByDay(sortedItems)
  const gradeItemsByDay = createGradeItemsByDay(gradeItems)

  return (
    <div className={`grid gap-4 ${scheduleGridClasses[columnsPerRow]}`}>
      {dayNumbers.map((dayNumber) => (
        <ScheduleDayCard
          key={dayNumber}
          dayNumber={dayNumber}
          items={itemsByDay.get(dayNumber) ?? []}
          emptyMessage={emptyMessage}
          canEdit={canEdit}
          canDelete={canDelete}
          lessonPeriodById={lessonPeriodById}
          lessonPeriodNameById={lessonPeriodNameById}
          disciplineNameById={disciplineNameById}
          teacherNameById={teacherNameById}
          audienceNameById={audienceNameById}
          lessonTypeNameById={lessonTypeNameById}
          gradeItems={gradeItemsByDay.get(dayNumber) ?? []}
          gradeElementTypeNameById={gradeElementTypeNameById}
          canCreate={canCreate}
          onCreate={onCreateDay}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function ScheduleDayCard({
  dayNumber,
  items,
  emptyMessage,
  canEdit,
  canDelete,
  lessonPeriodById,
  lessonPeriodNameById,
  disciplineNameById,
  teacherNameById,
  audienceNameById,
  lessonTypeNameById,
  gradeItems,
  gradeElementTypeNameById,
  canCreate,
  onCreate,
  onEdit,
  onDelete
}: {
  dayNumber: number
  items: AdminCrudRecord[]
  emptyMessage: string
  canEdit: boolean
  canDelete: boolean
  lessonPeriodById: Map<number, AdminCrudRecord>
  lessonPeriodNameById: Map<number, string>
  disciplineNameById: Map<number, string>
  teacherNameById: Map<number, string>
  audienceNameById: Map<number, string>
  lessonTypeNameById: Map<number, string>
  gradeItems: AdminCrudRecord[]
  gradeElementTypeNameById: Map<number, string>
  canCreate: boolean
  onCreate: (dayNumber: number) => void
  onEdit: (record: AdminCrudRecord) => void
  onDelete: (record: AdminCrudRecord) => void
}): ReactElement {
  return (
    <Card className="min-h-64 overflow-hidden">
      <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{getDayName(dayNumber)}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={items.length > 0 ? 'default' : 'muted'}>
              {items.length} {getLessonCountText(items.length)}
            </Badge>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canCreate}
              title={`Добавить занятие на ${getDayName(dayNumber).toLowerCase()}`}
              aria-label={`Добавить занятие на ${getDayName(dayNumber).toLowerCase()}`}
              onClick={() => onCreate(dayNumber)}
            >
              <FiPlus />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 p-4">
        {items.length === 0 && gradeItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
            {emptyMessage}
          </div>
        ) : null}

        {createScheduleDayEntries(items, lessonPeriodById).map((entry) => {
          if (entry.kind === 'gap') {
            return (
              <div
                key={`gap:${String(entry.lessonPeriod.id)}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 px-3 py-2.5"
              >
                <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <FiClock />
                  {getLessonPeriodLabel(entry.lessonPeriod)}
                </span>

                <Badge variant="muted">Окно</Badge>
              </div>
            )
          }

          const item = entry.item
          const lessonPeriodId = toNumberOrNull(item.lesson_period_id)
          const lessonPeriod = lessonPeriodId === null ? null : lessonPeriodById.get(lessonPeriodId)

          return (
            <div
              key={String(item.id)}
              className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    {renderRelation(item.discipline_id, disciplineNameById)}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <FiClock />
                      {getLessonTimeText(item, lessonPeriod, lessonPeriodNameById)}
                    </span>

                    {item.lesson_type_id ? (
                      <Badge variant="muted">
                        {renderRelation(item.lesson_type_id, lessonTypeNameById)}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  {canEdit ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      title="Редактировать"
                      aria-label="Редактировать занятие"
                      onClick={() => onEdit(item)}
                    >
                      <FiEdit2 />
                    </Button>
                  ) : null}

                  {canDelete ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Удалить безвозвратно"
                      aria-label="Удалить занятие безвозвратно"
                      onClick={() => onDelete(item)}
                    >
                      <FiTrash2 />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-1 text-xs text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-2">
                  <FiUser />
                  {renderRelation(item.teacher_id, teacherNameById)}
                </span>

                <span className="inline-flex items-center gap-2">
                  <FiMapPin />
                  {renderRelation(item.audience_id, audienceNameById)}
                </span>
              </div>
            </div>
          )
        })}

        {gradeItems.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Оценочные элементы
            </p>

            {gradeItems.map((gradeItem) => (
              <div
                key={String(gradeItem.id)}
                className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {String(gradeItem.name ?? 'Оценочный элемент')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {renderRelation(gradeItem.discipline_id, disciplineNameById)} ·{' '}
                      {renderRelation(gradeItem.grade_element_type_id, gradeElementTypeNameById)} ·
                      максимум {String(gradeItem.max_score ?? '—')} баллов
                    </p>
                  </div>

                  <Badge variant="warning">Оценка</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function createItemsByDay(items: AdminCrudRecord[]): Map<number, AdminCrudRecord[]> {
  const result = new Map<number, AdminCrudRecord[]>()

  items.forEach((item) => {
    const dayNumber = toNumberOrNull(item.day_of_week)

    if (dayNumber === null) {
      return
    }

    const dayItems = result.get(dayNumber) ?? []

    dayItems.push(item)
    result.set(dayNumber, dayItems)
  })

  return result
}

type ScheduleDayEntry =
  | {
      kind: 'lesson'
      item: AdminCrudRecord
    }
  | {
      kind: 'gap'
      lessonPeriod: AdminCrudRecord
    }

function createScheduleDayEntries(
  items: AdminCrudRecord[],
  lessonPeriodById: Map<number, AdminCrudRecord>
): ScheduleDayEntry[] {
  const lessonPeriodByNumber = new Map<number, AdminCrudRecord>()

  lessonPeriodById.forEach((lessonPeriod) => {
    const periodNumber = toNumberOrNull(lessonPeriod.number)

    if (periodNumber !== null) {
      lessonPeriodByNumber.set(periodNumber, lessonPeriod)
    }
  })

  const result: ScheduleDayEntry[] = []
  let previousPeriodNumber: number | null = null

  items.forEach((item) => {
    const lessonPeriodId = toNumberOrNull(item.lesson_period_id)
    const lessonPeriod = lessonPeriodId === null ? undefined : lessonPeriodById.get(lessonPeriodId)
    const currentPeriodNumber = toNumberOrNull(lessonPeriod?.number)

    if (currentPeriodNumber !== null) {
      const firstMissingPeriodNumber = previousPeriodNumber === null ? 1 : previousPeriodNumber + 1

      for (
        let missingPeriodNumber = firstMissingPeriodNumber;
        missingPeriodNumber < currentPeriodNumber;
        missingPeriodNumber += 1
      ) {
        const missingLessonPeriod = lessonPeriodByNumber.get(missingPeriodNumber)

        if (missingLessonPeriod) {
          result.push({
            kind: 'gap',
            lessonPeriod: missingLessonPeriod
          })
        }
      }
    }

    result.push({
      kind: 'lesson',
      item
    })

    if (currentPeriodNumber !== null) {
      previousPeriodNumber = currentPeriodNumber
    }
  })

  return result
}

function createGradeItemsByDay(items: AdminCrudRecord[]): Map<number, AdminCrudRecord[]> {
  const result = new Map<number, AdminCrudRecord[]>()

  items.forEach((item) => {
    const dayNumber = toNumberOrNull(item.day_of_week)

    if (dayNumber === null) {
      return
    }

    const dayItems = result.get(dayNumber) ?? []
    dayItems.push(item)
    result.set(dayNumber, dayItems)
  })

  return result
}

function getDayName(dayNumber: number): string {
  return (
    dayOfWeekOptions.find((option) => Number(option.value) === dayNumber)?.label ??
    `${dayNumber} день`
  )
}

function getLessonTimeText(
  item: AdminCrudRecord,
  lessonPeriod: AdminCrudRecord | null | undefined,
  lessonPeriodNameById: Map<number, string>
): string {
  if (lessonPeriod?.starts_at && lessonPeriod?.ends_at) {
    return `${String(lessonPeriod.number ?? '')} пара · ${String(lessonPeriod.starts_at)}–${String(lessonPeriod.ends_at)}`
  }

  return renderRelation(item.lesson_period_id, lessonPeriodNameById)
}

function getLessonPeriodLabel(lessonPeriod: AdminCrudRecord): string {
  const periodNumber = String(lessonPeriod.number ?? '')
  const timeRange =
    lessonPeriod.starts_at && lessonPeriod.ends_at
      ? ` · ${String(lessonPeriod.starts_at)}–${String(lessonPeriod.ends_at)}`
      : ''

  return `${periodNumber} пара${timeRange}`
}

function getLessonPeriodSortValue(
  item: AdminCrudRecord,
  lessonPeriodById: Map<number, AdminCrudRecord>
): number {
  const lessonPeriodId = toNumberOrNull(item.lesson_period_id)

  if (lessonPeriodId === null) {
    return 999
  }

  const lessonPeriod = lessonPeriodById.get(lessonPeriodId)
  const lessonPeriodNumber = toNumberOrNull(lessonPeriod?.number)

  return lessonPeriodNumber ?? lessonPeriodId
}

function renderRelation(value: unknown, labelsById: Map<number, string>): string {
  const id = toNumberOrNull(value)

  if (id === null) {
    return '—'
  }

  return labelsById.get(id) ?? `#${id}`
}

function getLessonCountText(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'пара'
  }

  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return 'пары'
  }

  return 'пар'
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
