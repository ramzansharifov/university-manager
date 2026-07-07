import { useState } from 'react'
import type { ReactElement } from 'react'
import { FiChevronLeft, FiChevronRight, FiLogOut, FiShield, FiUser } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import {
  canAccessNavigationItem,
  mainNavigationItems,
  systemNavigationItems
} from '../../shared/navigation/appNavigation'
import {
  Badge,
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItemButton,
  SidebarSection,
  SidebarSectionTitle
} from '../../shared/ui'

type ProfileType = 'system' | 'student' | 'teacher' | 'employee'

const sidebarCollapsedStorageKey = 'university-manager.sidebar-collapsed'

export function AppSidebar(): ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true'
  })

  const visibleMainItems = mainNavigationItems.filter((item) =>
    canAccessNavigationItem(auth.user, item)
  )

  const visibleSystemItems = systemNavigationItems.filter((item) =>
    canAccessNavigationItem(auth.user, item)
  )

  function toggleSidebar(): void {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue

      window.localStorage.setItem(sidebarCollapsedStorageKey, String(nextValue))

      return nextValue
    })
  }

  const sidebarWidthClass = isSidebarCollapsed ? 'w-16' : 'w-72'

  return (
    <div
      className={`h-screen shrink-0 transition-[width] duration-200 ease-out ${sidebarWidthClass}`}
    >
      <Sidebar
        className={`group fixed inset-y-0 left-0 z-40 transition-[width] duration-200 ease-out ${sidebarWidthClass}`}
      >
        <button
          type="button"
          className="absolute -right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] opacity-0 shadow-md transition hover:text-[var(--color-primary)] focus:opacity-100 focus:outline-none group-hover:opacity-100"
          title={isSidebarCollapsed ? 'Раскрыть меню' : 'Скрыть меню'}
          aria-label={isSidebarCollapsed ? 'Раскрыть боковое меню' : 'Скрыть боковое меню'}
          aria-expanded={!isSidebarCollapsed}
          onClick={toggleSidebar}
        >
          {isSidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        <SidebarHeader className={isSidebarCollapsed ? 'px-2 py-3' : undefined}>
          <p
            className={[
              'text-center font-bold text-[var(--color-primary)] transition-all',
              isSidebarCollapsed ? 'text-sm' : 'text-xl'
            ].join(' ')}
          >
            {isSidebarCollapsed ? 'U' : 'UGER'}
          </p>
        </SidebarHeader>

        <SidebarContent className={isSidebarCollapsed ? 'px-2 py-3' : undefined}>
          <SidebarSection>
            {!isSidebarCollapsed ? <SidebarSectionTitle>Основное</SidebarSectionTitle> : null}

            <div className="grid gap-1">
              {visibleMainItems.map((item) => (
                <SidebarItemButton
                  key={item.path}
                  icon={item.icon}
                  active={isNavigationItemActive(location.pathname, item.path)}
                  title={item.title}
                  aria-label={item.title}
                  className={isSidebarCollapsed ? 'justify-center px-0' : undefined}
                  onClick={() => navigate(item.path)}
                >
                  {isSidebarCollapsed ? '' : item.title}
                </SidebarItemButton>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection>
            {!isSidebarCollapsed ? <SidebarSectionTitle>Система</SidebarSectionTitle> : null}

            <div className="grid gap-1">
              {visibleSystemItems.map((item) => (
                <SidebarItemButton
                  key={item.path}
                  icon={item.icon}
                  active={isNavigationItemActive(location.pathname, item.path)}
                  title={item.title}
                  aria-label={item.title}
                  className={isSidebarCollapsed ? 'justify-center px-0' : undefined}
                  onClick={() => navigate(item.path)}
                >
                  {isSidebarCollapsed ? '' : item.title}
                </SidebarItemButton>
              ))}
            </div>
          </SidebarSection>
        </SidebarContent>

        {!isSidebarCollapsed ? (
          <SidebarFooter>
            <SidebarAccountCard
              username={auth.user?.username ?? 'Пользователь'}
              roleName={auth.user?.roleName ?? 'Роль не определена'}
              profileType={auth.user?.profileType ?? 'system'}
              isActive={Boolean(auth.user?.isActive)}
              onLogout={() => void auth.logout()}
            />
          </SidebarFooter>
        ) : null}
      </Sidebar>
    </div>
  )
}

function isNavigationItemActive(pathname: string, itemPath: string): boolean {
  if (pathname === itemPath) {
    return true
  }

  return itemPath !== '/' && pathname.startsWith(`${itemPath}/`)
}

function SidebarAccountCard({
  username,
  roleName,
  profileType,
  isActive,
  onLogout
}: {
  username: string
  roleName: string
  profileType: ProfileType
  isActive: boolean
  onLogout: () => void
}): ReactElement {
  const initials = getUserInitials(username)
  const profileTypeLabel = getProfileTypeLabel(profileType)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold uppercase text-white shadow-sm">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{username}</p>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <FiShield className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{roleName}</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <FiUser className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{profileTypeLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge variant={isActive ? 'success' : 'warning'}>
          {isActive ? 'Активная сессия' : 'Неактивен'}
        </Badge>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          title="Выйти из аккаунта"
          aria-label="Выйти из аккаунта"
          onClick={onLogout}
        >
          <FiLogOut />
          Выйти
        </Button>
      </div>
    </div>
  )
}

function getUserInitials(username: string): string {
  const cleanUsername = username.trim()

  if (!cleanUsername) {
    return 'U'
  }

  const parts = cleanUsername
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }

  return cleanUsername.slice(0, 2).toUpperCase()
}

function getProfileTypeLabel(profileType: ProfileType): string {
  if (profileType === 'student') {
    return 'Студент'
  }

  if (profileType === 'teacher') {
    return 'Преподаватель'
  }

  if (profileType === 'employee') {
    return 'Сотрудник'
  }

  return 'Система'
}
