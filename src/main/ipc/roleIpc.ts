import { ipcMain } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import type {
  CreateRoleParams,
  DeleteRoleParams,
  SetRolePermissionsParams,
  UpdateRoleParams
} from '../../shared/types/roles'
import { AuditRepository } from '../audit/auditRepository'
import { AuditService } from '../audit/auditService'
import { AuthRepository } from '../auth/authRepository'
import { AuthService } from '../auth/authService'
import { getDatabase } from '../database/connection'
import { RoleRepository } from '../roles/roleRepository'
import { RoleService } from '../roles/roleService'
import { requireModuleAccess } from '../security/ipcAccess'
import type { AccessAction } from '../security/accessControl'

export function registerRoleIpcHandlers(): void {
  const database = getDatabase()

  const auditRepository = new AuditRepository(database)
  const auditService = new AuditService(auditRepository)

  const authRepository = new AuthRepository(database)
  const authService = new AuthService(authRepository, auditService)

  const roleRepository = new RoleRepository(database)
  const roleService = new RoleService(roleRepository, auditService)

  function requireAdministrationAccess(event: IpcMainInvokeEvent, action: AccessAction): void {
    requireModuleAccess(event, authService, 'administration', action)
  }

  ipcMain.handle('roles:list', (event) => {
    requireAdministrationAccess(event, 'view')

    return roleService.listRoles()
  })

  ipcMain.handle('roles:getDetails', (event, roleId: number) => {
    requireAdministrationAccess(event, 'view')

    return roleService.getRoleDetails(roleId)
  })

  ipcMain.handle('roles:listPermissionGroups', (event) => {
    requireAdministrationAccess(event, 'view')

    return roleService.listPermissionGroups()
  })

  ipcMain.handle('roles:create', (event, params: CreateRoleParams) => {
    requireAdministrationAccess(event, 'create')

    return roleService.createRole(params)
  })

  ipcMain.handle('roles:update', (event, params: UpdateRoleParams) => {
    requireAdministrationAccess(event, 'update')

    return roleService.updateRole(params)
  })

  ipcMain.handle('roles:setPermissions', (event, params: SetRolePermissionsParams) => {
    requireAdministrationAccess(event, 'update')

    return roleService.setRolePermissions(params)
  })

  ipcMain.handle('roles:delete', (event, params: DeleteRoleParams) => {
    requireAdministrationAccess(event, 'delete')

    return roleService.deleteRole(params)
  })
}
