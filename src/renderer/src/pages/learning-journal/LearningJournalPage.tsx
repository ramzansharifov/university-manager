import { PlaceholderPage } from '../placeholder/PlaceholderPage'

export function LearningJournalPage() {
    return (
        <PlaceholderPage
            title="Журнал обучения"
            description="Проведённые занятия, посещаемость, оценки и выполнение тем."
            items={['Проведённые занятия', 'Посещаемость', 'Оценки', 'Выполнение занятий']}
        />
    )
}