import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { FiArrowLeft, FiBriefcase, FiRefreshCcw, FiUsers } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdminCrudRecord } from '../../features/admin-crud'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../shared/ui'
import { formatDateForDisplay } from '../../shared/lib/date'

interface EmployeeRelatedData {
  status: AdminCrudRecord | null
  division: AdminCrudRecord | null
  position: AdminCrudRecord | null
  coworkers: AdminCrudRecord[]
  positions: AdminCrudRecord[]
}

const emptyRelatedData: EmployeeRelatedData = {
  status: null,
  division: null,
  position: null,
  coworkers: [],
  positions: []
}

export function EmployeeDetailsPage(): ReactElement {
  const { employeeId } = useParams()
  const navigate = useNavigate()

  const [employee, setEmployee] = useState<AdminCrudRecord | null>(null)
  const [relatedData, setRelatedData] = useState<EmployeeRelatedData>(emptyRelatedData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const numericEmployeeId = useMemo(() => Number(employeeId), [employeeId])

  const loadEmployee = useCallback(async () => {
    if (!Number.isFinite(numericEmployeeId)) {
      setError('Некорректный идентификатор сотрудника')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const employeeRecord = await window.api.adminCrud.getById({
        entity: 'employees',
        id: numericEmployeeId
      })

      if (!employeeRecord) {
        setEmployee(null)
        setRelatedData(emptyRelatedData)
        setError('Сотрудник не найден')
        return
      }

      const statusId = toNumberOrNull(employeeRecord.status_id)
      const divisionId = toNumberOrNull(employeeRecord.division_id)
      const positionId = toNumberOrNull(employeeRecord.position_id)

      const [statusRecord, divisionRecord, positionRecord, positionsResult, coworkersResult] =
        await Promise.all([
          statusId === null
            ? Promise.resolve(null)
            : window.api.adminCrud.getById({
                entity: 'dictionary_items',
                id: statusId
              }),
          divisionId === null
            ? Promise.resolve(null)
            : window.api.adminCrud.getById({
                entity: 'divisions',
                id: divisionId
              }),
          positionId === null
            ? Promise.resolve(null)
            : window.api.adminCrud.getById({
                entity: 'positions',
                id: positionId
              }),
          divisionId === null
            ? Promise.resolve(emptyListResult())
            : window.api.adminCrud.list({
                entity: 'positions',
                page: 1,
                pageSize: 500,
                filters: { division_id: divisionId },
                orderBy: 'name',
                orderDirection: 'asc'
              }),
          divisionId === null
            ? Promise.resolve(emptyListResult())
            : window.api.adminCrud.list({
                entity: 'employees',
                page: 1,
                pageSize: 1000,
                filters: { division_id: divisionId },
                orderBy: 'last_name',
                orderDirection: 'asc'
              })
        ])

      setEmployee(employeeRecord)
      setRelatedData({
        status: statusRecord,
        division: divisionRecord,
        position: positionRecord,
        positions: positionsResult.items,
        coworkers: coworkersResult.items.filter((item) => Number(item.id) !== numericEmployeeId)
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить сотрудника')
    } finally {
      setIsLoading(false)
    }
  }, [numericEmployeeId])

  useEffect(() => {
    void loadEmployee()
  }, [loadEmployee])

  const employeeName = employee ? getPersonName(employee) : 'Сотрудник'
  const coworkerRows = useMemo(() => createCoworkerRows(relatedData), [relatedData])

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Button variant="ghost" onClick={() => navigate('/people')}>
          <FiArrowLeft />К людям
        </Button>

        <Button variant="secondary" onClick={() => void loadEmployee()} disabled={isLoading}>
          <FiRefreshCcw />
          Обновить
        </Button>
      </div>

      {error ? (
        <Card className="border-[var(--color-danger)]/40">
          <CardContent>
            <p className="text-sm font-medium text-[var(--color-danger)]">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--color-text-muted)]">Загрузка карточки сотрудника...</p>
          </CardContent>
        </Card>
      ) : null}

      {employee ? (
        <>
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-lg font-bold text-white shadow-sm">
                    {getInitials(employeeName)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-bold tracking-tight">{employeeName}</h1>
                      <Badge>{relatedData.status ? getRecordName(relatedData.status) : 'Статус не указан'}</Badge>
                    </div>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {getEmploymentLine(relatedData)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {employee.email ? <Badge variant="muted">{String(employee.email)}</Badge> : null}
                      {employee.phone ? <Badge variant="muted">{String(employee.phone)}</Badge> : null}
                      {employee.hire_date ? (
                        <Badge variant="muted">Принят: {formatDateForDisplay(employee.hire_date)}</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-4">
                  <MetricCard label="Подразделение" value={getRecordNameOrDash(relatedData.division)} />
                  <MetricCard label="Должность" value={getRecordNameOrDash(relatedData.position)} />
                  <MetricCard label="Должностей в отделе" value={String(relatedData.positions.length)} />
                  <MetricCard label="Коллег" value={String(coworkerRows.length)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="work">Работа</TabsTrigger>
              <TabsTrigger value="contacts">Контакты</TabsTrigger>
              <TabsTrigger value="notes">Дополнительно</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Личные данные</CardTitle>
                    <CardDescription>Основная информация из карточки сотрудника.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoItem label="Фамилия" value={employee.last_name} />
                      <InfoItem label="Имя" value={employee.first_name} />
                      <InfoItem label="Отчество" value={employee.middle_name} />
                      <InfoItem label="Дата рождения" value={formatDateForDisplay(employee.birth_date)} />
                      <InfoItem label="Дата приёма" value={formatDateForDisplay(employee.hire_date)} />
                      <InfoItem label="Дата увольнения" value={formatDateForDisplay(employee.dismissal_date)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Текущее назначение</CardTitle>
                    <CardDescription>Подразделение, должность и статус сотрудника.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3">
                      <InfoItem label="Подразделение" value={getRecordNameOrDash(relatedData.division)} />
                      <InfoItem label="Должность" value={getRecordNameOrDash(relatedData.position)} />
                      <InfoItem label="Статус" value={getRecordNameOrDash(relatedData.status)} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="work">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <SummaryCard icon={<FiBriefcase />} label="Подразделение" value={getRecordNameOrDash(relatedData.division)} />
                  <SummaryCard label="Должность" value={getRecordNameOrDash(relatedData.position)} />
                  <SummaryCard icon={<FiUsers />} label="Коллег в подразделении" value={String(coworkerRows.length)} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Команда подразделения</CardTitle>
                    <CardDescription>Другие сотрудники из того же подразделения.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {coworkerRows.length > 0 ? (
                      <SimpleTable
                        headers={['Сотрудник', 'Должность', 'Email', 'Телефон']}
                        rows={coworkerRows.map((row) => [
                          row.name,
                          row.position,
                          row.email,
                          row.phone
                        ])}
                      />
                    ) : (
                      <EmptyState>В этом подразделении пока нет других сотрудников.</EmptyState>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contacts">
              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Контакты</CardTitle>
                    <CardDescription>Email и телефон для связи.</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3">
                      <InfoItem label="Email" value={employee.email} />
                      <InfoItem label="Телефон" value={employee.phone} />
                    </div>
                  </CardContent>
                </Card>

                <DetailsBlock title="Адрес" value={employee.address} />
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <DetailsBlock title="Примечание" value={employee.note} />
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon?: ReactNode
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          {icon ?? <FiBriefcase />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
          <p className="truncate text-lg font-bold text-[var(--color-text)]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--color-text)]">{formatValue(value)}</p>
    </div>
  )
}

function DetailsBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
          {formatValue(value)}
        </p>
      </CardContent>
    </Card>
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-[var(--color-border)] px-4 py-3 text-left font-semibold text-[var(--color-text-muted)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-[var(--color-border)]">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top text-[var(--color-text)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
      {children}
    </div>
  )
}

function createCoworkerRows(data: EmployeeRelatedData) {
  const positionById = createRecordMap(data.positions)

  return data.coworkers.map((coworker) => {
    const position = getRecordById(coworker.position_id, positionById)

    return {
      name: getPersonName(coworker),
      position: position ? getRecordName(position) : '—',
      email: formatValue(coworker.email),
      phone: formatValue(coworker.phone)
    }
  })
}

function getEmploymentLine(data: EmployeeRelatedData): string {
  const parts = [
    data.position ? getRecordName(data.position) : null,
    data.division ? getRecordName(data.division) : null
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : 'Назначение не указано'
}

function getRecordNameOrDash(record: AdminCrudRecord | null): string {
  return record ? getRecordName(record) : '—'
}

function createRecordMap(records: AdminCrudRecord[]): Map<number, AdminCrudRecord> {
  return new Map(
    records
      .map((record) => [toNumberOrNull(record.id), record] as const)
      .filter((entry): entry is readonly [number, AdminCrudRecord] => entry[0] !== null)
  )
}

function getRecordById(
  value: unknown,
  recordsById: Map<number, AdminCrudRecord>
): AdminCrudRecord | null {
  const id = toNumberOrNull(value)

  if (id === null) {
    return null
  }

  return recordsById.get(id) ?? null
}

function emptyListResult(): { items: AdminCrudRecord[] } {
  return {
    items: []
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function getPersonName(record: AdminCrudRecord): string {
  return [record.last_name, record.first_name, record.middle_name]
    .filter(Boolean)
    .map(String)
    .join(' ')
}

function getRecordName(record: AdminCrudRecord): string {
  if (record.name) {
    return String(record.name)
  }

  return getPersonName(record) || `#${String(record.id)}`
}

function getInitials(value: string): string {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }

  return value.slice(0, 2).toUpperCase()
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}