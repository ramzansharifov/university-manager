import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import { createDepartmentColumns } from '../../university/config/universityCrudConfig'
import {
  createOptionsMap,
  createTeacherColumns,
  createTeacherFields
} from '../config/peopleCrudConfig'
import { getRecordName } from '../lib/getRecordName'

interface TeachersByDepartmentPanelProps {
  teacherStatusOptions: AdminCrudSelectOption[]
}

function createPersonOptions(items: AdminCrudRecord[]): AdminCrudSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: [item.last_name, item.first_name, item.middle_name]
      .filter(Boolean)
      .map(String)
      .join(' ')
  }))
}

export function TeachersByDepartmentPanel({
  teacherStatusOptions
}: TeachersByDepartmentPanelProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<AdminCrudRecord | null>(null)
  const [teacherOptions, setTeacherOptions] = useState<AdminCrudSelectOption[]>([])

  const loadTeacherOptions = useCallback(async () => {
    const teachers = await window.api.adminCrud.list({
      entity: 'teachers',
      page: 1,
      pageSize: 500,
      orderBy: 'last_name',
      orderDirection: 'asc'
    })

    setTeacherOptions(createPersonOptions(teachers.items))
  }, [])

  useEffect(() => {
    void loadTeacherOptions()
  }, [loadTeacherOptions])

  const teacherNameByIdForDepartments = useMemo(
    () => createOptionsMap(teacherOptions),
    [teacherOptions]
  )

  const departmentColumns = useMemo(
    () => createDepartmentColumns(teacherNameByIdForDepartments),
    [teacherNameByIdForDepartments]
  )

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
          onAfterMutation={loadTeacherOptions}
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
