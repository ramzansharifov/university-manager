import type { ReactNode } from 'react'
import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiDatabase,
  FiHome,
  FiSettings,
  FiShield,
  FiUsers
} from 'react-icons/fi'
import type { AuthUser } from '../../../../shared/types/auth'

export interface AppNavigationItem {
  title: string
  description: string
  path: string
  icon: ReactNode
  permissions?: string[]
}

export const mainNavigationItems: AppNavigationItem[] = [
  {
    title: 'Главная',
    description: 'Админ-центр и состояние системы',
    path: '/',
    icon: <FiHome />,
    permissions: ['settings.view']
  },
  {
    title: 'Университет',
    description: 'Факультеты, кафедры, специальности, группы и подразделения',
    path: '/university',
    icon: <FiDatabase />,
    permissions: ['university.view']
  },
  {
    title: 'Люди',
    description: 'Студенты, преподаватели и сотрудники',
    path: '/people',
    icon: <FiUsers />,
    permissions: ['people.view']
  },
  {
    title: 'Учебный процесс',
    description: 'Предметы, учебные планы и дисциплины',
    path: '/academic-process',
    icon: <FiBookOpen />,
    permissions: ['academic_process.view']
  },
  {
    title: 'Расписание',
    description: 'Пары, аудитории и расписание занятий',
    path: '/schedule',
    icon: <FiCalendar />,
    permissions: ['schedule.view']
  },
  {
    title: 'Журнал обучения',
    description: 'Посещаемость, оценки и проведённые занятия',
    path: '/learning-journal',
    icon: <FiClipboard />,
    permissions: ['learning_journal.view']
  },
  {
    title: 'Отчёты',
    description: 'Посещаемость, успеваемость и аналитика',
    path: '/reports',
    icon: <FiBarChart2 />,
    permissions: ['reports.view']
  }
]

export const systemNavigationItems: AppNavigationItem[] = [
  {
    title: 'Администрирование',
    description: 'Пользователи, роли и права доступа',
    path: '/administration',
    icon: <FiShield />,
    permissions: ['administration.view']
  },
  {
    title: 'Журнал действий',
    description: 'История важных изменений',
    path: '/audit-log',
    icon: <FiActivity />,
    permissions: ['audit_log.view']
  },
  {
    title: 'Настройки',
    description: 'Тема, акцентный цвет и язык интерфейса',
    path: '/settings',
    icon: <FiSettings />,
    permissions: ['settings.view']
  }
]

export const allNavigationItems = [...mainNavigationItems, ...systemNavigationItems]

export function getNavigationItemByPath(pathname: string): AppNavigationItem | undefined {
  return allNavigationItems.find((item) => item.path === pathname)
}

export function canAccessNavigationItem(user: AuthUser | null, item: AppNavigationItem): boolean {
  if (!user) {
    return false
  }

  if (user.roleKey === 'super_admin') {
    return true
  }

  if (!item.permissions || item.permissions.length === 0) {
    return true
  }

  return item.permissions.some((permission) => user.permissions.includes(permission))
}
