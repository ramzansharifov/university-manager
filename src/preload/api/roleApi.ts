import { ipcRenderer } from 'electron'
import type {
  CreateRoleParams,
  DeleteRoleParams,
  ListRolesParams,
  PermissionGroup,
  Role,
  RoleDetails,
  RoleOperationResult,
  SetRolePermissionsParams,
  UpdateRoleParams
} from '../../shared/types/roles'

export const roleApi = {
  list(params?: ListRolesParams): Promise<Role[]> {
    return ipcRenderer.invoke('roles:list', params)
  },

  getDetails(roleId: number): Promise<RoleDetails | null> {
    return ipcRenderer.invoke('roles:getDetails', roleId)
  },

  listPermissionGroups(): Promise<PermissionGroup[]> {
    return ipcRenderer.invoke('roles:listPermissionGroups')
  },

  create(params: CreateRoleParams): Promise<RoleOperationResult> {
    return ipcRenderer.invoke('roles:create', params)
  },

  update(params: UpdateRoleParams): Promise<RoleOperationResult> {
    return ipcRenderer.invoke('roles:update', params)
  },

  setPermissions(params: SetRolePermissionsParams): Promise<RoleOperationResult> {
    return ipcRenderer.invoke('roles:setPermissions', params)
  },

  delete(params: DeleteRoleParams): Promise<RoleOperationResult> {
    return ipcRenderer.invoke('roles:delete', params)
  }
}
