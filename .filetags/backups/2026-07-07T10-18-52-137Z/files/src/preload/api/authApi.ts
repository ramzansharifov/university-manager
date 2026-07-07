import { ipcRenderer } from 'electron'
import type {
  AuthUser,
  AuthUserListItem,
  ChangePasswordParams,
  ChangePasswordResult,
  CreateUserParams,
  CreateUserResult,
  GetCurrentUserParams,
  ListUsersParams,
  LoginParams,
  LoginResult,
  LogoutParams,
  LogoutResult,
  SetUserActiveParams,
  SetUserActiveResult,
  UpdateUserParams,
  UpdateUserResult
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

  listUsers(params?: ListUsersParams): Promise<AuthUserListItem[]> {
    return ipcRenderer.invoke('auth:listUsers', params)
  },

  createUser(params: CreateUserParams): Promise<CreateUserResult> {
    return ipcRenderer.invoke('auth:createUser', params)
  },

  updateUser(params: UpdateUserParams): Promise<UpdateUserResult> {
    return ipcRenderer.invoke('auth:updateUser', params)
  },

  setUserActive(params: SetUserActiveParams): Promise<SetUserActiveResult> {
    return ipcRenderer.invoke('auth:setUserActive', params)
  },

  changePassword(params: ChangePasswordParams): Promise<ChangePasswordResult> {
    return ipcRenderer.invoke('auth:changePassword', params)
  }
}
