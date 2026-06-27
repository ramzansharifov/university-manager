import type { CreateAuditLogParams } from './audit.types'
import type { AuditRepository } from './auditRepository'

export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  write(params: CreateAuditLogParams): void {
    this.auditRepository.create(params)
  }
}
