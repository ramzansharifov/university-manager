import { FiBriefcase } from 'react-icons/fi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui'

export function FilterEmployeesPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Фильтры: сотрудники</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Отдельная рабочая страница для поиска сотрудников и просмотра их полной карточки.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <FiBriefcase className="h-6 w-6" />
          </div>

          <CardTitle>Сотрудники</CardTitle>
          <CardDescription>
            Здесь позже появятся фильтры по подразделению, должности, статусу и поиску по ФИО.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-6 text-sm text-[var(--color-text-muted)]">
            Страница подготовлена. Наполнение сделаем отдельным этапом после студентов.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
