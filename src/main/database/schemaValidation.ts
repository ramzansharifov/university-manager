import type Database from 'better-sqlite3'
import { adminCrudEntities } from '../admin/adminCrudEntities'

interface TableInfoRow {
  name: string
}

const requiredInfrastructureColumns: Record<string, string[]> = {
  schema_migrations: ['id', 'name', 'applied_at'],
  role_permissions: ['role_id', 'permission_id'],
  user_sessions: ['id', 'user_id', 'token', 'expires_at', 'revoked_at']
}

export function validateDatabaseSchema(database: Database.Database): void {
  Object.values(adminCrudEntities).forEach((config) => {
    const columns = getTableColumns(database, config.tableName)
    const requiredColumns = new Set([
      config.primaryKey,
      config.defaultOrderBy,
      ...config.allowedColumns,
      ...config.searchableColumns
    ])
    const missingColumns = [...requiredColumns].filter((column) => !columns.has(column))

    if (missingColumns.length > 0) {
      throw new Error(
        `Схема таблицы "${config.tableName}" не соответствует admin CRUD. ` +
          `Отсутствуют колонки: ${missingColumns.join(', ')}`
      )
    }
  })

  Object.entries(requiredInfrastructureColumns).forEach(([tableName, requiredColumns]) => {
    const columns = getTableColumns(database, tableName)
    const missingColumns = requiredColumns.filter((column) => !columns.has(column))

    if (missingColumns.length > 0) {
      throw new Error(
        `Системная таблица "${tableName}" имеет неполную схему. ` +
          `Отсутствуют колонки: ${missingColumns.join(', ')}`
      )
    }
  })

  const facultyColumns = getTableColumns(database, 'faculties')
  const legacyFacultyColumns = ['dean_employee_id', 'deputy_dean_employee_id'].filter((column) =>
    facultyColumns.has(column)
  )

  if (legacyFacultyColumns.length > 0) {
    throw new Error(
      `В таблице "faculties" остались устаревшие колонки: ${legacyFacultyColumns.join(', ')}`
    )
  }

  const foreignKeyViolations = database.prepare('PRAGMA foreign_key_check').all()

  if (foreignKeyViolations.length > 0) {
    throw new Error(`Проверка внешних ключей выявила нарушений: ${foreignKeyViolations.length}`)
  }
}

function getTableColumns(database: Database.Database, tableName: string): Set<string> {
  const safeTableName = quoteIdentifier(tableName)
  const rows = database.prepare(`PRAGMA table_info(${safeTableName})`).all() as TableInfoRow[]

  if (rows.length === 0) {
    throw new Error(`Не найдена обязательная таблица "${tableName}"`)
  }

  return new Set(rows.map((row) => row.name))
}

function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Некорректное имя SQL-идентификатора: ${value}`)
  }

  return `"${value}"`
}
