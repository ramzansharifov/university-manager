import { FiUserCheck } from 'react-icons/fi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui'

export function FilterTeachersPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Фильтры: преподаватели</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Отдельная рабочая страница для поиска преподавателей и просмотра их полной карточки.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <FiUserCheck className="h-6 w-6" />
          </div>

          <CardTitle>Преподаватели</CardTitle>
          <CardDescription>
            Здесь позже появятся фильтры по кафедре, статусу, преподаваемым дисциплинам и поиску по
            ФИО.
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
