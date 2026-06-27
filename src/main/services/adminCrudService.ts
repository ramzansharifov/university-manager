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
import { getAdminCrudEntityConfig } from '../admin/adminCrudEntities'
import type { AdminCrudRepository } from '../repositories/adminCrudRepository'

export class AdminCrudService {
  constructor(private readonly repository: AdminCrudRepository) {}

  list(params: AdminCrudListParams): AdminCrudListResult {
    const config = getAdminCrudEntityConfig(params.entity)

    return this.repository.list(config, params)
  }

  getById(params: AdminCrudGetByIdParams): AdminCrudRecord | null {
    const config = getAdminCrudEntityConfig(params.entity)

    return this.repository.getById(config, params.id)
  }

  create(params: AdminCrudCreateParams): AdminCrudOperationResult {
    const config = getAdminCrudEntityConfig(params.entity)
    const created = this.repository.create(config, params.data)

    this.writeAuditLog({
      action: 'create',
      module: 'admin_crud',
      entityName: params.entity,
      entityId: Number(created.id),
      before: null,
      after: created
    })

    return {
      success: true,
      item: created
    }
  }

  update(params: AdminCrudUpdateParams): AdminCrudOperationResult {
    const config = getAdminCrudEntityConfig(params.entity)
    const before = this.repository.getById(config, params.id)

    if (!before) {
      throw new Error('Record not found')
    }

    const updated = this.repository.update(config, params.id, params.data)

    this.writeAuditLog({
      action: 'update',
      module: 'admin_crud',
      entityName: params.entity,
      entityId: params.id,
      before,
      after: updated
    })

    return {
      success: true,
      item: updated
    }
  }

  archive(params: AdminCrudArchiveParams): AdminCrudOperationResult {
    const config = getAdminCrudEntityConfig(params.entity)
    const before = this.repository.getById(config, params.id)

    if (!before) {
      throw new Error('Record not found')
    }

    const archived = this.repository.archive(config, params.id)

    this.writeAuditLog({
      action: 'archive',
      module: 'admin_crud',
      entityName: params.entity,
      entityId: params.id,
      before,
      after: archived
    })

    return {
      success: true,
      item: archived
    }
  }

  delete(params: AdminCrudDeleteParams): AdminCrudOperationResult {
    const config = getAdminCrudEntityConfig(params.entity)
    const before = this.repository.getById(config, params.id)

    if (!before) {
      throw new Error('Record not found')
    }

    this.repository.delete(config, params.id)

    this.writeAuditLog({
      action: 'delete',
      module: 'admin_crud',
      entityName: params.entity,
      entityId: params.id,
      before,
      after: null
    })

    return {
      success: true
    }
  }

  private writeAuditLog(params: {
    action: string
    module: string
    entityName: string
    entityId: number | null
    before: AdminCrudRecord | null
    after: AdminCrudRecord | null
  }): void {
    this.repository['database']
      .prepare(
        `
        INSERT INTO audit_logs (
          user_id,
          action,
          module,
          entity_name,
          entity_id,
          before_json,
          after_json
        )
        VALUES (
          NULL,
          @action,
          @module,
          @entityName,
          @entityId,
          @beforeJson,
          @afterJson
        )
      `
      )
      .run({
        action: params.action,
        module: params.module,
        entityName: params.entityName,
        entityId: params.entityId,
        beforeJson: params.before ? JSON.stringify(params.before) : null,
        afterJson: params.after ? JSON.stringify(params.after) : null
      })
  }
}
