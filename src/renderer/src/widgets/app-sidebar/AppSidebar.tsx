import {
    FiActivity,
    FiBookOpen,
    FiCalendar,
    FiClipboard,
    FiDatabase,
    FiHome,
    FiSettings,
    FiShield,
    FiUsers
} from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarItemButton,
    SidebarSection,
    SidebarSectionTitle
} from '../../shared/ui'

const navigationItems = [
    {
        title: 'Главная',
        path: '/',
        icon: <FiHome />
    },
    {
        title: 'Университет',
        path: '/university',
        icon: <FiDatabase />
    },
    {
        title: 'Люди',
        path: '/people',
        icon: <FiUsers />
    },
    {
        title: 'Учебный процесс',
        path: '/academic-process',
        icon: <FiBookOpen />
    },
    {
        title: 'Расписание',
        path: '/schedule',
        icon: <FiCalendar />
    },
    {
        title: 'Журнал обучения',
        path: '/learning-journal',
        icon: <FiClipboard />
    }
]

const systemItems = [
    {
        title: 'Администрирование',
        path: '/administration',
        icon: <FiShield />
    },
    {
        title: 'Журнал действий',
        path: '/audit-log',
        icon: <FiActivity />
    },
    {
        title: 'Настройки',
        path: '/settings',
        icon: <FiSettings />
    }
]

export function AppSidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const auth = useAuth()

    return (
        <Sidebar>
            <SidebarHeader>
                <p className="text-sm font-semibold text-[var(--color-primary)]">University Manager</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Система управления университетом
                </p>
            </SidebarHeader>

            <SidebarContent>
                <SidebarSection>
                    <SidebarSectionTitle>Основное</SidebarSectionTitle>

                    <div className="grid gap-1">
                        {navigationItems.map((item) => (
                            <SidebarItemButton
                                key={item.path}
                                icon={item.icon}
                                active={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                            >
                                {item.title}
                            </SidebarItemButton>
                        ))}
                    </div>
                </SidebarSection>

                <SidebarSection>
                    <SidebarSectionTitle>Система</SidebarSectionTitle>

                    <div className="grid gap-1">
                        {systemItems.map((item) => (
                            <SidebarItemButton
                                key={item.path}
                                icon={item.icon}
                                active={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                            >
                                {item.title}
                            </SidebarItemButton>
                        ))}
                    </div>
                </SidebarSection>
            </SidebarContent>

            <SidebarFooter>
                <div className="rounded-xl bg-[var(--color-surface-muted)] p-3">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                        {auth.user?.username ?? 'Пользователь'}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                        {auth.user?.roleName ?? 'Роль не определена'}
                    </p>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}