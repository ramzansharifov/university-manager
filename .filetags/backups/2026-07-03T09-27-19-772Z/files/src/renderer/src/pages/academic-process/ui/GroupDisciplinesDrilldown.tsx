import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
  createCurriculumItemOptions,
  createDisciplineColumns,
  createDisciplineFields,
  createOptions,
  createOptionsMap,
  getPersonName,
  getRecordName,
  getSemesterName,
  groupSelectorColumns
} from '../config/academicProcessCrudConfig'

export function GroupDisciplinesDrilldown() {
  const [selectedGroup, setSelectedGroup] = useState<AdminCrudRecord | null>(null)

  const [subjectOptions, setSubjectOptions] = useState<AdminCrudSelectOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [semesterOptions, setSemesterOptions] = useState<AdminCrudSelectOption[]>([])

  const [curriculumItems, setCurriculumItems] = useState<AdminCrudRecord[]>([])
  const [curriculumPlans, setCurriculumPlans] = useState<AdminCrudRecord[]>([])
  const [subjectDepartmentIdById, setSubjectDepartmentIdById] = useState<Map<number, number>>(
    new Map()
  )
  const [departmentFacultyIdById, setDepartmentFacultyIdById] = useState<Map<number, number>>(
    new Map()
  )

  const loadOptions = useCallback(async () => {
    const [
      subjects,
      teachers,
      semesters,
      curriculumItemsResult,
      curriculumPlansResult,
      departments
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
      })
    ])

    const nextDepartmentFacultyIdById = createDepartmentFacultyMap(departments.items)
    const nextSubjectDepartmentIdById = createSubjectDepartmentMap(subjects.items)

    setSubjectOptions(createOptions(subjects.items, getRecordName))
    setTeacherOptions(createTeacherOptions(teachers.items, nextDepartmentFacultyIdById, subjects.items))
    setSemesterOptions(createOptions(semesters.items, getSemesterName))
    setCurriculumItems(curriculumItemsResult.items)
    setCurriculumPlans(curriculumPlansResult.items)
    setSubjectDepartmentIdById(nextSubjectDepartmentIdById)
    setDepartmentFacultyIdById(nextDepartmentFacultyIdById)
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const subjectNameById = useMemo(() => createOptionsMap(subjectOptions), [subjectOptions])
  const teacherNameById = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
  const semesterNameById = useMemo(() => createOptionsMap(semesterOptions), [semesterOptions])

  const curriculumItemOptions = useMemo(() => {
    const allowedPlanIds = selectedGroup
      ? new Set(
          curriculumPlans
            .filter((plan) => {
              return (
                Number(plan.specialty_id) === Number(selectedGroup.specialty_id) &&
                Number(plan.course) === Number(selectedGroup.course)
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
      departmentFacultyIdById
    })
  }, [
    curriculumItems,
    curriculumPlans,
    departmentFacultyIdById,
    selectedGroup,
    semesterNameById,
    subjectDepartmentIdById,
    subjectNameById
  ])

  const curriculumItemNameById = useMemo(
    () => createOptionsMap(curriculumItemOptions),
    [curriculumItemOptions]
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
        semesterNameById
      }),
    [curriculumItemNameById, semesterNameById, subjectNameById, teacherNameById]
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
          canArchive={false}
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

function createDepartmentFacultyMap(departments: AdminCrudRecord[]): Map<number, number> {
  return new Map(
    departments
      .map((department) => [toNumberOrNull(department.id), toNumberOrNull(department.faculty_id)])
      .filter((entry): entry is [number, number] => entry[0] !== null && entry[1] !== null)
  )
}

function createTeacherOptions(
  teachers: AdminCrudRecord[],
  departmentFacultyIdById: Map<number, number>,
  subjects: AdminCrudRecord[]
): AdminCrudSelectOption[] {
  const subjectIdByDepartmentAndName = createSubjectIdByDepartmentAndName(subjects)

  return teachers.map((teacher) => {
    const departmentId = toNumberOrNull(teacher.department_id)
    const facultyId =
      departmentId === null ? null : (departmentFacultyIdById.get(departmentId) ?? null)
    const subjectId =
      departmentId === null
        ? null
        : (subjectIdByDepartmentAndName.get(
            createDepartmentSubjectKey(departmentId, teacher.teaching_subjects)
          ) ?? null)
    const label = getPersonName(teacher).trim()

    return {
      value: String(teacher.id),
      label: label || `#${String(teacher.id)}`,
      meta: {
        subject_id: subjectId === null ? null : String(subjectId),
        subject_department_id: departmentId === null ? null : String(departmentId),
        subject_faculty_id: facultyId === null ? null : String(facultyId)
      }
    }
  })
}`,
      meta: {
        subject_department_id: departmentId === null ? null : String(departmentId),
        subject_faculty_id: facultyId === null ? null : String(facultyId)
      }
    }
  })
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

function createDepartmentSubjectKey(departmentId: number, subjectName: unknown): string {
  return `${departmentId}:${normalizeSubjectName(subjectName)}`
}

function normalizeSubjectName(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
