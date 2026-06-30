import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
  createDisciplineOptions,
  createGroupScheduleItemColumns,
  createGroupScheduleItemFields,
  createLessonPeriodOptions,
  createOptions,
  createOptionsMap,
  createWeekTypeMap,
  dayOfWeekOptions,
  facultySelectorColumns,
  getPersonName,
  getRecordName,
  getSemesterName,
  scheduleGroupColumns,
  scheduleSpecialtyColumns,
  createWeekOptions
} from '../config/scheduleCrudConfig'

export function ScheduleItemsDrilldown() {
  const [selectedFaculty, setSelectedFaculty] = useState<AdminCrudRecord | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<AdminCrudRecord | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<AdminCrudRecord | null>(null)

  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])

  const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])
  const [weekOptions, setWeekOptions] = useState<AdminCrudSelectOption[]>([])
  const [lessonPeriodOptions, setLessonPeriodOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [audienceOptions, setAudienceOptions] = useState<AdminCrudSelectOption[]>([])
  const [lessonTypeOptions, setLessonTypeOptions] = useState<AdminCrudSelectOption[]>([])
  const [groupOptions, setGroupOptions] = useState<AdminCrudSelectOption[]>([])

  const loadOptions = useCallback(async () => {
    const [
      subjectsResult,
      disciplinesResult,
      semestersResult,
      weeksResult,
      lessonPeriodsResult,
      teachersResult,
      audiencesResult,
      lessonTypesResult,
      groupsResult
    ] = await Promise.all([
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
        entity: 'student_groups',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      })
    ])

    setSubjects(subjectsResult.items)
    setDisciplines(disciplinesResult.items)

    setSemesterOptions(createOptions(semestersResult.items, getSemesterName))
    setWeekOptions(createWeekOptions(weeksResult.items))
    setLessonPeriodOptions(createLessonPeriodOptions(lessonPeriodsResult.items))
    setTeacherOptions(createOptions(teachersResult.items, getPersonName))
    setAudienceOptions(createOptions(audiencesResult.items, getRecordName))
    setLessonTypeOptions(createOptions(lessonTypesResult.items, getRecordName))
    setGroupOptions(createOptions(groupsResult.items, getRecordName))
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const selectedGroupDisciplines = useMemo(() => {
    if (!selectedGroup) {
      return []
    }

    return disciplines.filter(
      (discipline) => Number(discipline.group_id) === Number(selectedGroup.id)
    )
  }, [disciplines, selectedGroup])

  const subjectOptions = useMemo(() => createOptions(subjects, getRecordName), [subjects])
  const subjectNameById = useMemo(() => createOptionsMap(subjectOptions), [subjectOptions])
  const groupNameById = useMemo(() => createOptionsMap(groupOptions), [groupOptions])

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

  const scheduleItemFields = useMemo(
    () =>
      createGroupScheduleItemFields({
        semesterOptions,
        weekOptions,
        lessonPeriodOptions,
        groupOptions,
        disciplineOptions,
        teacherOptions,
        audienceOptions,
        lessonTypeOptions
      }),
    [
      audienceOptions,
      disciplineOptions,
      groupOptions,
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
      weekTypeNameByValue
    ]
  )

  const specialtyFilters = useMemo(
    () => (selectedFaculty ? { faculty_id: Number(selectedFaculty.id) } : undefined),
    [selectedFaculty]
  )

  const groupFilters = useMemo(
    () => (selectedSpecialty ? { specialty_id: Number(selectedSpecialty.id) } : undefined),
    [selectedSpecialty]
  )

  const scheduleFilters = useMemo(
    () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
    [selectedGroup]
  )

  const scheduleFixedData = useMemo(
    () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
    [selectedGroup]
  )

  function openFaculty(record: AdminCrudRecord) {
    setSelectedFaculty(record)
    setSelectedSpecialty(null)
    setSelectedGroup(null)
  }

  function openSpecialty(record: AdminCrudRecord) {
    setSelectedSpecialty(record)
    setSelectedGroup(null)
  }

  function openGroup(record: AdminCrudRecord) {
    setSelectedGroup(record)
  }

  function backToFaculties() {
    setSelectedFaculty(null)
    setSelectedSpecialty(null)
    setSelectedGroup(null)
  }

  function backToSpecialties() {
    setSelectedSpecialty(null)
    setSelectedGroup(null)
  }

  function backToGroups() {
    setSelectedGroup(null)
  }

  return (
    <div className="grid gap-4">
      <ScheduleBreadcrumb
        faculty={selectedFaculty}
        specialty={selectedSpecialty}
        group={selectedGroup}
        onFacultiesClick={backToFaculties}
        onSpecialtiesClick={selectedFaculty ? backToSpecialties : undefined}
        onGroupsClick={selectedSpecialty ? backToGroups : undefined}
      />

      {!selectedFaculty ? (
        <AdminCrudEntityPanel
          entity="faculties"
          title="Факультеты"
          description="Выбери факультет, чтобы открыть специальности."
          createButtonLabel="Добавить факультет"
          fields={[]}
          columns={facultySelectorColumns}
          canCreate={false}
          canEdit={false}
          canArchive={false}
          emptyMessage="Факультеты пока не созданы."
          onRowClick={openFaculty}
          extraRowActions={(record) => (
            <Button
              size="sm"
              variant="primary"
              title="Открыть специальности"
              aria-label="Открыть специальности факультета"
              onClick={() => openFaculty(record)}
            >
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedFaculty && !selectedSpecialty ? (
        <AdminCrudEntityPanel
          entity="specialties"
          title={`Специальности: ${getRecordName(selectedFaculty)}`}
          description="Выбери специальность, чтобы открыть группы."
          createButtonLabel="Добавить специальность"
          fields={[]}
          columns={scheduleSpecialtyColumns}
          filters={specialtyFilters}
          canCreate={false}
          canEdit={false}
          canArchive={false}
          emptyMessage="У этого факультета пока нет специальностей."
          onRowClick={openSpecialty}
          extraRowActions={(record) => (
            <Button
              size="sm"
              variant="primary"
              title="Открыть группы"
              aria-label="Открыть группы специальности"
              onClick={() => openSpecialty(record)}
            >
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedFaculty && selectedSpecialty && !selectedGroup ? (
        <AdminCrudEntityPanel
          entity="student_groups"
          title={`Группы: ${getRecordName(selectedSpecialty)}`}
          description="Выбери группу, чтобы открыть её расписание."
          createButtonLabel="Добавить группу"
          fields={[]}
          columns={scheduleGroupColumns}
          filters={groupFilters}
          canCreate={false}
          canEdit={false}
          canArchive={false}
          emptyMessage="У этой специальности пока нет групп."
          onRowClick={openGroup}
          extraRowActions={(record) => (
            <Button
              size="sm"
              variant="primary"
              title="Открыть расписание"
              aria-label="Открыть расписание группы"
              onClick={() => openGroup(record)}
            >
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedFaculty && selectedSpecialty && selectedGroup ? (
        <AdminCrudEntityPanel
          entity="schedule_items"
          title={`Расписание: ${getRecordName(selectedGroup)}`}
          description="Создание занятий внутри выбранной группы. Группа фиксируется автоматически."
          createButtonLabel="Добавить занятие"
          fields={scheduleItemFields}
          columns={scheduleItemColumns}
          filters={scheduleFilters}
          fixedData={scheduleFixedData}
          emptyMessage="Для этой группы расписание пока не создано."
          orderBy="day_of_week"
          orderDirection="asc"
          onAfterMutation={loadOptions}
        />
      ) : null}

      {selectedGroup && selectedGroupDisciplines.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--color-text-muted)]">
              У выбранной группы пока нет дисциплин. Добавь дисциплины в разделе «Учебный процесс →
              Дисциплины групп».
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function ScheduleBreadcrumb({
  faculty,
  specialty,
  group,
  onFacultiesClick,
  onSpecialtiesClick,
  onGroupsClick
}: {
  faculty: AdminCrudRecord | null
  specialty: AdminCrudRecord | null
  group: AdminCrudRecord | null
  onFacultiesClick: () => void
  onSpecialtiesClick?: () => void
  onGroupsClick?: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={faculty ? 'secondary' : 'primary'} onClick={onFacultiesClick}>
          Факультеты
        </Button>

        {faculty ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Button
              size="sm"
              variant={specialty ? 'secondary' : 'primary'}
              onClick={onSpecialtiesClick}
            >
              Специальности
            </Button>
            <Badge>{getRecordName(faculty)}</Badge>
          </>
        ) : null}

        {specialty ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Button size="sm" variant={group ? 'secondary' : 'primary'} onClick={onGroupsClick}>
              Группы
            </Button>
            <Badge>{getRecordName(specialty)}</Badge>
          </>
        ) : null}

        {group ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Badge>{getRecordName(group)}</Badge>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
