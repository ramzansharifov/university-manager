import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiEye } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
  createOptionsMap,
  createStudentColumns,
  createStudentFields
} from '../config/peopleCrudConfig'
import { createGroupColumns } from '../../university/config/universityCrudConfig'
import { getRecordName } from '../lib/getRecordName'

interface StudentsByGroupPanelProps {
  studentStatusOptions: AdminCrudSelectOption[]
}

export function StudentsByGroupPanel({ studentStatusOptions }: StudentsByGroupPanelProps) {
  const [selectedGroup, setSelectedGroup] = useState<AdminCrudRecord | null>(null)
  const navigate = useNavigate()
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])
  const [academicYearOptions, setAcademicYearOptions] = useState<AdminCrudSelectOption[]>([])

  const loadTeacherOptions = useCallback(async () => {
    const [teachers, academicYears] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'teachers',
        page: 1,
        pageSize: 500,
        orderBy: 'last_name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'academic_years',
        page: 1,
        pageSize: 500,
        orderBy: 'starts_at',
        orderDirection: 'desc'
      })
    ])

    setTeacherOptions(createPersonOptions(teachers.items))
    setAcademicYearOptions(
      academicYears.items.map((academicYear) => ({
        value: String(academicYear.id),
        label: String(academicYear.name ?? `#${String(academicYear.id)}`)
      }))
    )
  }, [])

  useEffect(() => {
    void loadTeacherOptions()
  }, [loadTeacherOptions])

  const teacherNameByIdForGroups = useMemo(() => createOptionsMap(teacherOptions), [teacherOptions])
  const academicYearNameById = useMemo(
    () => createOptionsMap(academicYearOptions),
    [academicYearOptions]
  )

  const groupColumns = useMemo(
    () => createGroupColumns(teacherNameByIdForGroups, academicYearNameById),
    [academicYearNameById, teacherNameByIdForGroups]
  )

  const studentFilters = useMemo(
    () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
    [selectedGroup]
  )

  const studentFixedData = useMemo(
    () => (selectedGroup ? { group_id: Number(selectedGroup.id) } : undefined),
    [selectedGroup]
  )

  const studentStatusNameById = useMemo(
    () => createOptionsMap(studentStatusOptions),
    [studentStatusOptions]
  )

  const studentFields = useMemo(
    () =>
      createStudentFields({
        studentStatusOptions,
        teacherStatusOptions: [],
        employeeStatusOptions: [],
        departmentOptions: [],
        divisionOptions: [],
        positionOptions: []
      }),
    [studentStatusOptions]
  )

  const studentColumns = useMemo(
    () =>
      createStudentColumns({
        studentStatusNameById,
        teacherStatusNameById: new Map(),
        employeeStatusNameById: new Map(),
        departmentNameById: new Map(),
        divisionNameById: new Map(),
        positionNameById: new Map()
      }),
    [studentStatusNameById]
  )

  function openGroup(record: AdminCrudRecord) {
    setSelectedGroup(record)
  }

  function backToGroups() {
    setSelectedGroup(null)
  }

  function openStudentDetails(record: AdminCrudRecord) {
    if (!record.id) {
      return
    }

    navigate(`/people/students/${String(record.id)}`)
  }

  return (
    <div className="grid gap-4">
      <StudentsBreadcrumb selectedGroup={selectedGroup} onGroupsClick={backToGroups} />

      {!selectedGroup ? (
        <AdminCrudEntityPanel
          entity="student_groups"
          title="Группы"
          description="Выбери учебную группу, чтобы открыть список её студентов."
          createButtonLabel="Добавить группу"
          fields={[]}
          columns={groupColumns}
          canCreate={false}
          canEdit={false}
          canArchive={false}
          emptyMessage="Учебные группы пока не созданы. Создай их в разделе «Университет → Учебная структура»."
          onAfterMutation={loadTeacherOptions}
          onRowClick={openGroup}
          extraRowActions={(record) => (
            <Button size="sm" variant="primary" onClick={() => openGroup(record)}>
              Открыть
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedGroup ? (
        <AdminCrudEntityPanel
          entity="students"
          title={`Студенты: ${getRecordName(selectedGroup)}`}
          description="Список студентов выбранной учебной группы."
          createButtonLabel="Добавить студента"
          fields={studentFields}
          columns={studentColumns}
          filters={studentFilters}
          fixedData={studentFixedData}
          emptyMessage="В этой группе пока нет студентов."
          extraRowActions={(record) => (
            <Button
              size="sm"
              variant="ghost"
              title="Открыть карточку"
              aria-label="Открыть карточку студента"
              onClick={() => openStudentDetails(record)}
            >
              <FiEye />
            </Button>
          )}
        />
      ) : null}
    </div>
  )
}

function createPersonOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: [item.last_name, item.first_name, item.middle_name].filter(Boolean).map(String).join(' ')
  }))
}
function StudentsBreadcrumb({
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
