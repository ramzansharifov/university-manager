import { PlaceholderPage } from '../placeholder/PlaceholderPage'

export function AdministrationPage() {
  return (
    <PlaceholderPage
      title="Администрирование"
      description="Пользователи, роли, права доступа и системные настройки управления."
      items={['Пользователи', 'Роли', 'Матрица прав', 'Системные роли']}
    />
  )
}
