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
    const expectedSystemColumns = [
      config.primaryKey,
      'created_at',
      ...(config.hasUpdatedAt ? ['updated_at'] : []),
      ...(config.supportsArchive ? ['is_archived'] : [])
    ]
    const configuredColumns = new Set([
      config.primaryKey,
      config.defaultOrderBy,
      ...config.allowedColumns,
      ...config.searchableColumns,
      ...expectedSystemColumns
    ])
    const missingColumns = [...configuredColumns].filter((column) => !columns.has(column))

    if (missingColumns.length > 0) {
      throw new Error(
        `Схема таблицы "${config.tableName}" не соответствует admin CRUD. ` +
          `Отсутствуют колонки: ${missingColumns.join(', ')}`
      )
    }

    const invalidSearchColumns = config.searchableColumns.filter(
      (column) => !config.allowedColumns.includes(column)
    )

    if (invalidSearchColumns.length > 0) {
      throw new Error(
        `Конфигурация таблицы "${config.tableName}" содержит недоступные колонки поиска: ` +
          invalidSearchColumns.join(', ')
      )
    }

    if (!config.allowedColumns.includes(config.defaultOrderBy)) {
      throw new Error(
        `Конфигурация таблицы "${config.tableName}" не разрешает сортировку по колонке ` +
          `"${config.defaultOrderBy}"`
      )
    }

    validateSystemColumnConfig(
      config.tableName,
      config.allowedColumns,
      config.hasUpdatedAt,
      config.supportsArchive
    )
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

  getTableColumns(database, 'academic_vacations')

  const facultyColumns = getTableColumns(database, 'faculties')
  const missingFacultyColumns = ['dean_teacher_id', 'deputy_dean_teacher_id'].filter(
    (column) => !facultyColumns.has(column)
  )

  if (missingFacultyColumns.length > 0) {
    throw new Error(
      `Таблица "faculties" не содержит актуальные поля руководителей: ` +
        missingFacultyColumns.join(', ')
    )
  }

  const departmentColumns = getTableColumns(database, 'departments')

  if (!departmentColumns.has('applies_to_all_faculties')) {
    throw new Error(
      'Таблица "departments" не содержит обязательное поле "applies_to_all_faculties"'
    )
  }

  if (departmentColumns.has('faculty_id')) {
    throw new Error(
      'Таблица "departments" всё ещё содержит legacy-поле "faculty_id" после schema repair'
    )
  }

  const specialtyColumns = getTableColumns(database, 'specialties')

  if (specialtyColumns.has('department_id')) {
    throw new Error(
      'Таблица "specialties" всё ещё содержит legacy-поле "department_id" после schema repair'
    )
  }

  const dfColumns = getTableColumns(database, 'department_faculties')
  const requiredDfColumns = ['id', 'department_id', 'faculty_id'].filter(
    (column) => !dfColumns.has(column)
  )

  if (requiredDfColumns.length > 0) {
    throw new Error(
      `Таблица "department_faculties" не содержит обязательные поля: ` +
        requiredDfColumns.join(', ')
    )
  }
}

function validateSystemColumnConfig(
  tableName: string,
  allowedColumns: string[],
  hasUpdatedAt: boolean,
  supportsArchive: boolean
): void {
  const checks: Array<[column: string, expected: boolean]> = [
    ['id', true],
    ['created_at', true],
    ['updated_at', hasUpdatedAt],
    ['is_archived', supportsArchive]
  ]

  const mismatches = checks
    .filter(([column, expected]) => allowedColumns.includes(column) !== expected)
    .map(
      ([column, expected]) => `${column} (${expected ? 'ожидается' : 'не должна использоваться'})`
    )

  if (mismatches.length > 0) {
    throw new Error(
      `Некорректные системные колонки в admin CRUD для таблицы "${tableName}": ` +
        mismatches.join(', ')
    )
  }
}

function getTableColumns(database: Database.Database, tableName: string): Set<string> {
  const rows = database
    .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
    .all() as TableInfoRow[]

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
