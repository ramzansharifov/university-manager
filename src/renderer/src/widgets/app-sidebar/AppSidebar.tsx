import type { ReactElement } from 'react'
import { FiLogOut, FiShield, FiUser } from 'react-icons/fi'
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

export function AppSidebar(): ReactElement {
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
        <p className="text-center text-xl font-bold text-[var(--color-primary)]">UGER</p>
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
        <SidebarAccountCard
          username={auth.user?.username ?? 'Пользователь'}
          roleName={auth.user?.roleName ?? 'Роль не определена'}
          profileType={auth.user?.profileType ?? 'system'}
          isActive={Boolean(auth.user?.isActive)}
          onLogout={() => void auth.logout()}
        />
      </SidebarFooter>
    </Sidebar>
  )
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
