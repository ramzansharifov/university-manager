import type { IpcMainInvokeEvent } from 'electron'
import type { AdminCrudAccessModule } from '../../shared/types/adminCrud'
import type { AuthUser } from '../../shared/types/auth'
import type { AuthService } from '../auth/authService'
import { getAuthTokenForWebContents } from '../auth/sessionContext'
import { canPerformAction } from './accessControl'
import type { AccessAction } from './accessControl'

interface ModuleAccessRequirement {
  module: AdminCrudAccessModule
  action: AccessAction
}

export function requireModuleAccess(
  event: IpcMainInvokeEvent,
  authService: AuthService,
  module: AdminCrudAccessModule,
  action: AccessAction
): void {
  const user = requireAuthenticatedUser(event, authService)

  if (!canPerformAction(user, module, action)) {
    throw new Error(`Нет прав на выполнение операции: ${module}.${action}`)
  }
}

export function requireAnyModuleAccess(
  event: IpcMainInvokeEvent,
  authService: AuthService,
  requirements: ModuleAccessRequirement[]
): void {
  const user = requireAuthenticatedUser(event, authService)

  const hasAccess = requirements.some((requirement) =>
    canPerformAction(user, requirement.module, requirement.action)
  )

  if (!hasAccess) {
    const allowedOperations = requirements
      .map((requirement) => `${requirement.module}.${requirement.action}`)
      .join(', ')

    throw new Error(`Нет прав на выполнение операции. Требуется одно из прав: ${allowedOperations}`)
  }
}

function requireAuthenticatedUser(event: IpcMainInvokeEvent, authService: AuthService): AuthUser {
  const token = getAuthTokenForWebContents(event.sender.id)

  if (!token) {
    throw new Error('Требуется авторизация для выполнения операции')
  }

  const user = authService.getCurrentUser({ token })

  if (!user) {
    throw new Error('Сессия истекла. Войди в систему заново')
  }

  return user
}
