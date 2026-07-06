import type Database from 'better-sqlite3'
import type {
  AdminCrudListParams,
  AdminCrudListResult,
  AdminCrudRecord
} from '../../shared/types/adminCrud'
import type { AdminCrudEntityConfig } from '../admin/adminCrudEntities'

interface SqlWhereResult {
  sql: string
  params: Record<string, unknown>
}

const maxAdminCrudPageSize = 50000

export class AdminCrudRepository {
  constructor(private readonly database: Database.Database) {}

  transaction<T>(callback: () => T): T {
    return this.database.transaction(callback)()
  }

  list(config: AdminCrudEntityConfig, params: AdminCrudListParams): AdminCrudListResult {
    const page = normalizePage(params.page)
    const pageSize = normalizePageSize(params.pageSize)
    const offset = (page - 1) * pageSize

    const where = this.buildWhere(config, params)
    const orderBy = this.normalizeOrderBy(config, params.orderBy)
    const orderDirection = params.orderDirection === 'desc' ? 'DESC' : 'ASC'

    const items = this.database
      .prepare(
        `
        SELECT *
        FROM ${config.tableName}
        ${where.sql}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT @limit OFFSET @offset
      `
      )
      .all({
        ...where.params,
        limit: pageSize,
        offset
      }) as AdminCrudRecord[]

    const countResult = this.database
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM ${config.tableName}
        ${where.sql}
      `
      )
      .get(where.params) as { total: number }

    return {
      items,
      total: countResult.total,
      page,
      pageSize,
      totalPages: Math.ceil(countResult.total / pageSize)
    }
  }

  getById(config: AdminCrudEntityConfig, id: number): AdminCrudRecord | null {
    const row = this.database
      .prepare(
        `
        SELECT *
        FROM ${config.tableName}
        WHERE ${config.primaryKey} = ?
      `
      )
      .get(id) as AdminCrudRecord | undefined

    return row ?? null
  }

  create(config: AdminCrudEntityConfig, data: AdminCrudRecord): AdminCrudRecord {
    const safeData = this.pickEditableData(config, data)

    if (Object.keys(safeData).length === 0) {
      throw new Error('No allowed fields provided for create operation')
    }

    const columns = Object.keys(safeData)
    const placeholders = columns.map((column) => `@${column}`)

    const result = this.database
      .prepare(
        `
        INSERT INTO ${config.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
      `
      )
      .run(safeData)

    const created = this.getById(config, Number(result.lastInsertRowid))

    if (!created) {
      throw new Error('Created record not found')
    }

    return created
  }

  update(config: AdminCrudEntityConfig, id: number, data: AdminCrudRecord): AdminCrudRecord {
    const safeData = this.pickEditableData(config, data)

    if (Object.keys(safeData).length === 0) {
      throw new Error('No allowed fields provided for update operation')
    }

    const setParts = Object.keys(safeData).map((column) => `${column} = @${column}`)

    if (config.hasUpdatedAt) {
      setParts.push('updated_at = CURRENT_TIMESTAMP')
    }

    this.database
      .prepare(
        `
        UPDATE ${config.tableName}
        SET ${setParts.join(', ')}
        WHERE ${config.primaryKey} = @id
      `
      )
      .run({
        ...safeData,
        id
      })

    const updated = this.getById(config, id)

    if (!updated) {
      throw new Error('Updated record not found')
    }

    return updated
  }

  delete(config: AdminCrudEntityConfig, id: number): void {
    this.database
      .prepare(
        `
        DELETE FROM ${config.tableName}
        WHERE ${config.primaryKey} = ?
      `
      )
      .run(id)
  }

  private buildWhere(config: AdminCrudEntityConfig, params: AdminCrudListParams): SqlWhereResult {
    const conditions: string[] = []
    const values: Record<string, unknown> = {}

    if (params.search && config.searchableColumns.length > 0) {
      const searchConditions = config.searchableColumns.map((column, index) => {
        const key = `search_${index}`
        values[key] = `%${params.search}%`
        return `${column} LIKE @${key}`
      })

      conditions.push(`(${searchConditions.join(' OR ')})`)
    }

    if (params.filters) {
      Object.entries(params.filters).forEach(([column, value], index) => {
        if (!config.allowedColumns.includes(column) || value === undefined || value === null) {
          return
        }

        const key = `filter_${index}`
        conditions.push(`${column} = @${key}`)
        values[key] = value
      })
    }

    return {
      sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params: values
    }
  }

  private normalizeOrderBy(config: AdminCrudEntityConfig, orderBy?: string): string {
    if (orderBy && config.allowedColumns.includes(orderBy)) {
      return orderBy
    }

    return config.defaultOrderBy
  }

  private pickEditableData(config: AdminCrudEntityConfig, data: AdminCrudRecord): AdminCrudRecord {
    const ignoredColumns = new Set(['id', 'created_at', 'updated_at', 'is_archived'])
    const result: AdminCrudRecord = {}

    Object.entries(data).forEach(([key, value]) => {
      if (ignoredColumns.has(key)) {
        return
      }

      if (!config.allowedColumns.includes(key)) {
        return
      }

      result[key] = value
    })

    return result
  }
}

function normalizePage(page?: number): number {
  if (!page || page < 1) {
    return 1
  }

  return Math.floor(page)
}

function normalizePageSize(pageSize?: number): number {
  if (!pageSize || pageSize < 1) {
    return 20
  }

  return Math.min(Math.floor(pageSize), maxAdminCrudPageSize)
}
