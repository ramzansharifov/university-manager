import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import type { AdminCrudRecord, AdminCrudSelectOption } from '../../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../../features/admin-crud'
import { Badge, Button, Card, CardContent } from '../../../shared/ui'
import {
    createEmployeeColumns,
    createEmployeeFields,
    createOptions,
    createOptionsMap,
    createPositionColumns,
    createPositionFields,
    createPositionOptions,
    getRecordName
} from '../../people/config/peopleCrudConfig'
import { organizationColumns, organizationFields } from '../config/universityCrudConfig'

export function UniversityAdministrativeStructureDrilldown() {
    const [selectedDivision, setSelectedDivision] = useState<AdminCrudRecord | null>(null)
    const [selectedPosition, setSelectedPosition] = useState<AdminCrudRecord | null>(null)

    const [employeeStatusOptions, setEmployeeStatusOptions] = useState<AdminCrudSelectOption[]>([])
    const [divisionOptions, setDivisionOptions] = useState<AdminCrudSelectOption[]>([])
    const [positionOptions, setPositionOptions] = useState<AdminCrudSelectOption[]>([])

    const loadOptions = useCallback(async () => {
        const [employeeStatuses, divisions, positions] = await Promise.all([
            window.api.adminCrud.list({
                entity: 'dictionary_items',
                page: 1,
                pageSize: 100,
                filters: { dictionary_key: 'employee_statuses' },
                orderBy: 'sort_order',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'divisions',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            }),
            window.api.adminCrud.list({
                entity: 'positions',
                page: 1,
                pageSize: 100,
                orderBy: 'name',
                orderDirection: 'asc'
            })
        ])

        setEmployeeStatusOptions(createOptions(employeeStatuses.items, getRecordName))
        setDivisionOptions(createOptions(divisions.items, getRecordName))
        setPositionOptions(createPositionOptions(positions.items))
    }, [])

    useEffect(() => {
        void loadOptions()
    }, [loadOptions])

    const divisionNameById = useMemo(() => createOptionsMap(divisionOptions), [divisionOptions])
    const positionNameById = useMemo(() => createOptionsMap(positionOptions), [positionOptions])
    const employeeStatusNameById = useMemo(
        () => createOptionsMap(employeeStatusOptions),
        [employeeStatusOptions]
    )

    const fieldOptions = useMemo(
        () => ({
            studentStatusOptions: [],
            teacherStatusOptions: [],
            employeeStatusOptions,
            departmentOptions: [],
            divisionOptions,
            positionOptions
        }),
        [divisionOptions, employeeStatusOptions, positionOptions]
    )

    const columnMaps = useMemo(
        () => ({
            studentStatusNameById: new Map<number, string>(),
            teacherStatusNameById: new Map<number, string>(),
            employeeStatusNameById,
            departmentNameById: new Map<number, string>(),
            divisionNameById,
            positionNameById
        }),
        [divisionNameById, employeeStatusNameById, positionNameById]
    )

    const positionFields = useMemo(
        () => createPositionFields(fieldOptions).filter((field) => field.key !== 'division_id'),
        [fieldOptions]
    )

    const positionColumns = useMemo(
        () => createPositionColumns(columnMaps).filter((column) => column.key !== 'division_id'),
        [columnMaps]
    )

    const employeeFields = useMemo(
        () =>
            createEmployeeFields(fieldOptions).filter(
                (field) => field.key !== 'division_id' && field.key !== 'position_id'
            ),
        [fieldOptions]
    )

    const employeeColumns = useMemo(
        () =>
            createEmployeeColumns(columnMaps).filter(
                (column) => column.key !== 'division_id' && column.key !== 'position_id'
            ),
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

    const employeeFilters = useMemo(
        () =>
            selectedDivision && selectedPosition
                ? {
                    division_id: Number(selectedDivision.id),
                    position_id: Number(selectedPosition.id)
                }
                : undefined,
        [selectedDivision, selectedPosition]
    )

    const employeeFixedData = useMemo(
        () =>
            selectedDivision && selectedPosition
                ? {
                    division_id: Number(selectedDivision.id),
                    position_id: Number(selectedPosition.id)
                }
                : undefined,
        [selectedDivision, selectedPosition]
    )

    function openDivision(record: AdminCrudRecord) {
        setSelectedDivision(record)
        setSelectedPosition(null)
    }

    function openPosition(record: AdminCrudRecord) {
        setSelectedPosition(record)
    }

    function backToDivisions() {
        setSelectedDivision(null)
        setSelectedPosition(null)
    }

    function backToPositions() {
        setSelectedPosition(null)
    }

    return (
        <div className="grid gap-4">
            <AdministrativeBreadcrumb
                division={selectedDivision}
                position={selectedPosition}
                onDivisionsClick={backToDivisions}
                onPositionsClick={selectedDivision ? backToPositions : undefined}
            />

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

            {selectedDivision && !selectedPosition ? (
                <AdminCrudEntityPanel
                    entity="positions"
                    title={`Должности: ${getRecordName(selectedDivision)}`}
                    description="Должности выбранного подразделения. Клик по должности откроет список сотрудников."
                    createButtonLabel="Добавить должность"
                    fields={positionFields}
                    columns={positionColumns}
                    filters={positionFilters}
                    fixedData={positionFixedData}
                    emptyMessage="У этого подразделения пока нет должностей."
                    onAfterMutation={loadOptions}
                    onRowClick={openPosition}
                    extraRowActions={(record) => (
                        <Button
                            size="sm"
                            variant="primary"
                            title="Открыть сотрудников"
                            aria-label="Открыть сотрудников по должности"
                            onClick={() => openPosition(record)}
                        >
                            <FiArrowRight />
                        </Button>
                    )}
                />
            ) : null}

            {selectedDivision && selectedPosition ? (
                <AdminCrudEntityPanel
                    entity="employees"
                    title={`Сотрудники: ${getRecordName(selectedPosition)}`}
                    description={`Сотрудники подразделения «${getRecordName(selectedDivision)}» с выбранной должностью.`}
                    createButtonLabel="Добавить сотрудника"
                    fields={employeeFields}
                    columns={employeeColumns}
                    filters={employeeFilters}
                    fixedData={employeeFixedData}
                    emptyMessage="На этой должности пока нет сотрудников."
                    onAfterMutation={loadOptions}
                />
            ) : null}
        </div>
    )
}

function AdministrativeBreadcrumb({
    division,
    position,
    onDivisionsClick,
    onPositionsClick
}: {
    division: AdminCrudRecord | null
    position: AdminCrudRecord | null
    onDivisionsClick: () => void
    onPositionsClick?: () => void
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
                        <Button
                            size="sm"
                            variant={position ? 'secondary' : 'primary'}
                            onClick={onPositionsClick}
                        >
                            Должности
                        </Button>
                        <Badge>{getRecordName(division)}</Badge>
                    </>
                ) : null}

                {position ? (
                    <>
                        <span className="text-sm text-[var(--color-text-muted)]">/</span>
                        <Badge>{getRecordName(position)}</Badge>
                    </>
                ) : null}
            </CardContent>
        </Card>
    )
}