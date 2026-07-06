import { ipcMain } from 'electron'
import type {

  CreateRoleParams,
  DeleteRoleParams,
  ListRolesParams,
  SetRolePermissionsParams,
  UpdateRoleParams
} from '../../shared/types/roles'
import { AuditRepository } from '../audit/auditRepository'
import { AuditService } from '../audit/auditService'
import { getDatabase } from '../database/connection'
import { RoleRepository } from '../roles/roleRepository'
import { RoleService } from '../roles/roleService'

export function registerRoleIpcHandlers(): void {
  const database = getDatabase()

  const auditRepository = new AuditRepository(database)
  const auditService = new AuditService(auditRepository)

  const roleRepository = new RoleRepository(database)
  const roleService = new RoleService(roleRepository, auditService)

  ipcMain.handle('roles:list', (_event, params?: ListRolesParams) => {
    return roleService.listRoles(params)
  })

  ipcMain.handle('roles:getDetails', (_event, roleId: number) => {
    return roleService.getRoleDetails(roleId)
  })

  ipcMain.handle('roles:listPermissionGroups', () => {
    return roleService.listPermissionGroups()
  })

  ipcMain.handle('roles:create', (_event, params: CreateRoleParams) => {
    return roleService.createRole(params)
  })

  ipcMain.handle('roles:update', (_event, params: UpdateRoleParams) => {
    return roleService.updateRole(params)
  })

  ipcMain.handle('roles:setPermissions', (_event, params: SetRolePermissionsParams) => {
    return roleService.setRolePermissions(params)
  })

  ipcMain.handle('roles:delete', (_event, params: DeleteRoleParams) => {
    return roleService.deleteRole(params)
  })
}
