export interface Permission {
  id: number
  permissionKey: string
  module: string
  action: string
  name: string
}

export interface PermissionGroup {
  module: string
  permissions: Permission[]
}

export interface Role {
  id: number
  roleKey: string
  name: string
  description: string | null
  isSystem: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface RoleDetails extends Role {
  permissions: Permission[]
}

export interface ListRolesParams {
  includeArchived?: boolean
}

export interface CreateRoleParams {
  name: string
  description?: string | null
  permissionKeys?: string[]
}

export interface UpdateRoleParams {
  roleId: number
  name: string
  description?: string | null
}

export interface SetRolePermissionsParams {
  roleId: number
  permissionKeys: string[]
}

export interface ArchiveRoleParams {
  roleId: number
}

export interface DeleteRoleParams {
  roleId: number
}

export interface RoleOperationResult {
  success: boolean
  role?: RoleDetails
}
