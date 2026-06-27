import type Database from 'better-sqlite3'
import type {
  CreateRoleParams,
  Permission,
  PermissionGroup,
  Role,
  RoleDetails,
  UpdateRoleParams
} from '../../shared/types/roles'

interface RoleRow {
  id: number
  role_key: string
  name: string
  description: string | null
  is_system: number
  is_archived: number
  created_at: string
  updated_at: string
}

interface PermissionRow {
  id: number
  permission_key: string
  module: string
  action: string
  name: string
}

export class RoleRepository {
  constructor(private readonly database: Database.Database) {}

  listRoles(includeArchived = false): Role[] {
    const rows = this.database
      .prepare(
        `
        SELECT *
        FROM roles
        ${includeArchived ? '' : 'WHERE is_archived = 0'}
        ORDER BY is_system DESC, name ASC
      `
      )
      .all() as RoleRow[]

    return rows.map(mapRoleRow)
  }

  getRoleById(roleId: number): Role | null {
    const row = this.database
      .prepare(
        `
        SELECT *
        FROM roles
        WHERE id = ?
        LIMIT 1
      `
      )
      .get(roleId) as RoleRow | undefined

    return row ? mapRoleRow(row) : null
  }

  getRoleDetails(roleId: number): RoleDetails | null {
    const role = this.getRoleById(roleId)

    if (!role) {
      return null
    }

    return {
      ...role,
      permissions: this.getRolePermissions(roleId)
    }
  }

  listPermissions(): Permission[] {
    const rows = this.database
      .prepare(
        `
        SELECT *
        FROM permissions
        ORDER BY module ASC, action ASC
      `
      )
      .all() as PermissionRow[]

    return rows.map(mapPermissionRow)
  }

  listPermissionGroups(): PermissionGroup[] {
    const permissions = this.listPermissions()
    const groups = new Map<string, Permission[]>()

    for (const permission of permissions) {
      const group = groups.get(permission.module) ?? []
      group.push(permission)
      groups.set(permission.module, group)
    }

    return Array.from(groups.entries()).map(([module, groupPermissions]) => ({
      module,
      permissions: groupPermissions
    }))
  }

  getRolePermissions(roleId: number): Permission[] {
    const rows = this.database
      .prepare(
        `
        SELECT
          permissions.id,
          permissions.permission_key,
          permissions.module,
          permissions.action,
          permissions.name
        FROM role_permissions
        JOIN permissions ON permissions.id = role_permissions.permission_id
        WHERE role_permissions.role_id = ?
        ORDER BY permissions.module ASC, permissions.action ASC
      `
      )
      .all(roleId) as PermissionRow[]

    return rows.map(mapPermissionRow)
  }

  createRole(params: CreateRoleParams & { roleKey: string }): RoleDetails {
    const result = this.database
      .prepare(
        `
        INSERT INTO roles (
          role_key,
          name,
          description,
          is_system
        )
        VALUES (
          @roleKey,
          @name,
          @description,
          0
        )
      `
      )
      .run({
        roleKey: params.roleKey,
        name: params.name,
        description: params.description ?? null
      })

    const roleId = Number(result.lastInsertRowid)

    if (params.permissionKeys?.length) {
      this.setRolePermissions(roleId, params.permissionKeys)
    }

    const role = this.getRoleDetails(roleId)

    if (!role) {
      throw new Error('Created role not found')
    }

    return role
  }

  updateRole(params: UpdateRoleParams): RoleDetails {
    this.database
      .prepare(
        `
        UPDATE roles
        SET
          name = @name,
          description = @description,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @roleId
      `
      )
      .run({
        roleId: params.roleId,
        name: params.name,
        description: params.description ?? null
      })

    const role = this.getRoleDetails(params.roleId)

    if (!role) {
      throw new Error('Updated role not found')
    }

    return role
  }

  setRolePermissions(roleId: number, permissionKeys: string[]): void {
    const transaction = this.database.transaction(() => {
      this.database.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId)

      const insertPermission = this.database.prepare(
        `
        INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
        SELECT @roleId, permissions.id
        FROM permissions
        WHERE permissions.permission_key = @permissionKey
      `
      )

      for (const permissionKey of permissionKeys) {
        insertPermission.run({
          roleId,
          permissionKey
        })
      }
    })

    transaction()
  }

  archiveRole(roleId: number): RoleDetails {
    this.database
      .prepare(
        `
        UPDATE roles
        SET
          is_archived = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .run(roleId)

    const role = this.getRoleDetails(roleId)

    if (!role) {
      throw new Error('Archived role not found')
    }

    return role
  }

  deleteRole(roleId: number): void {
    this.database.prepare('DELETE FROM roles WHERE id = ?').run(roleId)
  }

  countUsersByRole(roleId: number): number {
    const row = this.database
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM app_users
        WHERE role_id = ?
      `
      )
      .get(roleId) as { total: number }

    return row.total
  }
}

function mapRoleRow(row: RoleRow): Role {
  return {
    id: row.id,
    roleKey: row.role_key,
    name: row.name,
    description: row.description,
    isSystem: row.is_system === 1,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapPermissionRow(row: PermissionRow): Permission {
  return {
    id: row.id,
    permissionKey: row.permission_key,
    module: row.module,
    action: row.action,
    name: row.name
  }
}
