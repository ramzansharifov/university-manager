import type Database from 'better-sqlite3'
import type { AuthUser, CreateUserParams } from '../../shared/types/auth'

interface UserCredentialsRow {
  id: number
  username: string
  password_hash: string
  role_id: number
  profile_type: string
  profile_id: number
  is_active: number
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
