import type { AuthUser } from '../../../../shared/types/auth'
import { canViewModule } from '../auth/accessControl'
import type { AccessModule } from '../auth/accessControl'
import { allNavigationItems, canAccessNavigationItem } from './appNavigation'

interface RouteAccessRule {
  module: AccessModule
  matches: (pathname: string) => boolean
}

const routeAccessRules: RouteAccessRule[] = [
  {
    module: 'settings',
    matches: (pathname) => pathname === '/'
  },
  {
    module: 'university',
    matches: (pathname) => isExactOrNested(pathname, '/university')
  },
  {
    module: 'people',
    matches: (pathname) => isExactOrNested(pathname, '/people')
  },
  {
    module: 'people',
    matches: (pathname) => isExactOrNested(pathname, '/filters')
  },
  {
    module: 'academic_process',
    matches: (pathname) => isExactOrNested(pathname, '/academic-process')
  },
  {
    module: 'rooms_and_lessons',
    matches: (pathname) => isExactOrNested(pathname, '/rooms-and-lessons')
  },
  {
    module: 'schedule',
    matches: (pathname) => isExactOrNested(pathname, '/schedule')
  },
  {
    module: 'learning_journal',
    matches: (pathname) => isExactOrNested(pathname, '/learning-journal')
  },
  {
    module: 'reports',
    matches: (pathname) => isExactOrNested(pathname, '/reports')
  },
  {
    module: 'administration',
    matches: (pathname) => isExactOrNested(pathname, '/administration')
  },
  {
    module: 'audit_log',
    matches: (pathname) => isExactOrNested(pathname, '/audit-log')
  },
  {
    module: 'settings',
    matches: (pathname) => isExactOrNested(pathname, '/settings')
  }
]

export function getRouteAccessModule(pathname: string): AccessModule | null {
  const normalizedPathname = normalizePathname(pathname)
  const rule = routeAccessRules.find((item) => item.matches(normalizedPathname))

  return rule?.module ?? null
}

export function canAccessPath(user: AuthUser | null, pathname: string): boolean {
  if (!user) {
    return false
  }

  const module = getRouteAccessModule(pathname)

  if (!module) {
    return true
  }

  return canViewModule(user, module)
}

export function getDefaultAccessiblePath(user: AuthUser | null): string | null {
  if (!user) {
    return null
  }

  const firstAccessibleItem = allNavigationItems.find((item) => canAccessNavigationItem(user, item))

  return firstAccessibleItem?.path ?? null
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function isExactOrNested(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}
