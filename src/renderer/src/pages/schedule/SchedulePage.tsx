import { PlaceholderPage } from '../placeholder/PlaceholderPage'

export function SchedulePage() {
    return (
        <PlaceholderPage
            title="Расписание"
            description="Расписание занятий, аудитории, пары, преподаватели и группы."
            items={['Расписание группы', 'Расписание преподавателя', 'Аудитории', 'Пары', 'Конфликты']}
        />
    )
}