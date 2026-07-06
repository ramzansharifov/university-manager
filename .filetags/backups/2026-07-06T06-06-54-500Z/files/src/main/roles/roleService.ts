import type { AuditService } from '../audit/auditService'
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
import type { RoleRepository } from './roleRepository'

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly auditService: AuditService
  ) {}

  listRoles(_params: ListRolesParams = {}): Role[] {
    return this.roleRepository.listRoles()
  }

  getRoleDetails(roleId: number): RoleDetails | null {
    return this.roleRepository.getRoleDetails(roleId)
  }

  listPermissionGroups(): PermissionGroup[] {
    return this.roleRepository.listPermissionGroups()
  }

  createRole(params: CreateRoleParams): RoleOperationResult {
    const name = params.name.trim()

    if (!name) {
      throw new Error('Role name is required')
    }

    const role = this.roleRepository.createRole({
      ...params,
      name,
      roleKey: createCustomRoleKey(name)
    })

    this.auditService.write({
      action: 'create',
      module: 'roles',
      entityName: 'roles',
      entityId: role.id,
      before: null,
      after: role
    })

    return {
      success: true,
      role
    }
  }

  updateRole(params: UpdateRoleParams): RoleOperationResult {
    const before = this.requireEditableRole(params.roleId)
    const name = params.name.trim()

    if (!name) {
      throw new Error('Role name is required')
    }

    const role = this.roleRepository.updateRole({
      ...params,
      name
    })

    this.auditService.write({
      action: 'update',
      module: 'roles',
      entityName: 'roles',
      entityId: role.id,
      before,
      after: role
    })

    return {
      success: true,
      role
    }
  }

  setRolePermissions(params: SetRolePermissionsParams): RoleOperationResult {
    const before = this.requireEditableRole(params.roleId)

    this.roleRepository.setRolePermissions(params.roleId, params.permissionKeys)

    const role = this.roleRepository.getRoleDetails(params.roleId)

    if (!role) {
      throw new Error('Role not found after permissions update')
    }

    this.auditService.write({
      action: 'change_permissions',
      module: 'roles',
      entityName: 'role_permissions',
      entityId: role.id,
      before,
      after: role
    })

    return {
      success: true,
      role
    }
  }

  deleteRole(params: DeleteRoleParams): RoleOperationResult {
    const before = this.requireEditableRole(params.roleId)
    this.ensureRoleIsNotAssigned(params.roleId)

    this.roleRepository.deleteRole(params.roleId)

    this.auditService.write({
      action: 'delete',
      module: 'roles',
      entityName: 'roles',
      entityId: params.roleId,
      before,
      after: null
    })

    return {
      success: true
    }
  }

  private requireEditableRole(roleId: number): RoleDetails {
    const role = this.roleRepository.getRoleDetails(roleId)

    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystem) {
      throw new Error('System roles cannot be changed')
    }

    return role
  }

  private ensureRoleIsNotAssigned(roleId: number): void {
    const usersCount = this.roleRepository.countUsersByRole(roleId)

    if (usersCount > 0) {
      throw new Error('Cannot delete role assigned to users')
    }
  }
}

function createCustomRoleKey(name: string): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, '_')
    .replace(/^_+|_+$/g, '')

  const safeName = normalized || 'custom_role'

  return `custom_${safeName}_${Date.now()}`
}
