import { FiLogOut } from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { Badge, Button } from '../../shared/ui'

const pageTitles: Record<string, { title: string; description: string }> = {
    '/': {
        title: 'Главная',
        description: 'Админ-центр и состояние системы'
    },
    '/university': {
        title: 'Университет',
        description: 'Факультеты, кафедры, специальности, группы и подразделения'
    },
    '/people': {
        title: 'Люди',
        description: 'Студенты, преподаватели и сотрудники'
    },
    '/academic-process': {
        title: 'Учебный процесс',
        description: 'Предметы, учебные планы и дисциплины'
    },
    '/schedule': {
        title: 'Расписание',
        description: 'Пары, аудитории и расписание занятий'
    },
    '/learning-journal': {
        title: 'Журнал обучения',
        description: 'Посещаемость, оценки и проведённые занятия'
    },
    '/administration': {
        title: 'Администрирование',
        description: 'Пользователи, роли и права доступа'
    },
    '/audit-log': {
        title: 'Журнал действий',
        description: 'История важных изменений'
    },
    '/settings': {
        title: 'Настройки',
        description: 'Тема, акцентный цвет и язык интерфейса'
    }
}

export function AppHeader() {
    const location = useLocation()
    const auth = useAuth()
    const page = pageTitles[location.pathname] ?? pageTitles['/']

    return (
        <div className="flex h-full items-center justify-between gap-4">
            <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{page.title}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{page.description}</p>
            </div>

            <div className="flex items-center gap-3">
                <Badge variant="success">{auth.user?.roleName ?? 'Активная сессия'}</Badge>

                <Button variant="secondary" size="sm" onClick={() => void auth.logout()}>
                    <FiLogOut />
                    Выйти
                </Button>
            </div>
        </div>
    )
}