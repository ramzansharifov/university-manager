import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArchive, FiClock, FiEdit2, FiMapPin, FiRefreshCcw, FiUser } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
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

export function ScheduleItemsDrilldown() {
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedWeekId, setSelectedWeekId] = useState('')

  const [faculties, setFaculties] = useState<AdminCrudRecord[]>([])
  const [specialties, setSpecialties] = useState<AdminCrudRecord[]>([])
  const [groups, setGroups] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [weeks, setWeeks] = useState<AdminCrudRecord[]>([])
  const [lessonPeriods, setLessonPeriods] = useState<AdminCrudRecord[]>([])

  const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])
  const [weekOptions, setWeekOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [audienceOptions, setAudienceOptions] = useState<AdminCrudSelectOption[]>([])
  const [lessonTypeOptions, setLessonTypeOptions] = useState<AdminCrudSelectOption[]>([])

  const loadOptions = useCallback(async () => {
    const [
      facultiesResult,
      specialtiesResult,
      groupsResult,
      subjectsResult,
      disciplinesResult,
      semestersResult,
      weeksResult,
      academicYearsResult,
      lessonPeriodsResult,
      teachersResult,
      audiencesResult,
      lessonTypesResult
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
        entity: 'academic_years',
        page: 1,
        pageSize: 100,
        orderBy: 'name',
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
      })
    ])

    setFaculties(facultiesResult.items)
    setSpecialties(specialtiesResult.items)
    setGroups(groupsResult.items)
    setSubjects(subjectsResult.items)
    setDisciplines(disciplinesResult.items)
    setLessonPeriods(lessonPeriodsResult.items)

    setSemesterOptions(createOptions(semestersResult.items, getSemesterName))

    const availableWeeks = await ensureWeeksForSemesters({
      semesters: semestersResult.items,
      existingWeeks: weeksResult.items,
      academicYears: academicYearsResult.items
    })

    setWeeks(availableWeeks)
    setWeekOptions(createWeekOptions(availableWeeks))
    setTeacherOptions(createOptions(teachersResult.items, getPersonName))
    setAudienceOptions(createOptions(audiencesResult.items, getRecordName))
    setLessonTypeOptions(createOptions(lessonTypesResult.items, getRecordName))
  }, [])

  useEffect(() => {
    void loadOptions()
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

  const availableWeekOptions = useMemo(() => {
    if (!selectedGroup) {
      return []
    }

    if (selectedGroupSemesterIds.size === 0) {
      return []
    }

    return weekOptions.filter((weekOption) => {
      const semesterId = toNumberOrNull(weekOption.meta?.semester_id)

      return semesterId !== null && selectedGroupSemesterIds.has(semesterId)
    })
  }, [selectedGroup, selectedGroupSemesterIds, weekOptions])

  useEffect(() => {
    if (!selectedGroupId) {
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
  }, [availableWeekOptions, selectedGroupId, selectedWeekId])

  const subjectNameById = useMemo(() => createOptionsMap(subjectOptions), [subjectOptions])
  const groupNameById = useMemo(() => createOptionsMap(allGroupOptions), [allGroupOptions])

  const disciplineOptions = useMemo(
    () =>
      createDisciplineOptions(selectedGroupDisciplines, {
        subjectNameById,
        groupNameById
      }),
    [groupNameById, selectedGroupDisciplines, subjectNameById]
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
  const dayOfWeekNameById = useMemo(() => createOptionsMap(dayOfWeekOptions), [])
  const weekTypeNameByValue = useMemo(() => createWeekTypeMap(), [])

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
    if (!selectedGroupId || !selectedWeekId) {
      return undefined
    }

    return {
      group_id: Number(selectedGroupId),
      week_id: Number(selectedWeekId)
    }
  }, [selectedGroupId, selectedWeekId])

  const scheduleFixedData = useMemo(() => {
    if (!selectedGroupId || !selectedWeekId) {
      return undefined
    }

    return {
      group_id: Number(selectedGroupId),
      week_id: Number(selectedWeekId)
    }
  }, [selectedGroupId, selectedWeekId])

  function handleFacultyChange(value: string) {
    setSelectedFacultyId(value)
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedWeekId('')
  }

  function handleSpecialtyChange(value: string) {
    setSelectedSpecialtyId(value)
    setSelectedGroupId('')
    setSelectedWeekId('')
  }

  function handleGroupChange(value: string) {
    setSelectedGroupId(value)
    setSelectedWeekId('')
  }

  function resetFilters() {
    setSelectedFacultyId('')
    setSelectedSpecialtyId('')
    setSelectedGroupId('')
    setSelectedWeekId('')
  }

  const canShowSchedule = Boolean(selectedGroup && selectedWeek)
  const canCreateScheduleItem = canShowSchedule && selectedGroupDisciplines.length > 0

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Расписание занятий</CardTitle>
              <CardDescription>
                Выбери неделю, факультет, специальность и группу. Ниже расписание будет показано
                карточками по дням недели.
              </CardDescription>
            </div>

            <Button variant="secondary" onClick={resetFilters}>
              <FiRefreshCcw />
              Сбросить фильтры
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 xl:grid-cols-4">
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
              label="Неделя"
              value={selectedWeekId}
              placeholder={selectedGroupId ? 'Выбери неделю' : 'Сначала группу'}
              options={availableWeekOptions}
              disabled={!selectedGroupId || availableWeekOptions.length === 0}
              onChange={setSelectedWeekId}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {selectedFaculty ? <Badge>{getRecordName(selectedFaculty)}</Badge> : null}
            {selectedSpecialty ? <Badge>{getRecordName(selectedSpecialty)}</Badge> : null}
            {selectedGroup ? <Badge>{getRecordName(selectedGroup)}</Badge> : null}
            {selectedWeek ? <Badge>{weekNameById.get(Number(selectedWeek.id))}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {!canShowSchedule ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Выбери факультет, специальность, группу и неделю.
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
          onAfterMutation={loadOptions}
          renderItems={({
            items,
            isLoading,
            emptyMessage,
            canEdit,
            canArchive,
            openEditDialog,
            requestArchive
          }) => (
            <ScheduleWeekBoard
              items={items}
              isLoading={isLoading}
              emptyMessage={emptyMessage}
              canEdit={canEdit}
              canArchive={canArchive}
              lessonPeriodById={lessonPeriodById}
              lessonPeriodNameById={lessonPeriodNameById}
              disciplineNameById={disciplineNameById}
              teacherNameById={teacherNameById}
              audienceNameById={audienceNameById}
              lessonTypeNameById={lessonTypeNameById}
              onEdit={openEditDialog}
              onArchive={requestArchive}
            />
          )}
        />
      ) : null}
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
}) {
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

function ScheduleWeekBoard({
  items,
  isLoading,
  emptyMessage,
  canEdit,
  canArchive,
  lessonPeriodById,
  lessonPeriodNameById,
  disciplineNameById,
  teacherNameById,
  audienceNameById,
  lessonTypeNameById,
  onEdit,
  onArchive
}: {
  items: AdminCrudRecord[]
  isLoading: boolean
  emptyMessage: string
  canEdit: boolean
  canArchive: boolean
  lessonPeriodById: Map<number, AdminCrudRecord>
  lessonPeriodNameById: Map<number, string>
  disciplineNameById: Map<number, string>
  teacherNameById: Map<number, string>
  audienceNameById: Map<number, string>
  lessonTypeNameById: Map<number, string>
  onEdit: (record: AdminCrudRecord) => void
  onArchive: (record: AdminCrudRecord) => void
}) {
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

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {dayNumbers.map((dayNumber) => (
        <ScheduleDayCard
          key={dayNumber}
          dayNumber={dayNumber}
          items={itemsByDay.get(dayNumber) ?? []}
          emptyMessage={emptyMessage}
          canEdit={canEdit}
          canArchive={canArchive}
          lessonPeriodById={lessonPeriodById}
          lessonPeriodNameById={lessonPeriodNameById}
          disciplineNameById={disciplineNameById}
          teacherNameById={teacherNameById}
          audienceNameById={audienceNameById}
          lessonTypeNameById={lessonTypeNameById}
          onEdit={onEdit}
          onArchive={onArchive}
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
  canArchive,
  lessonPeriodById,
  lessonPeriodNameById,
  disciplineNameById,
  teacherNameById,
  audienceNameById,
  lessonTypeNameById,
  onEdit,
  onArchive
}: {
  dayNumber: number
  items: AdminCrudRecord[]
  emptyMessage: string
  canEdit: boolean
  canArchive: boolean
  lessonPeriodById: Map<number, AdminCrudRecord>
  lessonPeriodNameById: Map<number, string>
  disciplineNameById: Map<number, string>
  teacherNameById: Map<number, string>
  audienceNameById: Map<number, string>
  lessonTypeNameById: Map<number, string>
  onEdit: (record: AdminCrudRecord) => void
  onArchive: (record: AdminCrudRecord) => void
}) {
  return (
    <Card className="min-h-64 overflow-hidden">
      <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{getDayName(dayNumber)}</CardTitle>
          <Badge variant={items.length > 0 ? 'primary' : 'muted'}>
            {items.length} {getLessonCountText(items.length)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 p-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
            {emptyMessage}
          </div>
        ) : null}

        {items.map((item) => {
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

                  {canArchive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Архивировать"
                      aria-label="Архивировать занятие"
                      onClick={() => onArchive(item)}
                    >
                      <FiArchive />
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
