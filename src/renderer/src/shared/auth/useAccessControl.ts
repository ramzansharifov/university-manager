import { useMemo } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import {
  canCreateInModule,
  canDeleteFromModule,
  canPerformAction,
  canUpdateInModule,
  canViewModule,
  getEffectivePermissions,
  isSuperAdmin as checkIsSuperAdmin,
  isSystemStudent,
  isSystemTeacher
} from './accessControl'
import type { AccessAction, AccessModule } from './accessControl'

export function useAccessControl() {
  const { user } = useAuth()

  return useMemo(
    () => ({
      user,
      permissions: getEffectivePermissions(user),
      isSuperAdmin: checkIsSuperAdmin(user),
      isTeacher: isSystemTeacher(user),
      isStudent: isSystemStudent(user),
      canView: (module: AccessModule) => canViewModule(user, module),
      canCreate: (module: AccessModule) => canCreateInModule(user, module),
      canUpdate: (module: AccessModule) => canUpdateInModule(user, module),
      canDelete: (module: AccessModule) => canDeleteFromModule(user, module),
      canPerform: (module: AccessModule, action: AccessAction) =>
        canPerformAction(user, module, action)
    }),
    [user]
  )
}
