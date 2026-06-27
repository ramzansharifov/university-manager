import type { AdminCrudRecord } from '../../shared/types/adminCrud'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  | 'restore'
  | 'login'
  | 'logout'
  | 'change_permissions'
  | 'change_settings'

export interface CreateAuditLogParams {
  userId?: number | null
  action: AuditAction | string
  module: string
  entityName: string
  entityId?: number | null
  before?: AdminCrudRecord | null
  after?: AdminCrudRecord | null
}
