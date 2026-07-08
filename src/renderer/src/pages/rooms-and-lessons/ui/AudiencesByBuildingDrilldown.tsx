import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type {
  AdminCrudFieldConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
  buildingColumns,
  buildingFields,
  createAudienceColumns,
  createAudienceFields,
  createOptions,
  createOptionsMap,
  getRecordName
} from '../../schedule/config/scheduleCrudConfig'

export function AudiencesByBuildingDrilldown(): ReactElement {
  const [selectedBuilding, setSelectedBuilding] = useState<AdminCrudRecord | null>(null)
  const [audienceTypeOptions, setAudienceTypeOptions] = useState<AdminCrudSelectOption[]>([])
  const [buildingOptions, setBuildingOptions] = useState<AdminCrudSelectOption[]>([])

  const selectedBuildingId = selectedBuilding ? Number(selectedBuilding.id) : null

  const loadRelationOptions = useCallback(async () => {
    const [audienceTypes, buildings] = await Promise.all([
      window.api.adminCrud.list({
        entity: 'audience_types',
        page: 1,
        pageSize: 100,
        orderBy: 'name',
        orderDirection: 'asc'
      }),
      window.api.adminCrud.list({
        entity: 'buildings',
        page: 1,
        pageSize: 100,
        orderBy: 'name',
        orderDirection: 'asc'
      })
    ])

    setAudienceTypeOptions(createOptions(audienceTypes.items, getRecordName))
    setBuildingOptions(createOptions(buildings.items, getRecordName))
  }, [])

  useEffect(() => {
    void loadRelationOptions()
  }, [loadRelationOptions])

  const audienceTypeNameById = useMemo(
    () => createOptionsMap(audienceTypeOptions),
    [audienceTypeOptions]
  )

  const buildingNameById = useMemo(() => createOptionsMap(buildingOptions), [buildingOptions])

  const audienceFields = useMemo<AdminCrudFieldConfig[]>(() => {
    return createAudienceFields({
      audienceTypeOptions,
      buildingOptions
    }).map((field) => {
      if (field.key !== 'building_id') {
        return field
      }

      return {
        ...field,
        required: false,
        hidden: selectedBuildingId !== null,
        defaultValue: selectedBuildingId !== null ? String(selectedBuildingId) : field.defaultValue
      }
    })
  }, [audienceTypeOptions, buildingOptions, selectedBuildingId])

  const audienceColumns = useMemo(
    () =>
      createAudienceColumns({
        audienceTypeNameById,
        buildingNameById
      }),
    [audienceTypeNameById, buildingNameById]
  )

  const audienceFilters = useMemo(
    () => (selectedBuildingId !== null ? { building_id: selectedBuildingId } : undefined),
    [selectedBuildingId]
  )

  const audienceFixedData = useMemo(
    () =>
      selectedBuildingId !== null
        ? ({ building_id: selectedBuildingId } as AdminCrudRecord)
        : undefined,
    [selectedBuildingId]
  )

  function openBuilding(record: AdminCrudRecord): void {
    setSelectedBuilding(record)
  }

  function backToBuildings(): void {
    setSelectedBuilding(null)
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={selectedBuilding ? 'secondary' : 'primary'}
            onClick={backToBuildings}
          >
            Корпуса
          </Button>

          {selectedBuilding ? (
            <>
              <BreadcrumbSeparator />
              <Badge>{getRecordName(selectedBuilding)}</Badge>
            </>
          ) : null}
        </CardContent>
      </Card>

      {!selectedBuilding ? (
        <AdminCrudEntityPanel
          entity="buildings"
          title="Корпуса"
          description="Выбери корпус, чтобы перейти к аудиториям внутри него. Можно кликнуть по строке или нажать «Открыть»."
          createButtonLabel="Добавить корпус"
          fields={buildingFields}
          columns={buildingColumns}
          emptyMessage="Корпуса пока не созданы."
          orderBy="name"
          orderDirection="asc"
          onAfterMutation={loadRelationOptions}
          onRowClick={openBuilding}
          extraRowActions={(record) => (
            <Button size="sm" variant="primary" onClick={() => openBuilding(record)}>
              Открыть
              <FiArrowRight />
            </Button>
          )}
        />
      ) : null}

      {selectedBuilding ? (
        <AdminCrudEntityPanel
          entity="audiences"
          title={`Аудитории: ${getRecordName(selectedBuilding)}`}
          description="Аудитории, помещения и площадки выбранного корпуса. Этаж определяется автоматически по первой цифре номера."
          createButtonLabel="Добавить аудиторию"
          fields={audienceFields}
          columns={audienceColumns}
          filters={audienceFilters}
          fixedData={audienceFixedData}
          emptyMessage="В этом корпусе пока нет аудиторий."
          orderBy="name"
          orderDirection="asc"
          onAfterMutation={loadRelationOptions}
        />
      ) : null}
    </div>
  )
}

function BreadcrumbSeparator(): ReactElement {
  return <span className="text-sm text-[var(--color-text-muted)]">/</span>
}
