import { PlaceholderPage } from '../placeholder/PlaceholderPage'

export function UniversityPage() {
    return (
        <PlaceholderPage
            title="Университет"
            description="Структура университета: факультеты, кафедры, специальности, группы и подразделения."
            items={['Факультеты', 'Кафедры', 'Специальности', 'Группы', 'Подразделения']}
        />
    )
}