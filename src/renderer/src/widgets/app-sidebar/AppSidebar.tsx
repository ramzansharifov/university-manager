import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import {
    canAccessNavigationItem,
    mainNavigationItems,
    systemNavigationItems
} from '../../shared/navigation/appNavigation'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarItemButton,
    SidebarSection,
    SidebarSectionTitle
} from '../../shared/ui'

export function AppSidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const auth = useAuth()

    const visibleMainItems = mainNavigationItems.filter((item) =>
        canAccessNavigationItem(auth.user, item)
    )

    const visibleSystemItems = systemNavigationItems.filter((item) =>
        canAccessNavigationItem(auth.user, item)
    )

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
                        {visibleMainItems.map((item) => (
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
                        {visibleSystemItems.map((item) => (
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