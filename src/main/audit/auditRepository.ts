import type Database from 'better-sqlite3'
import type { CreateAuditLogParams } from './audit.types'

export class AuditRepository {
  constructor(private readonly database: Database.Database) {}

  create(params: CreateAuditLogParams): void {
    this.database
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
          @userId,
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
        userId: params.userId ?? null,
        action: params.action,
        module: params.module,
        entityName: params.entityName,
        entityId: params.entityId ?? null,
        beforeJson: params.before == null ? null : JSON.stringify(params.before),
        afterJson: params.after == null ? null : JSON.stringify(params.after)
      })
  }
}
