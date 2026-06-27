export type UserProfileType = 'system' | 'student' | 'teacher' | 'employee'

export interface AuthUser {
  id: number
  username: string
  roleId: number
  roleKey: string
  roleName: string
  profileType: UserProfileType
  profileId: number
  isActive: boolean
  permissions: string[]
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  success: boolean
  token: string
  user: AuthUser
}

export interface GetCurrentUserParams {
  token: string
}

export interface LogoutParams {
  token: string
}

export interface LogoutResult {
  success: boolean
}

export interface CreateUserParams {
  username: string
  password: string
  roleId: number
  profileType: UserProfileType
  profileId: number
  isActive?: boolean
}

export interface CreateUserResult {
  success: boolean
  user: AuthUser
}

export interface ChangePasswordParams {
  userId: number
  newPassword: string
}

export interface ChangePasswordResult {
  success: boolean
}
