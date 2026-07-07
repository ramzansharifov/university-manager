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
import { getDatabase } from '../database/connection'

export function registerAuthIpcHandlers(): void {
  const database = getDatabase()

  const auditRepository = new AuditRepository(database)
  const auditService = new AuditService(auditRepository)

  const authRepository = new AuthRepository(database)
  const authService = new AuthService(authRepository, auditService)

  ipcMain.handle('auth:login', (_event, params: LoginParams) => {
    return authService.login(params)
  })

  ipcMain.handle('auth:getCurrentUser', (_event, params: GetCurrentUserParams) => {
    return authService.getCurrentUser(params)
  })

  ipcMain.handle('auth:logout', (_event, params: LogoutParams) => {
    return authService.logout(params)
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
