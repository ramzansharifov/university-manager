import type Database from 'better-sqlite3'
import type {
  AuthUser,
  AuthUserListItem,
  CreateUserParams,
  UpdateUserParams
} from '../../shared/types/auth'

interface UserCredentialsRow {
  id: number
  username: string
  password_hash: string
  role_id: number
  profile_type: string
  profile_id: number
  is_active: number
}

interface UserListRow {
  id: number
  username: string
  roleId: number
  roleKey: string
  roleName: string
  profileType: AuthUserListItem['profileType']
  profileId: number
  profileName: string | null
  isActive: number
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

interface SessionRow {
  user_id: number
  expires_at: string | null
  revoked_at: string | null
}

interface CreateUserRepositoryParams extends CreateUserParams {
  passwordHash: string
}

export class AuthRepository {
  constructor(private readonly database: Database.Database) {}

  findUserCredentialsByUsername(username: string): UserCredentialsRow | null {
    const row = this.database
      .prepare(
        `
        SELECT
          id,
          username,
          password_hash,
          role_id,
          profile_type,
          profile_id,
          is_active
        FROM app_users
        WHERE username = ?
        LIMIT 1
      `
      )
      .get(username) as UserCredentialsRow | undefined

    return row ?? null
  }

  listUsers(): AuthUserListItem[] {
    const rows = this.database
      .prepare(
        `
        SELECT
          app_users.id,
          app_users.username,
          app_users.role_id as roleId,
          roles.role_key as roleKey,
          roles.name as roleName,
          app_users.profile_type as profileType,
          app_users.profile_id as profileId,
          CASE app_users.profile_type
            WHEN 'student' THEN (
              SELECT trim(students.last_name || ' ' || students.first_name || ' ' || coalesce(students.middle_name, ''))
              FROM students
              WHERE students.id = app_users.profile_id
              LIMIT 1
            )
            WHEN 'teacher' THEN (
              SELECT trim(teachers.last_name || ' ' || teachers.first_name || ' ' || coalesce(teachers.middle_name, ''))
              FROM teachers
              WHERE teachers.id = app_users.profile_id
              LIMIT 1
            )
            WHEN 'employee' THEN (
              SELECT trim(employees.last_name || ' ' || employees.first_name || ' ' || coalesce(employees.middle_name, ''))
              FROM employees
              WHERE employees.id = app_users.profile_id
              LIMIT 1
            )
            ELSE 'Системный пользователь'
          END as profileName,
          app_users.is_active as isActive,
          app_users.last_login_at as lastLoginAt,
          app_users.created_at as createdAt,
          app_users.updated_at as updatedAt
        FROM app_users
        JOIN roles ON roles.id = app_users.role_id
        ORDER BY app_users.created_at DESC, app_users.username ASC
      `
      )
      .all() as UserListRow[]

    return rows.map(mapUserListRow)
  }

  getAuthUserById(userId: number): AuthUser | null {
    const row = this.database
      .prepare(
        `
        SELECT
          app_users.id,
          app_users.username,
          app_users.role_id as roleId,
          roles.role_key as roleKey,
          roles.name as roleName,
          app_users.profile_type as profileType,
          app_users.profile_id as profileId,
          app_users.is_active as isActive
        FROM app_users
        JOIN roles ON roles.id = app_users.role_id
        WHERE app_users.id = ?
        LIMIT 1
      `
      )
      .get(userId) as
      | {
          id: number
          username: string
          roleId: number
          roleKey: string
          roleName: string
          profileType: AuthUser['profileType']
          profileId: number
          isActive: number
        }
      | undefined

    if (!row) {
      return null
    }

    return {
      id: row.id,
      username: row.username,
      roleId: row.roleId,
      roleKey: row.roleKey,
      roleName: row.roleName,
      profileType: row.profileType,
      profileId: row.profileId,
      isActive: row.isActive === 1,
      permissions: this.getUserPermissions(row.roleId)
    }
  }

  createSession(userId: number, token: string, expiresAt: string): void {
    this.database
      .prepare(
        `
        INSERT INTO user_sessions (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `
      )
      .run(userId, token, expiresAt)
  }

  findSession(token: string): SessionRow | null {
    const row = this.database
      .prepare(
        `
        SELECT user_id, expires_at, revoked_at
        FROM user_sessions
        WHERE token = ?
        LIMIT 1
      `
      )
      .get(token) as SessionRow | undefined

    return row ?? null
  }

  revokeSession(token: string): void {
    this.database
      .prepare(
        `
        UPDATE user_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE token = ?
      `
      )
      .run(token)
  }

  updateLastLogin(userId: number): void {
    this.database
      .prepare(
        `
        UPDATE app_users
        SET last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .run(userId)
  }

  createUser(params: CreateUserRepositoryParams): AuthUser {
    const result = this.database
      .prepare(
        `
        INSERT INTO app_users (
          role_id,
          username,
          password_hash,
          profile_type,
          profile_id,
          is_active
        )
        VALUES (
          @roleId,
          @username,
          @passwordHash,
          @profileType,
          @profileId,
          @isActive
        )
      `
      )
      .run({
        roleId: params.roleId,
        username: params.username,
        passwordHash: params.passwordHash,
        profileType: params.profileType,
        profileId: params.profileId,
        isActive: params.isActive === false ? 0 : 1
      })

    const user = this.getAuthUserById(Number(result.lastInsertRowid))

    if (!user) {
      throw new Error('Created user not found')
    }

    return user
  }

  updateUser(params: UpdateUserParams): AuthUser {
    this.database
      .prepare(
        `
        UPDATE app_users
        SET
          username = @username,
          role_id = @roleId,
          profile_type = @profileType,
          profile_id = @profileId,
          is_active = @isActive,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @userId
      `
      )
      .run({
        userId: params.userId,
        username: params.username,
        roleId: params.roleId,
        profileType: params.profileType,
        profileId: params.profileId,
        isActive: params.isActive ? 1 : 0
      })

    const user = this.getAuthUserById(params.userId)

    if (!user) {
      throw new Error('Updated user not found')
    }

    return user
  }

  setUserActive(userId: number, isActive: boolean): AuthUser {
    this.database
      .prepare(
        `
        UPDATE app_users
        SET
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .run(isActive ? 1 : 0, userId)

    const user = this.getAuthUserById(userId)

    if (!user) {
      throw new Error('Updated user not found')
    }

    return user
  }

  changePassword(userId: number, passwordHash: string): void {
    this.database
      .prepare(
        `
        UPDATE app_users
        SET password_hash = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .run(passwordHash, userId)
  }

  roleExists(roleId: number): boolean {
    const row = this.database.prepare('SELECT id FROM roles WHERE id = ? LIMIT 1').get(roleId)

    return Boolean(row)
  }

  userExists(userId: number): boolean {
    const row = this.database.prepare('SELECT id FROM app_users WHERE id = ? LIMIT 1').get(userId)

    return Boolean(row)
  }

  private getUserPermissions(roleId: number): string[] {
    const rows = this.database
      .prepare(
        `
        SELECT permissions.permission_key
        FROM role_permissions
        JOIN permissions ON permissions.id = role_permissions.permission_id
        WHERE role_permissions.role_id = ?
        ORDER BY permissions.permission_key ASC
      `
      )
      .all(roleId) as Array<{ permission_key: string }>

    return rows.map((row) => row.permission_key)
  }
}

function mapUserListRow(row: UserListRow): AuthUserListItem {
  return {
    id: row.id,
    username: row.username,
    roleId: row.roleId,
    roleKey: row.roleKey,
    roleName: row.roleName,
    profileType: row.profileType,
    profileId: row.profileId,
    profileName: row.profileName,
    isActive: row.isActive === 1,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}
