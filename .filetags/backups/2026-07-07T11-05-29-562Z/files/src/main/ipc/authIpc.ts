import { ipcMain } from 'electron'
import type {
  ChangePasswordParams,
  CreateUserParams,
  DeleteUserParams,
  GetCurrentUserParams,
  LoginParams,
  LogoutParams,
  SetUserActiveParams,
  UpdateUserParams
} from '../../shared/types/auth'
import { AuditRepository } from '../audit/auditRepository'
import { AuditService } from '../audit/auditService'
import { AuthRepository } from '../auth/authRepository'
import { AuthService } from '../auth/authService'
import {
  forgetAuthTokenForWebContents,
  rememberAuthTokenForWebContents
} from '../auth/sessionContext'
import { getDatabase } from '../database/connection'

export function registerAuthIpcHandlers(): void {
  const database = getDatabase()

  const auditRepository = new AuditRepository(database)
  const auditService = new AuditService(auditRepository)

  const authRepository = new AuthRepository(database)
  const authService = new AuthService(authRepository, auditService)

  ipcMain.handle('auth:login', (event, params: LoginParams) => {
    const result = authService.login(params)

    rememberAuthTokenForWebContents(event.sender.id, result.token)

    return result
  })

  ipcMain.handle('auth:getCurrentUser', (event, params: GetCurrentUserParams) => {
    const user = authService.getCurrentUser(params)

    if (user) {
      rememberAuthTokenForWebContents(event.sender.id, params.token)
    } else {
      forgetAuthTokenForWebContents(event.sender.id)
    }

    return user
  })

  ipcMain.handle('auth:logout', (event, params: LogoutParams) => {
    const result = authService.logout(params)

    forgetAuthTokenForWebContents(event.sender.id)

    return result
  })

  ipcMain.handle('auth:listUsers', () => {
    return authService.listUsers()
  })

  ipcMain.handle('auth:createUser', (_event, params: CreateUserParams) => {
    return authService.createUser(params)
  })

  ipcMain.handle('auth:updateUser', (_event, params: UpdateUserParams) => {
    return authService.updateUser(params)
  })

  ipcMain.handle('auth:setUserActive', (_event, params: SetUserActiveParams) => {
    return authService.setUserActive(params)
  })

  ipcMain.handle('auth:deleteUser', (_event, params: DeleteUserParams) => {
    return authService.deleteUser(params)
  })

  ipcMain.handle('auth:changePassword', (_event, params: ChangePasswordParams) => {
    return authService.changePassword(params)
  })
}
