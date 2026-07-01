import { useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import { organizationColumns } from '../../university/config/universityCrudConfig'
import {
  createEmployeeColumns,
  createEmployeeFields,
  createOptionsMap
} from '../config/peopleCrudConfig'
import { getRecordName } from '../lib/getRecordName'

interface EmployeesByDivisionPanelProps {
  employeeStatusOptions: AdminCrudSelectOption[]
  positionOptions: AdminCrudSelectOption[]
}

export function EmployeesByDivisionPanel({
  employeeStatusOptions,
  positionOptions
}: EmployeesByDivisionPanelProps) {
  const [selectedDivision, setSelectedDivision] = useState<AdminCrudRecord | null>(null)

  const employeeFilters = useMemo(
    () => (selectedDivision ? { division_id: Number(selectedDivision.id) } : undefined),
    [selectedDivision]
  )

  const employeeFixedData = useMemo(
    () => (selectedDivision ? { division_id: Number(selectedDivision.id) } : undefined),
    [selectedDivision]
  )

  const filteredPositionOptions = useMemo(() => {
    if (!selectedDivision) {
      return []
    }

    return positionOptions.filter((option) => {
      return String(option.meta?.division_id ?? '') === String(selectedDivision.id)
    })
  }, [positionOptions, selectedDivision])

  const employeeStatusNameById = useMemo(
    () => createOptionsMap(employeeStatusOptions),
    [employeeStatusOptions]
  )

  const positionNameById = useMemo(
    () => createOptionsMap(filteredPositionOptions),
    [filteredPositionOptions]
  )

  const employeeFields = useMemo(
    () =>
      createEmployeeFields({
        studentStatusOptions: [],
        teacherStatusOptions: [],
        employeeStatusOptions,
        departmentOptions: [],
        divisionOptions: [],
        positionOptions: filteredPositionOptions
      })
        .filter((field) => field.key !== 'division_id')
        .map((field) => {
          if (field.key !== 'position_id') {
            return field
          }

          return {
            ...field,
            dependsOn: undefined,
            dependencyPlaceholder: undefined,
            placeholder:
              filteredPositionOptions.length > 0
                ? 'Выбери должность'
                : 'Сначала создай должности для этого подразделения'
          }
        }),
    [employeeStatusOptions, filteredPositionOptions]
  )

  const employeeColumns = useMemo(
    () =>
      createEmployeeColumns({
        studentStatusNameById: new Map(),
        teacherStatusNameById: new Map(),
        employeeStatusNameById,
        departmentNameById: new Map(),
        divisionNameById: new Map(),
        positionNameById
      }).filter((column) => column.key !== 'division_id'),
    [employeeStatusNameById, positionNameById]
  )

  function openDivision(record: AdminCrudRecord) {
    setSelectedDivision(record)
  }

  function backToDivisions() {
    setSelectedDivision(null)
  }

  return (
    <div className="grid gap-4">
      <EmployeesBreadcrumb selectedDivision={selectedDivision} onDivisionsClick={backToDivisions} />

      {!selectedDivision ? (
        <AdminCrudEntityPanel
          entity="divisions"
          title="Подразделения"
          description="Выбери подразделение, чтобы открыть список его сотрудников."
          createButtonLabel="Добавить подразделение"
          fields={[]}
          columns={organizationColumns}
          canCreate={false}
          canEdit={false}
          canArchive={false}
          emptyMessage="Подразделения пока не созданы. Создай их в разделе «Университет → Административная структура»."
          onRowClick={openDivision}
          extraRowActions={(record) => (
            <Button size="sm" variant="primary" onClick={() => openDivision(record)}>
              Открыть
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedDivision ? (
        <AdminCrudEntityPanel
          entity="employees"
          title={`Сотрудники: ${getRecordName(selectedDivision)}`}
          description="Список сотрудников выбранного подразделения."
          createButtonLabel="Добавить сотрудника"
          fields={employeeFields}
          columns={employeeColumns}
          filters={employeeFilters}
          fixedData={employeeFixedData}
          emptyMessage="В этом подразделении пока нет сотрудников."
        />
      ) : null}
    </div>
  )
}

function EmployeesBreadcrumb({
  selectedDivision,
  onDivisionsClick
}: {
  selectedDivision: AdminCrudRecord | null
  onDivisionsClick: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={selectedDivision ? 'secondary' : 'primary'}
          onClick={onDivisionsClick}
        >
          Подразделения
        </Button>

        {selectedDivision ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Badge>{getRecordName(selectedDivision)}</Badge>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
