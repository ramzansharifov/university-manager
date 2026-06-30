import { useCallback, useEffect, useState } from 'react'
import { FiDownload, FiRefreshCw, FiTrash2, FiUpload } from 'react-icons/fi'
import type {
  AppHealthReport,
  DataQualityReport,
  DatabaseMaintenanceResult
} from '../../../../shared/types/system'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../shared/ui'

export function AdministrationPage() {
  const [healthReport, setHealthReport] = useState<AppHealthReport | null>(null)
  const [dataQualityReport, setDataQualityReport] = useState<DataQualityReport | null>(null)
  const [operationResult, setOperationResult] = useState<DatabaseMaintenanceResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadReports = useCallback(async () => {
    const [health, quality] = await Promise.all([
      window.api.system.getHealthReport(),
      window.api.system.getDataQualityReport()
    ])

    setHealthReport(health)
    setDataQualityReport(quality)
  }, [])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  async function runOperation(operation: () => Promise<DatabaseMaintenanceResult>) {
    setIsLoading(true)
    setOperationResult(null)

    try {
      const result = await operation()

      setOperationResult(result)
      await loadReports()
    } catch (error) {
      setOperationResult({
        success: false,
        message: getErrorMessage(error)
      })
    } finally {
      setIsLoading(false)
    }
  }

  function exportDatabase() {
    void runOperation(() => window.api.system.exportDatabaseToJson())
  }

  function importDatabase() {
    const confirmed = window.confirm(
      'Импорт заменит текущие данные данными из JSON-файла. Продолжить?'
    )

    if (!confirmed) {
      return
    }

    void runOperation(() => window.api.system.importDatabaseFromJson())
  }

  function resetDatabase() {
    const confirmation = window.prompt(
      'Это удалит все данные и заново создаст системные роли, права и admin/admin. Для подтверждения введи: УДАЛИТЬ'
    )

    if (confirmation !== 'УДАЛИТЬ') {
      return
    }

    void runOperation(() => window.api.system.resetDatabase())
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Администрирование</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Состояние системы, экспорт, импорт и полная очистка базы данных.
        </p>
      </div>

      {operationResult ? (
        <div
          className={[
            'rounded-xl border px-4 py-3 text-sm',
            operationResult.success
              ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]'
              : 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
          ].join(' ')}
        >
          {operationResult.message}

          {operationResult.filePath ? (
            <div className="mt-1 break-all text-xs opacity-80">{operationResult.filePath}</div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>База данных</CardTitle>
            <CardDescription>Подключение, миграции и базовая готовность.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">Статус</span>
              <Badge variant={healthReport?.status === 'ok' ? 'success' : 'warning'}>
                {healthReport?.status ?? 'загрузка'}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">Миграций</span>
              <span className="text-sm font-medium">
                {healthReport?.migrations.appliedCount ?? '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">Admin</span>
              <Badge variant={healthReport?.seed.adminUserExists ? 'success' : 'danger'}>
                {healthReport?.seed.adminUserExists ? 'есть' : 'нет'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Качество данных</CardTitle>
            <CardDescription>Проверки связей и заполненности данных.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">Готовность</span>
              <span className="text-sm font-medium">
                {dataQualityReport ? `${dataQualityReport.readinessPercent}%` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">Предупреждения</span>
              <Badge variant={dataQualityReport?.summary.warningChecks ? 'warning' : 'success'}>
                {dataQualityReport?.summary.warningChecks ?? 0}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">Ошибки</span>
              <Badge variant={dataQualityReport?.summary.failedChecks ? 'danger' : 'success'}>
                {dataQualityReport?.summary.failedChecks ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Обновить сведения</CardTitle>
            <CardDescription>Перечитать состояние системы после операций.</CardDescription>
          </CardHeader>

          <CardContent>
            <Button variant="secondary" disabled={isLoading} onClick={() => void loadReports()}>
              <FiRefreshCw />
              Обновить
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Резервное копирование и перенос данных</CardTitle>
          <CardDescription>
            Экспортируй все данные в JSON, импортируй резервную копию или очисти базу.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button disabled={isLoading} onClick={exportDatabase}>
            <FiDownload />
            Экспорт JSON
          </Button>

          <Button variant="secondary" disabled={isLoading} onClick={importDatabase}>
            <FiUpload />
            Импорт JSON
          </Button>

          <Button variant="danger" disabled={isLoading} onClick={resetDatabase}>
            <FiTrash2 />
            Очистить базу
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Что делает очистка</CardTitle>
          <CardDescription>
            Файл базы не удаляется физически во время работы приложения, но все пользовательские и
            учебные данные очищаются.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-2 text-sm text-[var(--color-text-muted)]">
          <p>
            После очистки заново создаются системные роли, права, словари, настройки и пользователь
            <span className="font-medium text-[var(--color-text)]"> admin/admin</span>.
          </p>
          <p>
            Текущая сессия может стать недействительной после очистки или импорта. После операции
            лучше перезайти в приложение.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Неизвестная ошибка'
}
