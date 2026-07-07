import { randomBytes } from 'crypto'
import type {
  AuthUser,
  AuthUserListItem,
  ChangePasswordParams,
  ChangePasswordResult,
  CreateUserParams,
  CreateUserResult,
  GetCurrentUserParams,
  LoginParams,
  LoginResult,
  LogoutParams,
  LogoutResult,
  UserProfileType
} from '../../shared/types/auth'
import type { AuditService } from '../audit/auditService'
import { hashPassword, verifyPassword } from '../security/password'
import type { AuthRepository } from './authRepository'

const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 7

const allowedProfileTypes: UserProfileType[] = ['system', 'student', 'teacher', 'employee']

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly auditService: AuditService
  ) {}

  login(params: LoginParams): LoginResult {
    const username = params.username.trim()

    if (!username || !params.password) {
      throw new Error('Укажите логин и пароль')
    }

    const credentials = this.authRepository.findUserCredentialsByUsername(username)

    if (!credentials || credentials.is_active !== 1) {
      throw new Error('Неверный логин или пароль')
    }

    const passwordIsValid = verifyPassword(params.password, credentials.password_hash)

    if (!passwordIsValid) {
      throw new Error('Неверный логин или пароль')
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + sessionLifetimeMs).toISOString()

    this.authRepository.createSession(credentials.id, token, expiresAt)
    this.authRepository.updateLastLogin(credentials.id)

    const user = this.authRepository.getAuthUserById(credentials.id)

    if (!user) {
      throw new Error('Пользователь не найден после авторизации')
    }

    this.auditService.write({
      userId: user.id,
      action: 'login',
      module: 'auth',
      entityName: 'app_users',
      entityId: user.id,
      before: null,
      after: {
        id: user.id,
        username: user.username
      }
    })

    return {
      success: true,
      token,
      user
    }
  }

  getCurrentUser(params: GetCurrentUserParams): AuthUser | null {
    const session = this.authRepository.findSession(params.token)

    if (!session || session.revoked_at) {
      return null
    }

    if (session.expires_at && Date.parse(session.expires_at) < Date.now()) {
      return null
    }

    const user = this.authRepository.getAuthUserById(session.user_id)

    return user?.isActive ? user : null
  }

  logout(params: LogoutParams): LogoutResult {
    const session = this.authRepository.findSession(params.token)

    if (session && !session.revoked_at) {
      this.authRepository.revokeSession(params.token)

      this.auditService.write({
        userId: session.user_id,
        action: 'logout',
        module: 'auth',
        entityName: 'user_sessions',
        entityId: null,
        before: null,
        after: null
      })
    }

    return {
      success: true
    }
  }

  listUsers(): AuthUserListItem[] {
    return this.authRepository.listUsers()
  }
  createUser(params: CreateUserParams): CreateUserResult {
    this.validateCreateUserParams(params)

    const passwordHash = hashPassword(params.password)

    const user = this.authRepository.createUser({
      ...params,
      username: params.username.trim(),
      passwordHash
    })

    this.auditService.write({
      action: 'create',
      module: 'auth',
      entityName: 'app_users',
      entityId: user.id,
      before: null,
      after: {
        id: user.id,
        username: user.username,
        roleId: user.roleId,
        profileType: user.profileType,
        profileId: user.profileId
      }
    })

    return {
      success: true,
      user
    }
  }

  changePassword(params: ChangePasswordParams): ChangePasswordResult {
    if (!this.authRepository.userExists(params.userId)) {
      throw new Error('Пользователь не найден')
    }

    if (!params.newPassword || params.newPassword.length < 4) {
      throw new Error('Пароль должен содержать не менее 4 символов')
    }

    const passwordHash = hashPassword(params.newPassword)

    this.authRepository.changePassword(params.userId, passwordHash)

    this.auditService.write({
      action: 'update',
      module: 'auth',
      entityName: 'app_users.password',
      entityId: params.userId,
      before: null,
      after: {
        passwordChanged: true
      }
    })

    return {
      success: true
    }
  }

  private validateCreateUserParams(params: CreateUserParams): void {
    const username = params.username.trim()

    if (!username) {
      throw new Error('Укажите логин')
    }

    if (!params.password || params.password.length < 4) {
      throw new Error('Пароль должен содержать не менее 4 символов')
    }

    if (!this.authRepository.roleExists(params.roleId)) {
      throw new Error('Роль не найдена')
    }

    if (!allowedProfileTypes.includes(params.profileType)) {
      throw new Error('Некорректный тип профиля')
    }

    if (!Number.isInteger(params.profileId) || params.profileId < 0) {
      throw new Error('Некорректный идентификатор профиля')
    }
  }
}
