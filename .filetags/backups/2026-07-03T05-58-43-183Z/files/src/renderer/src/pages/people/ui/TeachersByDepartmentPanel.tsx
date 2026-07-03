import { useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
  createOptionsMap,
  createTeacherColumns,
  createTeacherFields
} from '../config/peopleCrudConfig'
import { getRecordName } from '../lib/getRecordName'

interface TeachersByDepartmentPanelProps {
  teacherStatusOptions: AdminCrudSelectOption[]
}

const departmentColumns = [
  {
    key: 'id',
    label: 'ID'
  },
  {
    key: 'name',
    label: 'Кафедра'
  },
  {
    key: 'short_name',
    label: 'Краткое название'
  },
  {
    key: 'description',
    label: 'Описание'
  }
]

export function TeachersByDepartmentPanel({
  teacherStatusOptions
}: TeachersByDepartmentPanelProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<AdminCrudRecord | null>(null)

  const teacherFilters = useMemo(
    () => (selectedDepartment ? { department_id: Number(selectedDepartment.id) } : undefined),
    [selectedDepartment]
  )

  const teacherFixedData = useMemo(
    () => (selectedDepartment ? { department_id: Number(selectedDepartment.id) } : undefined),
    [selectedDepartment]
  )

  const teacherStatusNameById = useMemo(
    () => createOptionsMap(teacherStatusOptions),
    [teacherStatusOptions]
  )

  const teacherFields = useMemo(
    () =>
      createTeacherFields({
        studentStatusOptions: [],
        teacherStatusOptions,
        employeeStatusOptions: [],
        departmentOptions: [],
        divisionOptions: [],
        positionOptions: []
      }).filter((field) => field.key !== 'department_id'),
    [teacherStatusOptions]
  )

  const teacherColumns = useMemo(
    () =>
      createTeacherColumns({
        studentStatusNameById: new Map(),
        teacherStatusNameById,
        employeeStatusNameById: new Map(),
        departmentNameById: new Map(),
        divisionNameById: new Map(),
        positionNameById: new Map()
      }).filter((column) => column.key !== 'department_id'),
    [teacherStatusNameById]
  )

  function openDepartment(record: AdminCrudRecord) {
    setSelectedDepartment(record)
  }

  function backToDepartments() {
    setSelectedDepartment(null)
  }

  return (
    <div className="grid gap-4">
      <TeachersBreadcrumb
        selectedDepartment={selectedDepartment}
        onDepartmentsClick={backToDepartments}
      />

      {!selectedDepartment ? (
        <AdminCrudEntityPanel
          entity="departments"
          title="Кафедры"
          description="Выбери кафедру, чтобы открыть список её преподавателей."
          createButtonLabel="Добавить кафедру"
          fields={[]}
          columns={departmentColumns}
          canCreate={false}
          canEdit={false}
          canArchive={false}
          emptyMessage="Кафедры пока не созданы. Создай их в разделе «Университет → Учебная структура»."
          onRowClick={openDepartment}
          extraRowActions={(record) => (
            <Button size="sm" variant="primary" onClick={() => openDepartment(record)}>
              Открыть
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedDepartment ? (
        <AdminCrudEntityPanel
          entity="teachers"
          title={`Преподаватели: ${getRecordName(selectedDepartment)}`}
          description="Список преподавателей выбранной кафедры."
          createButtonLabel="Добавить преподавателя"
          fields={teacherFields}
          columns={teacherColumns}
          filters={teacherFilters}
          fixedData={teacherFixedData}
          emptyMessage="На этой кафедре пока нет преподавателей."
        />
      ) : null}
    </div>
  )
}

function TeachersBreadcrumb({
  selectedDepartment,
  onDepartmentsClick
}: {
  selectedDepartment: AdminCrudRecord | null
  onDepartmentsClick: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={selectedDepartment ? 'secondary' : 'primary'}
          onClick={onDepartmentsClick}
        >
          Кафедры
        </Button>

        {selectedDepartment ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Badge>{getRecordName(selectedDepartment)}</Badge>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
