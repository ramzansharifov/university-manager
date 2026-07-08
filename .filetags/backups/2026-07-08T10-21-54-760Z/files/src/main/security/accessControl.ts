import type { AdminCrudAccessModule } from '../../shared/types/adminCrud'
import type { AuthUser } from '../../shared/types/auth'

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

export function canPerformAction(
  user: AuthUser,
  module: AdminCrudAccessModule,
  action: AccessAction
): boolean {
  if (user.roleKey === 'super_admin') {
    return true
  }

  return getEffectivePermissions(user).includes(`${module}.${action}`)
}

function getEffectivePermissions(user: AuthUser): string[] {
  if (user.roleKey === 'teacher' && user.profileType === 'teacher') {
    return teacherPermissions
  }

  if (user.roleKey === 'student' && user.profileType === 'student') {
    return studentPermissions
  }

  return user.permissions
}
