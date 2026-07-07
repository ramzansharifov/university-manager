import { FiUsers } from 'react-icons/fi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui'

export function FilterStudentsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Фильтры: студенты</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Отдельная рабочая страница для поиска студентов и перехода в полную карточку выбранного
          студента.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <FiUsers className="h-6 w-6" />
          </div>

          <CardTitle>Студенты</CardTitle>
          <CardDescription>
            Здесь будет общий список студентов с фильтрами по факультету, специальности, группе,
            курсу, статусу и поиском по ФИО.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-6 text-sm text-[var(--color-text-muted)]">
            Следующим патчем наполним эту страницу таблицей студентов и переходом на отдельную
            страницу полного просмотра данных студента.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
