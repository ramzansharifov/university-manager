import type { AuthUser } from '../../../../shared/types/auth'

export type AccessModule =
  | 'university'
  | 'people'
  | 'academic_calendar'
  | 'academic_process'
  | 'rooms_and_lessons'
  | 'schedule'
  | 'learning_journal'
  | 'reports'
  | 'administration'
  | 'audit_log'
  | 'settings'

export type AccessAction = 'view' | 'create' | 'update' | 'delete'

const teacherPermissions = [
  'academic_process.view',
  'schedule.view',
  'learning_journal.view',
  'learning_journal.create',
  'learning_journal.update',
  'reports.view'
]

const studentPermissions = [
  'academic_process.view',
  'schedule.view',
  'learning_journal.view',
  'reports.view'
]

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.roleKey === 'super_admin'
}

export function isSystemTeacher(user: AuthUser | null): boolean {
  return user?.roleKey === 'teacher' && user.profileType === 'teacher'
}

export function isSystemStudent(user: AuthUser | null): boolean {
  return user?.roleKey === 'student' && user.profileType === 'student'
}

export function getEffectivePermissions(user: AuthUser | null): string[] {
  if (!user) {
    return []
  }

  if (isSuperAdmin(user)) {
    return ['*']
  }

  if (isSystemTeacher(user)) {
    return teacherPermissions
  }

  if (isSystemStudent(user)) {
    return studentPermissions
  }

  return user.permissions
}

export function hasPermission(user: AuthUser | null, permissionKey: string): boolean {
  if (!user) {
    return false
  }

  if (isSuperAdmin(user)) {
    return true
  }

  return getEffectivePermissions(user).includes(permissionKey)
}

export function canPerformAction(
  user: AuthUser | null,
  module: AccessModule,
  action: AccessAction
): boolean {
  return hasPermission(user, `${module}.${action}`)
}

export function canViewModule(user: AuthUser | null, module: AccessModule): boolean {
  return canPerformAction(user, module, 'view')
}

export function canCreateInModule(user: AuthUser | null, module: AccessModule): boolean {
  return canPerformAction(user, module, 'create')
}

export function canUpdateInModule(user: AuthUser | null, module: AccessModule): boolean {
  return canPerformAction(user, module, 'update')
}

export function canDeleteFromModule(user: AuthUser | null, module: AccessModule): boolean {
  return canPerformAction(user, module, 'delete')
}
