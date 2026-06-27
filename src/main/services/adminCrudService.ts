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
import type { AuditService } from '../audit/auditService'
import { getAdminCrudEntityConfig } from '../admin/adminCrudEntities'
import type { AdminCrudRepository } from '../repositories/adminCrudRepository'

export class AdminCrudService {
  constructor(
    private readonly repository: AdminCrudRepository,
    private readonly auditService: AuditService
  ) {}

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

    this.auditService.write({
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

    this.auditService.write({
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

    this.auditService.write({
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

    this.auditService.write({
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
}
