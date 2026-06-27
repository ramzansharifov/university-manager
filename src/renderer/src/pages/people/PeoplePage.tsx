import { PlaceholderPage } from '../placeholder/PlaceholderPage'

export function PeoplePage() {
    return (
        <PlaceholderPage
            title="Люди"
            description="Студенты, преподаватели, сотрудники, должности и статусы."
            items={['Студенты', 'Преподаватели', 'Сотрудники', 'Должности', 'Статусы']}
        />
    )
}