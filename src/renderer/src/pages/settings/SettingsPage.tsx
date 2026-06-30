import { PlaceholderPage } from '../placeholder/PlaceholderPage'

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Настройки"
      description="Тема интерфейса, акцентный цвет, язык и будущие параметры приложения."
      items={[
        'Светлая тема',
        'Тёмная тема',
        'Синий акцент',
        'Фиолетовый акцент',
        'Язык интерфейса'
      ]}
    />
  )
}
