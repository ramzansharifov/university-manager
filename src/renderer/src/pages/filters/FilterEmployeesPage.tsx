import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiBriefcase, FiEye, FiRefreshCcw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import type {
  AdminCrudColumnConfig,
  AdminCrudRecord,
  AdminCrudSelectOption
} from '../../features/admin-crud'
import { AdminCrudEntityPanel } from '../../features/admin-crud'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../shared/ui'
import { createOptions, createOptionsMap, getRecordName } from '../people/config/peopleCrudConfig'

const allSelectValue = '__all__'

interface EmployeeFilterState {
  employeeId: string
  email: string
  phone: string
  divisionId: string
  positionId: string
  statusId: string
  birthDate: string
  hireDate: string
}

type EmployeeFilterRecord = Record<
  string,
  string | number | boolean | null | Array<string | number | boolean>
>

const initialFilters: EmployeeFilterState = {
  employeeId: '',
  email: '',
  phone: '',
  divisionId: '',
  positionId: '',
  statusId: '',
  birthDate: '',
  hireDate: ''
}

export function FilterEmployeesPage() {
  const navigate = useNavigate()

  const [filters, setFilters] = useState<EmployeeFilterState>(initialFilters)
  const [divisions, setDivisions] = useState<AdminCrudRecord[]>([])
  const [positions, setPositions] = useState<AdminCrudRecord[]>([])
  const [employeeStatusOptions, setEmployeeStatusOptions] = useState<AdminCrudSelectOption[]>([])
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError(null)

    try {
      const [divisionsResult, positionsResult, employeeStatusesResult] = await Promise.all([
        window.api.adminCrud.list({
          entity: 'divisions',
          page: 1,
          pageSize: 1000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'positions',
          page: 1,
          pageSize: 2000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'dictionary_items',
          page: 1,
          pageSize: 200,
          filters: { dictionary_key: 'employee_statuses' },
          orderBy: 'sort_order',
          orderDirection: 'asc'
        })
      ])

      setDivisions(divisionsResult.items)
      setPositions(positionsResult.items)
      setEmployeeStatusOptions(createOptions(employeeStatusesResult.items, getRecordName))
    } catch (error) {
      setOptionsError(error instanceof Error ? error.message : 'Не удалось загрузить фильтры')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const divisionNameById = useMemo(() => createRecordNameMap(divisions), [divisions])
  const positionNameById = useMemo(() => createRecordNameMap(positions), [positions])
  const statusNameById = useMemo(
    () => createOptionsMap(employeeStatusOptions),
    [employeeStatusOptions]
  )

  const availablePositions = useMemo(() => {
    if (!filters.divisionId) {
      return positions
    }

    return positions.filter((position) => {
      return String(position.division_id ?? '') === filters.divisionId
    })
  }, [filters.divisionId, positions])

  const employeeCrudFilters = useMemo<EmployeeFilterRecord>(() => {
    const result: EmployeeFilterRecord = {}

    if (filters.employeeId && Number.isInteger(Number(filters.employeeId))) {
      result.id = Number(filters.employeeId)
    }

    if (filters.divisionId) {
      result.division_id = Number(filters.divisionId)
    }

    if (filters.positionId) {
      result.position_id = Number(filters.positionId)
    }

    if (filters.statusId) {
      result.status_id = Number(filters.statusId)
    }

    if (filters.email.trim()) {
      result.email = filters.email.trim()
    }

    if (filters.phone.trim()) {
      result.phone = filters.phone.trim()
    }

    if (filters.birthDate) {
      result.birth_date = filters.birthDate
    }

    if (filters.hireDate) {
      result.hire_date = filters.hireDate
    }

    return result
  }, [filters])

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((value) => value.trim() !== '').length
  }, [filters])

  const employeeColumns = useMemo<AdminCrudColumnConfig[]>(
    () => [
      {
        key: 'id',
        label: 'ID'
      },
      {
        key: 'full_name',
        label: 'ФИО',
        render: (record) => getPersonName(record)
      },
      {
        key: 'status_name',
        label: 'Статус',
        render: (record) => renderRelation(record.status_id, statusNameById)
      },
      {
        key: 'division_name',
        label: 'Подразделение',
        render: (record) => renderRelation(record.division_id, divisionNameById)
      },
      {
        key: 'position_name',
        label: 'Должность',
        render: (record) => renderRelation(record.position_id, positionNameById)
      },
      {
        key: 'email',
        label: 'Email'
      },
      {
        key: 'phone',
        label: 'Телефон'
      },
      {
        key: 'hire_date',
        label: 'Дата приёма'
      }
    ],
    [divisionNameById, positionNameById, statusNameById]
  )

  function updateFilterField(field: keyof EmployeeFilterState, value: string): void {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value === allSelectValue ? '' : value
    }))
  }

  function updateDivisionFilter(value: string): void {
    const nextValue = value === allSelectValue ? '' : value

    setFilters((currentFilters) => ({
      ...currentFilters,
      divisionId: nextValue,
      positionId: ''
    }))
  }

  function resetFilters(): void {
    setFilters(initialFilters)
  }

  function openEmployeeDetails(record: AdminCrudRecord): void {
    if (!record.id) {
      return
    }

    navigate(`/people/employees/${String(record.id)}`)
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <FiBriefcase className="h-6 w-6" />
              </div>

              <CardTitle>Расширенный поиск сотрудников</CardTitle>
              <CardDescription>
                Используй точные фильтры ниже, а поиск внутри таблицы — для ФИО, email, телефона,
                адреса и примечаний.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={activeFilterCount > 0 ? 'default' : 'muted'}>
                Активных фильтров: {activeFilterCount}
              </Badge>

              <Button
                type="button"
                variant="secondary"
                disabled={activeFilterCount === 0}
                onClick={resetFilters}
              >
                <FiRefreshCcw />
                Сбросить
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {optionsError ? (
            <div className="mb-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              {optionsError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">ID сотрудника</span>
              <Input
                value={filters.employeeId}
                inputMode="numeric"
                placeholder="Например: 12"
                onChange={(event) => updateFilterField('employeeId', event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">Email</span>
              <Input
                value={filters.email}
                placeholder="Точный email"
                onChange={(event) => updateFilterField('email', event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">Телефон</span>
              <Input
                value={filters.phone}
                placeholder="Точный телефон"
                onChange={(event) => updateFilterField('phone', event.target.value)}
              />
            </label>

            <FilterSelect
              label="Подразделение"
              value={filters.divisionId}
              disabled={isLoadingOptions}
              placeholder="Все подразделения"
              options={createOptions(divisions, getRecordName)}
              onValueChange={updateDivisionFilter}
            />

            <FilterSelect
              label="Должность"
              value={filters.positionId}
              disabled={isLoadingOptions || availablePositions.length === 0}
              placeholder="Все должности"
              options={createOptions(availablePositions, getRecordName)}
              onValueChange={(value) => updateFilterField('positionId', value)}
            />

            <FilterSelect
              label="Статус"
              value={filters.statusId}
              disabled={isLoadingOptions}
              placeholder="Все статусы"
              options={employeeStatusOptions}
              onValueChange={(value) => updateFilterField('statusId', value)}
            />

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">Дата рождения</span>
              <Input
                value={filters.birthDate}
                type="date"
                onChange={(event) => updateFilterField('birthDate', event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--color-text)]">Дата приёма</span>
              <Input
                value={filters.hireDate}
                type="date"
                onChange={(event) => updateFilterField('hireDate', event.target.value)}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <AdminCrudEntityPanel
        entity="employees"
        title="Результаты поиска"
        description="Таблица сотрудников. Клик по строке или кнопка «Карточка» открывает полную карточку сотрудника."
        createButtonLabel="Добавить сотрудника"
        fields={[]}
        columns={employeeColumns}
        filters={employeeCrudFilters}
        canCreate={false}
        canEdit={false}
        canDelete={false}
        orderBy="last_name"
        orderDirection="asc"
        emptyMessage="По выбранным фильтрам сотрудники не найдены."
        onRowClick={openEmployeeDetails}
        extraRowActions={(record) => (
          <Button
            size="sm"
            variant="primary"
            title="Открыть карточку"
            aria-label="Открыть карточку сотрудника"
            onClick={() => openEmployeeDetails(record)}
          >
            <FiEye />
            Карточка
          </Button>
        )}
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  disabled,
  onValueChange
}: {
  label: string
  value: string
  placeholder: string
  options: AdminCrudSelectOption[]
  disabled?: boolean
  onValueChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--color-text)]">{label}</span>
      <Select value={value || allSelectValue} disabled={disabled} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={allSelectValue}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

function createRecordNameMap(records: AdminCrudRecord[]): Map<number, string> {
  return new Map(
    records
      .map((record) => [toNumberOrNull(record.id), getRecordName(record)] as const)
      .filter((entry): entry is readonly [number, string] => entry[0] !== null)
  )
}

function getPersonName(record: AdminCrudRecord): string {
  const fullName = [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
    .trim()

  return fullName || `#${String(record.id ?? '')}`
}

function renderRelation(value: unknown, labelsById: Map<number, string>): string {
  const id = toNumberOrNull(value)

  if (id === null) {
    return '—'
  }

  return labelsById.get(id) ?? `#${id}`
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}
