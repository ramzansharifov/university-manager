import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
  createOptions,
  createOptionsMap,
  createPositionColumns,
  createPositionFields,
  getRecordName
} from '../../people/config/peopleCrudConfig'
import { organizationColumns, organizationFields } from '../config/universityCrudConfig'

export function UniversityAdministrativeStructureDrilldown() {
  const [selectedDivision, setSelectedDivision] = useState<AdminCrudRecord | null>(null)
  const [divisionOptions, setDivisionOptions] = useState<AdminCrudSelectOption[]>([])

  const loadOptions = useCallback(async () => {
    const divisions = await window.api.adminCrud.list({
      entity: 'divisions',
      page: 1,
      pageSize: 100,
      orderBy: 'name',
      orderDirection: 'asc'
    })

    setDivisionOptions(createOptions(divisions.items, getRecordName))
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const divisionNameById = useMemo(() => createOptionsMap(divisionOptions), [divisionOptions])

  const fieldOptions = useMemo(
    () => ({
      studentStatusOptions: [],
      teacherStatusOptions: [],
      employeeStatusOptions: [],
      departmentOptions: [],
      divisionOptions,
      positionOptions: []
    }),
    [divisionOptions]
  )

  const columnMaps = useMemo(
    () => ({
      studentStatusNameById: new Map<number, string>(),
      teacherStatusNameById: new Map<number, string>(),
      employeeStatusNameById: new Map<number, string>(),
      departmentNameById: new Map<number, string>(),
      divisionNameById,
      positionNameById: new Map<number, string>()
    }),
    [divisionNameById]
  )

  const positionFields = useMemo(
    () => createPositionFields(fieldOptions).filter((field) => field.key !== 'division_id'),
    [fieldOptions]
  )

  const positionColumns = useMemo(
    () => createPositionColumns(columnMaps).filter((column) => column.key !== 'division_id'),
    [columnMaps]
  )

  const positionFilters = useMemo(
    () => (selectedDivision ? { division_id: Number(selectedDivision.id) } : undefined),
    [selectedDivision]
  )

  const positionFixedData = useMemo(
    () => (selectedDivision ? { division_id: Number(selectedDivision.id) } : undefined),
    [selectedDivision]
  )

  function openDivision(record: AdminCrudRecord) {
    setSelectedDivision(record)
  }

  function backToDivisions() {
    setSelectedDivision(null)
  }

  return (
    <div className="grid gap-4">
      <AdministrativeBreadcrumb division={selectedDivision} onDivisionsClick={backToDivisions} />

      {!selectedDivision ? (
        <AdminCrudEntityPanel
          entity="divisions"
          title="Подразделения"
          description="Административные подразделения университета: отделы, службы, управления."
          createButtonLabel="Добавить подразделение"
          fields={organizationFields}
          columns={organizationColumns}
          onRowClick={openDivision}
          extraRowActions={(record) => (
            <Button
              size="sm"
              variant="primary"
              title="Открыть должности"
              aria-label="Открыть должности подразделения"
              onClick={() => openDivision(record)}
            >
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedDivision ? (
        <AdminCrudEntityPanel
          entity="positions"
          title={`Должности: ${getRecordName(selectedDivision)}`}
          description="Должности выбранного подразделения. Сотрудники назначаются и редактируются только в разделе «Люди → Сотрудники»."
          createButtonLabel="Добавить должность"
          fields={positionFields}
          columns={positionColumns}
          filters={positionFilters}
          fixedData={positionFixedData}
          emptyMessage="У этого подразделения пока нет должностей."
          onAfterMutation={loadOptions}
        />
      ) : null}
    </div>
  )
}

function AdministrativeBreadcrumb({
  division,
  onDivisionsClick
}: {
  division: AdminCrudRecord | null
  onDivisionsClick: () => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={division ? 'secondary' : 'primary'} onClick={onDivisionsClick}>
          Подразделения
        </Button>

        {division ? (
          <>
            <span className="text-sm text-[var(--color-text-muted)]">/</span>
            <Badge>{getRecordName(division)}</Badge>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
