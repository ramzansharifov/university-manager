import type Database from 'better-sqlite3'

interface TableInfoRow {
  name: string
}

const academicVacationsSql = `
  CREATE TABLE IF NOT EXISTS academic_vacations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER NOT NULL,
    vacation_type TEXT NOT NULL,
    name TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    description TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
    UNIQUE (academic_year_id, vacation_type)
  );
`

const departmentFacultiesSql = `
  CREATE TABLE IF NOT EXISTS department_faculties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    UNIQUE (department_id, faculty_id)
  );
`

/**
 * Repairs schema drift caused by manually or partially applied historical migrations.
 *
 * The repair is additive: it never removes tables, columns, or user records. Legacy
 * columns may remain in upgraded databases, but application code neither reads nor
 * writes them.
 */
export function repairDatabaseSchema(database: Database.Database): void {
  const repairTransaction = database.transaction(() => {
    ensureColumn(database, 'faculties', 'dean_teacher_id', 'INTEGER')
    ensureColumn(database, 'faculties', 'deputy_dean_teacher_id', 'INTEGER')

    if (tableExists(database, 'academic_years')) {
      database.exec(academicVacationsSql)
    }

    if (tableExists(database, 'departments')) {
      database.exec(departmentFacultiesSql)
      ensureColumn(
        database,
        'departments',
        'applies_to_all_faculties',
        'INTEGER NOT NULL DEFAULT 0'
      )
      migrateLegacyDepartmentFacultyId(database)
    }
  })

  repairTransaction()
}

function migrateLegacyDepartmentFacultyId(database: Database.Database): void {
  if (!columnExists(database, 'departments', 'faculty_id')) {
    return
  }

  database.exec(`
    INSERT OR IGNORE INTO department_faculties (department_id, faculty_id)
    SELECT d.id, d.faculty_id
    FROM departments d
    WHERE d.faculty_id IS NOT NULL
  `)
}

function ensureColumn(
  database: Database.Database,
  tableName: string,
  columnName: string,
  columnDefinition: string
): void {
  if (!tableExists(database, tableName)) {
    return
  }

  if (columnExists(database, tableName, columnName)) {
    return
  }

  database.exec(
    `ALTER TABLE ${quoteIdentifier(tableName)} ADD COLUMN ${quoteIdentifier(columnName)} ${columnDefinition}`
  )
}

function tableExists(database: Database.Database, tableName: string): boolean {
  const row = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName)

  return Boolean(row)
}

function columnExists(database: Database.Database, tableName: string, columnName: string): boolean {
  const columns = getTableColumns(database, tableName)
  return columns.has(columnName)
}

function getTableColumns(database: Database.Database, tableName: string): Set<string> {
  const rows = database
    .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
    .all() as TableInfoRow[]

  return new Set(rows.map((row) => row.name))
}

function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Некорректное имя SQL-идентификатора: ${value}`)
  }

  return `"${value}"`
}
