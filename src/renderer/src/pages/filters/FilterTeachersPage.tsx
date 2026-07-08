import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiEye, FiRefreshCcw, FiUserCheck } from 'react-icons/fi'
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

interface TeacherFilterState {
  teacherId: string
  email: string
  phone: string
  departmentId: string
  statusId: string
  subjectId: string
  birthDate: string
  hireDate: string
}

type TeacherFilterRecord = Record<
  string,
  string | number | boolean | null | Array<string | number | boolean>
>

const initialFilters: TeacherFilterState = {
  teacherId: '',
  email: '',
  phone: '',
  departmentId: '',
  statusId: '',
  subjectId: '',
  birthDate: '',
  hireDate: ''
}

export function FilterTeachersPage() {
  const navigate = useNavigate()

  const [filters, setFilters] = useState<TeacherFilterState>(initialFilters)
  const [departments, setDepartments] = useState<AdminCrudRecord[]>([])
  const [subjects, setSubjects] = useState<AdminCrudRecord[]>([])
  const [teacherStatusOptions, setTeacherStatusOptions] = useState<AdminCrudSelectOption[]>([])
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError(null)

    try {
      const [departmentsResult, subjectsResult, teacherStatusesResult] = await Promise.all([
        window.api.adminCrud.list({
          entity: 'departments',
          page: 1,
          pageSize: 1000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'subjects',
          page: 1,
          pageSize: 2000,
          orderBy: 'name',
          orderDirection: 'asc'
        }),
        window.api.adminCrud.list({
          entity: 'dictionary_items',
          page: 1,
          pageSize: 200,
          filters: { dictionary_key: 'teacher_statuses' },
          orderBy: 'sort_order',
          orderDirection: 'asc'
        })
      ])

      setDepartments(departmentsResult.items)
      setSubjects(subjectsResult.items)
      setTeacherStatusOptions(createOptions(teacherStatusesResult.items, getRecordName))
    } catch (error) {
      setOptionsError(error instanceof Error ? error.message : 'Не удалось загрузить фильтры')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const departmentNameById = useMemo(() => createRecordNameMap(departments), [departments])
  const subjectNameById = useMemo(() => createRecordNameMap(subjects), [subjects])
  const statusNameById = useMemo(
    () => createOptionsMap(teacherStatusOptions),
    [teacherStatusOptions]
  )

  const availableSubjects = useMemo(() => {
    if (!filters.departmentId) {
      return subjects
    }

    return subjects.filter((subject) => {
      return String(subject.department_id ?? '') === filters.departmentId
    })
  }, [filters.departmentId, subjects])

  const teacherCrudFilters = useMemo<TeacherFilterRecord>(() => {
    const result: TeacherFilterRecord = {}

    if (filters.teacherId && Number.isInteger(Number(filters.teacherId))) {
      result.id = Number(filters.teacherId)
    }

    if (filters.departmentId) {
      result.department_id = Number(filters.departmentId)
    }

    if (filters.statusId) {
      result.status_id = Number(filters.statusId)
    }

    if (filters.subjectId) {
      result.teaching_subjects = filters.subjectId
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

  const teacherColumns = useMemo<AdminCrudColumnConfig[]>(
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
        key: 'department_name',
        label: 'Кафедра',
        render: (record) => renderRelation(record.department_id, departmentNameById)
      },
      {
        key: 'teaching_subjects',
        label: 'Преподаёт',
        render: (record) => renderTeachingSubjects(record.teaching_subjects, subjectNameById)
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
    [departmentNameById, statusNameById, subjectNameById]
  )

  function updateFilterField(field: keyof TeacherFilterState, value: string): void {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value === allSelectValue ? '' : value
    }))
  }

  function updateDepartmentFilter(value: string): void {
    const nextValue = value === allSelectValue ? '' : value

    setFilters((currentFilters) => ({
      ...currentFilters,
      departmentId: nextValue,
      subjectId: ''
    }))
  }

  function resetFilters(): void {
    setFilters(initialFilters)
  }

  function openTeacherDetails(record: AdminCrudRecord): void {
    if (!record.id) {
      return
    }

    navigate(`/people/teachers/${String(record.id)}`)
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <FiUserCheck className="h-6 w-6" />
              </div>

              <CardTitle>Расширенный поиск преподавателей</CardTitle>
              <CardDescription>
                Используй точные фильтры ниже, а поиск внутри таблицы — для ФИО, email, телефона,
                предметов и примечаний.
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
              <span className="font-medium text-[var(--color-text)]">ID преподавателя</span>
              <Input
                value={filters.teacherId}
                inputMode="numeric"
                placeholder="Например: 12"
                onChange={(event) => updateFilterField('teacherId', event.target.value)}
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
              label="Кафедра"
              value={filters.departmentId}
              disabled={isLoadingOptions}
              placeholder="Все кафедры"
              options={createOptions(departments, getRecordName)}
              onValueChange={updateDepartmentFilter}
            />

            <FilterSelect
              label="Предмет"
              value={filters.subjectId}
              disabled={isLoadingOptions || availableSubjects.length === 0}
              placeholder="Все предметы"
              options={createOptions(availableSubjects, getRecordName)}
              onValueChange={(value) => updateFilterField('subjectId', value)}
            />

            <FilterSelect
              label="Статус"
              value={filters.statusId}
              disabled={isLoadingOptions}
              placeholder="Все статусы"
              options={teacherStatusOptions}
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
        entity="teachers"
        title="Результаты поиска"
        description="Таблица преподавателей. Клик по строке или кнопка «Карточка» открывает полную карточку преподавателя."
        createButtonLabel="Добавить преподавателя"
        fields={[]}
        columns={teacherColumns}
        filters={teacherCrudFilters}
        canCreate={false}
        canEdit={false}
        canDelete={false}
        orderBy="last_name"
        orderDirection="asc"
        emptyMessage="По выбранным фильтрам преподаватели не найдены."
        onRowClick={openTeacherDetails}
        extraRowActions={(record) => (
          <Button
            size="sm"
            variant="primary"
            title="Открыть карточку"
            aria-label="Открыть карточку преподавателя"
            onClick={() => openTeacherDetails(record)}
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

function renderTeachingSubjects(value: unknown, labelsById: Map<number, string>): string {
  const rawItems = String(value ?? '')
    .split(/\n|,|\/|\+/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (rawItems.length === 0) {
    return '—'
  }

  return rawItems
    .map((item) => {
      const id = toNumberOrNull(item)

      return id === null ? item : (labelsById.get(id) ?? `#${id}`)
    })
    .join(', ')
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
