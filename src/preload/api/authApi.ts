import { ipcRenderer } from 'electron'
import type {
  AuthUser,
  ChangePasswordParams,
  ChangePasswordResult,
  CreateUserParams,
  CreateUserResult,
  GetCurrentUserParams,
  LoginParams,
  LoginResult,
  LogoutParams,
  LogoutResult
} from '../../shared/types/auth'

export const authApi = {
  login(params: LoginParams): Promise<LoginResult> {
    return ipcRenderer.invoke('auth:login', params)
  },

  getCurrentUser(params: GetCurrentUserParams): Promise<AuthUser | null> {
    return ipcRenderer.invoke('auth:getCurrentUser', params)
  },

  logout(params: LogoutParams): Promise<LogoutResult> {
    return ipcRenderer.invoke('auth:logout', params)
  },

  createUser(params: CreateUserParams): Promise<CreateUserResult> {
    return ipcRenderer.invoke('auth:createUser', params)
  },

  changePassword(params: ChangePasswordParams): Promise<ChangePasswordResult> {
    return ipcRenderer.invoke('auth:changePassword', params)
  }
}
