import { FiUserCheck } from 'react-icons/fi'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../shared/ui'

export function FilterTeachersPage() {
  return (
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
          Вкладка подготовлена. Наполнение сделаем отдельным этапом после студентов.
        </div>
      </CardContent>
    </Card>
  )
}