import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { resolveGroupAcademicYearId } from '../../../shared/lib/academicYear'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import { createDisciplineProgressMap } from '../lib/disciplineProgress'
import type { DepartmentFacultyScope } from '../config/academicProcessCrudConfig'
import {
  createCurriculumItemOptions,
  createDisciplineColumns,
  createDisciplineFields,
  createGroupSelectorColumns,
  createOptions,
  createOptionsMap,
  getPersonName,
  getRecordName,
  getSemesterName
} from '../config/academicProcessCrudConfig'

export function GroupDisciplinesDrilldown() {
  const [selectedGroup, setSelectedGroup] = useState<AdminCrudRecord | null>(null)

  const [subjectOptions, setSubjectOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])

  const [disciplines, setDisciplines] = useState<AdminCrudRecord[]>([])
  const [curriculumItems, setCurriculumItems] = useState<AdminCrudRecord[]>([])
  const [curriculumPlans, setCurriculumPlans] = useState<AdminCrudRecord[]>([])
  const [academicYears, setAcademicYears] = useState<AdminCrudRecord[]>([])
  const [scheduleItems, setScheduleItems] = useState<AdminCrudRecord[]>([])
  const [lessonSessions, setLessonSessions] = useState<AdminCrudRecord[]>([])
  const [subjectDepartmentIdById, setSubjectDepartmentIdById] = useState<Map<number, number>>(
    new Map()
  )
  const [departmentFacultyScopeById, setDepartmentFacultyScopeById] = useState<
    Map<number, DepartmentFacultyScope>
  >(new Map())

  const loadOptions = useCallback(async () => {
    const [
      subjects,
      teachers,
      semesters,
      disciplinesResult,
      curriculumItemsResult,
      curriculumPlansResult,
      departments,
      departmentFaculties,
      academicYearsResult,
      scheduleItemsResult,
      lessonSessionsResult
    ] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'subjects',
        page: 1,
        pageSize: 300,
        orderBy: 'name',
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
        entity: 'semesters',
        page: 1,
        pageSize: 100,
        orderBy: 'number',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'disciplines',
        page: 1,
        pageSize: 5000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'curriculum_items',
        page: 1,
        pageSize: 1000,
        orderBy: 'id',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'curriculum_plans',
        page: 1,
        pageSize: 500,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'departments',
        page: 1,
        pageSize: 300,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'department_faculties',
        page: 1,
        pageSize: 5000,
        orderBy: 'id',
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

    const nextDepartmentFacultyScopeById = createDepartmentFacultyScopeMap(
      departments.items,
      departmentFaculties.items
    )
    const nextSubjectDepartmentIdById = createSubjectDepartmentMap(subjects.items)

    setSubjectOptions(createOptions(subjects.items, getRecordName))
    setTeacherOptions(
      createTeacherOptions(teachers.items, nextDepartmentFacultyScopeById, subjects.items)
    )
    setSemesterOptions(createOptions(semesters.items, getSemesterName))
    setDisciplines(disciplinesResult.items)
    setCurriculumItems(curriculumItemsResult.items)
    setCurriculumPlans(curriculumPlansResult.items)
    setAcademicYears(academicYearsResult.items)
    setScheduleItems(scheduleItemsResult.items)
    setLessonSessions(lessonSessionsResult.items)
    setSubjectDepartmentIdById(nextSubjectDepartmentIdById)
    setDepartmentFacultyScopeById(nextDepartmentFacultyScopeById)
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const subjectNameById = useMemo(() => createOptionsMap(subjectOptions), [subjectOptions])
  const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
  const semesterNameById = useMemo(() => createOptionsMap(semesterOptions), [semesterOptions])
  const academicYearNameById = useMemo(
    () =>
      createOptionsMap(
        createOptions(academicYears, (academicYear) => String(academicYear.name ?? academicYear.id))
      ),
    [academicYears]
  )
  const groupSelectorColumns = useMemo(
    () => createGroupSelectorColumns(academicYearNameById),
    [academicYearNameById]
  )
  const selectedGroupAcademicYearId = useMemo(
    () => resolveGroupAcademicYearId(selectedGroup, academicYears),
    [academicYears, selectedGroup]
  )

  const curriculumItemOptions = useMemo(() => {
    const allowedPlanIds = selectedGroup
      ? new Set(
          curriculumPlans
            .filter((plan) => {
              return (
                Number(plan.specialty_id) === Number(selectedGroup.specialty_id) &&
                Number(plan.course) === Number(selectedGroup.course) &&
                Number(plan.academic_year_id) === selectedGroupAcademicYearId
              )
            })
            .map((plan) => Number(plan.id))
        )
      : new Set<number>()

    const availableItems = selectedGroup
      ? curriculumItems.filter((item) => allowedPlanIds.has(Number(item.curriculum_plan_id)))
      : curriculumItems

    return createCurriculumItemOptions(availableItems, {
      subjectNameById,
      semesterNameById,
      subjectDepartmentIdById,
      departmentFacultyScopeById
    })
  }, [
    curriculumItems,
    curriculumPlans,
    departmentFacultyScopeById,
    selectedGroup,
    selectedGroupAcademicYearId,
    semesterNameById,
    subjectDepartmentIdById,
    subjectNameById
  ])

  const curriculumItemNameById = useMemo(
    () => createOptionsMap(curriculumItemOptions),
    [curriculumItemOptions]
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

  const disciplineFields = useMemo(
    () =>
      createDisciplineFields({
        curriculumItemOptions,
        subjectOptions,
        teacherOptions,
        semesterOptions
      }),
    [curriculumItemOptions, semesterOptions, subjectOptions, teacherOptions]
  )

  const disciplineColumns = useMemo(
    () =>
      createDisciplineColumns({
        curriculumItemNameById,
        subjectNameById,
        teacherNameById,
        semesterNameById,
        disciplineProgressById
      }),
    [
      curriculumItemNameById,
      disciplineProgressById,
      semesterNameById,
      subjectNameById,
      teacherNameById
    ]
  )

  const disciplineFilters = useMemo(
    () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
    [selectedGroup]
  )

  const disciplineFixedData = useMemo(
    () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
    [selectedGroup]
  )

  function openGroup(record: AdminCrudRecord) {
    setSelectedGroup(record)
  }

  function backToGroups() {
    setSelectedGroup(null)
  }

  return (
    <div className="grid gap-4">
      <GroupDisciplinesBreadcrumb selectedGroup={selectedGroup} onGroupsClick={backToGroups} />

      {!selectedGroup ? (
        <AdminCrudEntityPanel
          entity="student_groups"
          title="Группы"
          description="Выбери группу, чтобы открыть список её дисциплин."
          createButtonLabel="Добавить группу"
          fields={[]}
          columns={groupSelectorColumns}
          canCreate={false}
          canEdit={false}

          emptyMessage="Группы пока не созданы. Создай их в разделе «Университет → Учебная структура»."
          onRowClick={openGroup}
          extraRowActions={(record) => (
            <Button
              size="sm"
              variant="primary"
              title="Открыть дисциплины"
              aria-label="Открыть дисциплины группы"
              onClick={() => openGroup(record)}
            >
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedGroup ? (
        <AdminCrudEntityPanel
          entity="disciplines"
          title={`Дисциплины: ${getRecordName(selectedGroup)}`}
          description="Выбери пункт учебного плана для курса этой группы — предмет, семестр и название подтянутся автоматически. Преподаватели фильтруются по кафедре предмета."
          createButtonLabel="Добавить дисциплину"
          fields={disciplineFields}
          columns={disciplineColumns}
          filters={disciplineFilters}
          fixedData={disciplineFixedData}
          orderBy="semester_id"
          orderDirection="asc"
          rowGroupBy={(record) => String(record.semester_id ?? 'without_semester')}
          renderRowGroupHeader={(semesterId, records) => (
            <div className="flex items-center justify-between gap-3">
              <span>{getSemesterGroupTitle(semesterId, semesterNameById)}</span>
              <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                {records.length} {getDisciplinesCountText(records.length)}
              </span>
            </div>
          )}
          emptyMessage="У этой группы пока нет дисциплин."
          onAfterMutation={loadOptions}
        />
      ) : null}
    </div>
  )
}

function GroupDisciplinesBreadcrumb({
  selectedGroup,
  onGroupsClick
}: {
  selectedGroup: AdminCrudRecord | null
  onGroupsClick: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={selectedGroup ? 'secondary' : 'primary'} onClick={onGroupsClick}>
          Группы
        </Button>

        {selectedGroup ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Badge>{getRecordName(selectedGroup)}</Badge>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function createSubjectDepartmentMap(subjects: AdminCrudRecord[]): Map<number, number> {
  return new Map(
    subjects
      .map((subject) => [toNumberOrNull(subject.id), toNumberOrNull(subject.department_id)])
      .filter((entry): entry is [number, number] => entry[0] !== null && entry[1] !== null)
  )
}

function createDepartmentFacultyScopeMap(
  departments: AdminCrudRecord[],
  departmentFaculties: AdminCrudRecord[]
): Map<number, DepartmentFacultyScope> {
  const result = new Map<number, DepartmentFacultyScope>()

  departments.forEach((department) => {
    const departmentId = toNumberOrNull(department.id)

    if (departmentId === null) {
      return
    }

    result.set(departmentId, {
      appliesToAllFaculties: Number(department.applies_to_all_faculties) === 1,
      facultyIds: new Set<number>()
    })
  })

  departmentFaculties.forEach((departmentFaculty) => {
    const departmentId = toNumberOrNull(departmentFaculty.department_id)
    const facultyId = toNumberOrNull(departmentFaculty.faculty_id)

    if (departmentId === null || facultyId === null) {
      return
    }

    const currentScope =
      result.get(departmentId) ??
      ({
        appliesToAllFaculties: false,
        facultyIds: new Set<number>()
      } satisfies DepartmentFacultyScope)

    currentScope.facultyIds.add(facultyId)
    result.set(departmentId, currentScope)
  })

  return result
}

function createTeacherOptions(
  teachers: AdminCrudRecord[],
  departmentFacultyScopeById: Map<number, DepartmentFacultyScope>,
  subjects: AdminCrudRecord[]
): AdminCrudSelectOption[] {
  const subjectIdByDepartmentAndName = createSubjectIdByDepartmentAndName(subjects)

  return teachers.flatMap((teacher) => {
    const departmentId = toNumberOrNull(teacher.department_id)
    const facultyScope =
      departmentId === null ? undefined : departmentFacultyScopeById.get(departmentId)
    const facultyIds = getSortedFacultyIds(facultyScope)
    const firstFacultyId = facultyIds[0] ?? null
    const teacherSubjectIds =
      departmentId === null
        ? []
        : getTeacherSubjectIds(
            teacher.teaching_subjects,
            departmentId,
            subjectIdByDepartmentAndName
          )
    const subjectIds = teacherSubjectIds.length > 0 ? teacherSubjectIds : [null]
    const label = getPersonName(teacher).trim() || `#${String(teacher.id)}`

    return subjectIds.map((subjectId) => ({
      value: String(teacher.id),
      label,
      meta: {
        subject_id: subjectId === null ? null : String(subjectId),
        subject_department_id: departmentId === null ? null : String(departmentId),
        subject_faculty_id: firstFacultyId === null ? null : String(firstFacultyId),
        subject_faculty_ids: facultyIds.join(','),
        subject_applies_to_all_faculties: facultyScope?.appliesToAllFaculties ? '1' : '0'
      }
    }))
  })
}

function getSortedFacultyIds(scope: DepartmentFacultyScope | undefined): number[] {
  return Array.from(scope?.facultyIds ?? []).sort((firstId, secondId) => firstId - secondId)
}

function createSubjectIdByDepartmentAndName(subjects: AdminCrudRecord[]): Map<string, number> {
  const result = new Map<string, number>()

  subjects.forEach((subject) => {
    const subjectId = toNumberOrNull(subject.id)
    const departmentId = toNumberOrNull(subject.department_id)

    if (subjectId === null || departmentId === null) {
      return
    }

    result.set(createDepartmentSubjectKey(departmentId, subject.name), subjectId)
  })

  return result
}

function getTeacherSubjectIds(
  teachingSubjects: unknown,
  departmentId: number,
  subjectIdByDepartmentAndName: Map<string, number>
): Array<number | null> {
  const subjectIds = new Set<number>()

  String(teachingSubjects ?? '')
    .split(/[\n,;]+/)
    .map((item) => normalizeSubjectName(item))
    .filter(Boolean)
    .forEach((subjectName) => {
      const subjectId = subjectIdByDepartmentAndName.get(
        createDepartmentSubjectKey(departmentId, subjectName)
      )

      if (subjectId !== undefined) {
        subjectIds.add(subjectId)
      }
    })

  return Array.from(subjectIds)
}

function createDepartmentSubjectKey(departmentId: number, subjectName: unknown): string {
  return `${departmentId}:${normalizeSubjectName(subjectName)}`
}

function normalizeSubjectName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function getSemesterGroupTitle(groupKey: string, semesterNameById: Map<number, string>): string {
  if (groupKey === 'without_semester') {
    return 'Без семестра'
  }

  const semesterId = Number(groupKey)

  if (!Number.isFinite(semesterId)) {
    return groupKey
  }

  return semesterNameById.get(semesterId) ?? `${semesterId} семестр`
}

function getDisciplinesCountText(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'дисциплина'
  }

  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return 'дисциплины'
  }

  return 'дисциплин'
}
