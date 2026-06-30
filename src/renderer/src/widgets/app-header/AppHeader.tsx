import { FiLogOut } from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { getNavigationItemByPath } from '../../shared/navigation/appNavigation'
import { Badge, Button } from '../../shared/ui'

const fallbackPage = {
  title: 'Главная',
  description: 'Админ-центр и состояние системы'
}

export function AppHeader() {
  const location = useLocation()
  const auth = useAuth()
  const page = getNavigationItemByPath(location.pathname) ?? fallbackPage

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
