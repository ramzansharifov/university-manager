import type { ReactNode } from 'react'
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiDatabase,
  FiFilter,
  FiHome,
  FiMapPin,
  FiSettings,
  FiShield,
  FiUserCheck,
  FiUsers
} from 'react-icons/fi'
import type { AuthUser } from '../../../../shared/types/auth'
import { canViewModule } from '../auth/accessControl'
import type { AccessModule } from '../auth/accessControl'

export interface AppNavigationItem {
  title: string
  description: string
  path: string
  icon: ReactNode
  module?: AccessModule
  permissions?: string[]
  profileTypes?: AuthUser['profileType'][]
}

export const studentNavigationItems: AppNavigationItem[] = [
  {
    title: 'Расписание',
    description: 'Моё расписание и просмотр расписания других групп',
    path: '/student/schedule',
    icon: <FiCalendar />,
    module: 'schedule',
    profileTypes: ['student']
  },
  {
    title: 'Учебный план',
    description: 'Подробный учебный план специальности по курсам',
    path: '/student/curriculum',
    icon: <FiBookOpen />,
    module: 'academic_process',
    profileTypes: ['student']
  },
  {
    title: 'Преподаватели',
    description: 'Мои преподаватели и их полное расписание',
    path: '/student/teachers',
    icon: <FiUserCheck />,
    module: 'schedule',
    profileTypes: ['student']
  },
  {
    title: 'Моя группа',
    description: 'Факультет, специальность, группа, куратор и однокурсники',
    path: '/student/group',
    icon: <FiUsers />,
    module: 'academic_process',
    profileTypes: ['student']
  },
  {
    title: 'Журнал',
    description: 'Темы занятий, посещаемость и контрольные',
    path: '/student/journal',
    icon: <FiClipboard />,
    module: 'learning_journal',
    profileTypes: ['student']
  },
  {
    title: 'Успеваемость',
    description: 'Оценки, итоговые элементы и зачётная книжка',
    path: '/student/performance',
    icon: <FiAward />,
    module: 'reports',
    profileTypes: ['student']
  }
]
export const mainNavigationItems: AppNavigationItem[] = [
  {
    title: 'Главная',
    description: 'Админ-центр и состояние системы',
    path: '/',
    icon: <FiHome />,
    module: 'settings'
  },
  {
    title: 'Университет',
    description: 'Факультеты, кафедры, специальности, группы и подразделения',
    path: '/university',
    icon: <FiDatabase />,
    module: 'university'
  },
  {
    title: 'Люди',
    description: 'Студенты, преподаватели и сотрудники',
    path: '/people',
    icon: <FiUsers />,
    module: 'people'
  },
  {
    title: 'Фильтры',
    description: 'Поиск студентов, преподавателей и сотрудников',
    path: '/filters',
    icon: <FiFilter />,
    module: 'people'
  },
  {
    title: 'Учебный процесс',
    description: 'Предметы, учебные планы и дисциплины',
    path: '/academic-process',
    icon: <FiBookOpen />,
    module: 'academic_process'
  },
  {
    title: 'Аудитории и занятия',
    description: 'Корпуса, аудитории, пары и типы занятий',
    path: '/rooms-and-lessons',
    icon: <FiMapPin />,
    module: 'rooms_and_lessons'
  },
  {
    title: 'Расписание',
    description: 'Расписание занятий и итоговая аттестация',
    path: '/schedule',
    icon: <FiCalendar />,
    module: 'schedule'
  },
  {
    title: 'Журнал обучения',
    description: 'Посещаемость, оценки и проведённые занятия',
    path: '/learning-journal',
    icon: <FiClipboard />,
    module: 'learning_journal'
  },
  {
    title: 'Отчёты',
    description: 'Посещаемость, успеваемость и аналитика',
    path: '/reports',
    icon: <FiBarChart2 />,
    module: 'reports'
  }
]

export const systemNavigationItems: AppNavigationItem[] = [
  {
    title: 'Администрирование',
    description: 'Пользователи, роли и права доступа',
    path: '/administration',
    icon: <FiShield />,
    module: 'administration'
  },
  {
    title: 'Журнал действий',
    description: 'История важных изменений',
    path: '/audit-log',
    icon: <FiActivity />,
    module: 'audit_log'
  },
  {
    title: 'Настройки',
    description: 'Тема, акцентный цвет и язык интерфейса',
    path: '/settings',
    icon: <FiSettings />,
    module: 'settings'
  }
]

export const allNavigationItems = [
  ...studentNavigationItems,
  ...mainNavigationItems,
  ...systemNavigationItems
]

export function getNavigationItemByPath(pathname: string): AppNavigationItem | undefined {
  return allNavigationItems.find((item) => item.path === pathname)
}

export function canAccessNavigationItem(user: AuthUser | null, item: AppNavigationItem): boolean {
  if (!user) {
    return false
  }
  if (item.profileTypes && !item.profileTypes.includes(user.profileType)) {
    return false
  }

  if (item.module) {
    return canViewModule(user, item.module)
  }

  if (!item.permissions || item.permissions.length === 0) {
    return true
  }

  return item.permissions.some((permission) => user.permissions.includes(permission))
}
