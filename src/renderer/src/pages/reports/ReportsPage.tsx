import { PlaceholderPage } from '../placeholder/PlaceholderPage'

export function ReportsPage() {
  return (
    <PlaceholderPage
      title="Отчёты"
      description="Аналитика по посещаемости, успеваемости и итогам обучения."
      items={['Посещаемость', 'Успеваемость', 'Пропуски', 'Итоги по группе']}
    />
  )
}
