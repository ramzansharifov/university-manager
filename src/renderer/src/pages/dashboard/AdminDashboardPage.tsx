import { useCallback, useEffect, useState } from 'react'
import { FiRefreshCcw } from 'react-icons/fi'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../shared/ui'

type HealthReport = Awaited<ReturnType<Window['api']['system']['getHealthReport']>>
type DataQualityReport = Awaited<ReturnType<Window['api']['system']['getDataQualityReport']>>

export function AdminDashboardPage() {
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
  const [dataQualityReport, setDataQualityReport] = useState<DataQualityReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [health, dataQuality] = await Promise.all([
        window.api.system.getHealthReport(),
        window.api.system.getDataQualityReport()
      ])

      setHealthReport(health)
      setDataQualityReport(dataQuality)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить отчёты')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Админ-центр</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Состояние backend, базы данных, seed-данных и качества заполнения системы.
          </p>
        </div>

        <Button variant="secondary" onClick={() => void loadReports()} disabled={isLoading}>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Backend</CardTitle>
            <CardDescription>Техническое состояние приложения</CardDescription>
          </CardHeader>

          <CardContent>
            {healthReport ? (
              <div className="grid gap-3">
                <Badge variant={getHealthBadgeVariant(healthReport.status)}>
                  {healthReport.status}
                </Badge>

                <InfoRow
                  label="База данных"
                  value={healthReport.database.connected ? 'Подключена' : 'Нет подключения'}
                />

                <InfoRow label="Миграций" value={String(healthReport.migrations.appliedCount)} />

                <InfoRow
                  label="Последняя миграция"
                  value={healthReport.migrations.lastMigrationName ?? 'Нет данных'}
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Загрузка…</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seed</CardTitle>
            <CardDescription>Стартовые системные данные</CardDescription>
          </CardHeader>

          <CardContent>
            {healthReport ? (
              <div className="grid gap-3">
                <InfoRow
                  label="Системные роли"
                  value={String(healthReport.seed.systemRolesCount)}
                />
                <InfoRow label="Permissions" value={String(healthReport.seed.permissionsCount)} />
                <InfoRow
                  label="Dev admin"
                  value={healthReport.seed.adminUserExists ? 'Создан' : 'Не найден'}
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Загрузка…</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Готовность базы</CardTitle>
            <CardDescription>Data quality report</CardDescription>
          </CardHeader>

          <CardContent>
            {dataQualityReport ? (
              <div className="grid gap-3">
                <p className="text-4xl font-bold text-[var(--color-text)]">
                  {dataQualityReport.readinessPercent}%
                </p>

                <InfoRow label="Проверок" value={String(dataQualityReport.summary.totalChecks)} />
                <InfoRow label="Пройдено" value={String(dataQualityReport.summary.passedChecks)} />
                <InfoRow
                  label="Предупреждений"
                  value={String(dataQualityReport.summary.warningChecks)}
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Загрузка…</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Проблемы качества данных</CardTitle>
          <CardDescription>
            Эти проверки позже станут основой полноценного админ-центра.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {dataQualityReport && dataQualityReport.issues.length > 0 ? (
            <div className="grid gap-3">
              {dataQualityReport.issues.slice(0, 8).map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{issue.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {issue.description}
                    </p>
                  </div>

                  <Badge variant={issue.severity === 'warning' ? 'warning' : 'muted'}>
                    {issue.count}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              {isLoading ? 'Загрузка…' : 'Проблем не найдено.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-medium text-[var(--color-text)]">{value}</span>
    </div>
  )
}

function getHealthBadgeVariant(status: HealthReport['status']) {
  if (status === 'ok') {
    return 'success'
  }

  if (status === 'warning') {
    return 'warning'
  }

  return 'danger'
}
