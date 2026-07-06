/// <reference types="vite/client" />

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
import type {
  AdminCrudArchiveParams,
  AdminCrudCreateParams,
  AdminCrudDeleteParams,
  AdminCrudGetByIdParams,
  AdminCrudListParams,
  AdminCrudListResult,
  AdminCrudOperationResult,
  AdminCrudRecord,
  AdminCrudUpdateParams
} from '../../shared/types/adminCrud'
import type {
  AppSettings,
  UpdateAppSettingsParams,
  UpdateAppSettingsResult
} from '../../shared/types/settings'
import type {
  ArchiveRoleParams,
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
import type {
  AppHealthReport,
  DataQualityReport,
  DatabaseMaintenanceResult
} from '../../shared/types/system'

declare global {
  interface Window {
    api: {
      adminCrud: {
        list(params: AdminCrudListParams): Promise<AdminCrudListResult>
        getById(params: AdminCrudGetByIdParams): Promise<AdminCrudRecord | null>
        create(params: AdminCrudCreateParams): Promise<AdminCrudOperationResult>
        update(params: AdminCrudUpdateParams): Promise<AdminCrudOperationResult>
        archive(params: AdminCrudArchiveParams): Promise<AdminCrudOperationResult>
        delete(params: AdminCrudDeleteParams): Promise<AdminCrudOperationResult>
      }

      auth: {
        login(params: LoginParams): Promise<LoginResult>
        getCurrentUser(params: GetCurrentUserParams): Promise<AuthUser | null>
        logout(params: LogoutParams): Promise<LogoutResult>
        createUser(params: CreateUserParams): Promise<CreateUserResult>
        changePassword(params: ChangePasswordParams): Promise<ChangePasswordResult>
      }

      roles: {
        list(params?: ListRolesParams): Promise<Role[]>
        getDetails(roleId: number): Promise<RoleDetails | null>
        listPermissionGroups(): Promise<PermissionGroup[]>
        create(params: CreateRoleParams): Promise<RoleOperationResult>
        update(params: UpdateRoleParams): Promise<RoleOperationResult>
        setPermissions(params: SetRolePermissionsParams): Promise<RoleOperationResult>
        archive(params: ArchiveRoleParams): Promise<RoleOperationResult>
        delete(params: DeleteRoleParams): Promise<RoleOperationResult>
      }

      settings: {
        get(): Promise<AppSettings>
        update(params: UpdateAppSettingsParams): Promise<UpdateAppSettingsResult>
      }

      system: {
        getHealthReport(): Promise<AppHealthReport>
        getDataQualityReport(): Promise<DataQualityReport>
        exportDatabaseToJson(): Promise<DatabaseMaintenanceResult>
        importDatabaseFromJson(): Promise<DatabaseMaintenanceResult>
        resetDatabase(): Promise<DatabaseMaintenanceResult>
      }
    }
  }
}

export {}
