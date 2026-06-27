import { PlaceholderPage } from '../placeholder/PlaceholderPage'

export function AuditLogPage() {
    return (
        <PlaceholderPage
            title="Журнал действий"
            description="История важных изменений: создание, редактирование, удаление, входы и настройки."
            items={['Действия пользователей', 'Изменения записей', 'Фильтры', 'История сущности']}
        />
    )
}