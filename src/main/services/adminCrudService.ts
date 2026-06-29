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
    const preparedData = this.prepareDataForSave(params.entity, params.data)
    const created = this.repository.create(config, preparedData)

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

    const preparedData = this.prepareDataForSave(params.entity, params.data, before)
    const updated = this.repository.update(config, params.id, preparedData)

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

  private prepareDataForSave(
    entity: string,
    data: AdminCrudRecord,
    before?: AdminCrudRecord
  ): AdminCrudRecord {
    if (entity === 'employees') {
      this.validateEmployeePosition(data, before)

      return data
    }

    if (entity === 'audiences') {
      return this.prepareAudienceData(data, before)
    }

    return data
  }

  private prepareAudienceData(data: AdminCrudRecord, before?: AdminCrudRecord): AdminCrudRecord {
    const nextData = { ...data }
    const nextName = String(nextData.name ?? before?.name ?? '').trim()

    nextData.floor = deriveAudienceFloor(nextName)

    return nextData
  }

  private validateEmployeePosition(data: AdminCrudRecord, before?: AdminCrudRecord): void {
    const nextDivisionId = normalizeNullableNumber(data.division_id ?? before?.division_id)
    const nextPositionId = normalizeNullableNumber(data.position_id ?? before?.position_id)

    if (nextPositionId === null) {
      return
    }

    if (nextDivisionId === null) {
      throw new Error('Для выбора должности сначала укажи подразделение сотрудника')
    }

    const positionConfig = getAdminCrudEntityConfig('positions')
    const position = this.repository.getById(positionConfig, nextPositionId)

    if (!position) {
      throw new Error('Выбранная должность не найдена')
    }

    const positionDivisionId = normalizeNullableNumber(position.division_id)

    if (positionDivisionId === null) {
      throw new Error('У выбранной должности не указано подразделение')
    }

    if (positionDivisionId !== nextDivisionId) {
      throw new Error('Выбранная должность не относится к выбранному подразделению')
    }
  }
}

function normalizeNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function deriveAudienceFloor(name: string): number | null {
  const firstDigit = name.trim().match(/^\d/)?.[0]

  if (!firstDigit) {
    return null
  }

  const floor = Number(firstDigit)

  return Number.isFinite(floor) ? floor : null
}
