import { app, dialog } from 'electron'
import type Database from 'better-sqlite3'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { seedDatabase } from '../seed/seedDatabase'
import type { DatabaseMaintenanceResult } from '../../shared/types/system'

interface DatabaseJsonTable {
  name: string
  rows: Record<string, unknown>[]
}

interface DatabaseJsonExport {
  app: 'university-manager'
  version: 1
  exportedAt: string
  tables: DatabaseJsonTable[]
}

interface TableInfoRow {
  name: string
}

const excludedTables = new Set(['schema_migrations'])

export class DatabaseTransferService {
  constructor(private readonly database: Database.Database) {}

  async exportToJson(): Promise<DatabaseMaintenanceResult> {
    const tableNames = this.getTransferTableNames()

    const tables = tableNames.map((tableName) => {
      const rows = this.database
        .prepare(`SELECT * FROM ${quoteIdentifier(tableName)}`)
        .all() as Record<string, unknown>[]

      return {
        name: tableName,
        rows
      }
    })

    const payload: DatabaseJsonExport = {
      app: 'university-manager',
      version: 1,
      exportedAt: new Date().toISOString(),
      tables
    }

    const rowsCount = tables.reduce((sum, table) => sum + table.rows.length, 0)

    const result = await dialog.showSaveDialog({
      title: 'Экспорт данных',
      defaultPath: join(app.getPath('documents'), createExportFileName()),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePath) {
      return {
        success: false,
        canceled: true,
        message: 'Экспорт отменён'
      }
    }

    writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf-8')

    return {
      success: true,
      filePath: result.filePath,
      tablesCount: tables.length,
      rowsCount,
      message: `Экспортировано таблиц: ${tables.length}, строк: ${rowsCount}`
    }
  }

  async importFromJson(): Promise<DatabaseMaintenanceResult> {
    const result = await dialog.showOpenDialog({
      title: 'Импорт данных',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        canceled: true,
        message: 'Импорт отменён'
      }
    }

    const filePath = result.filePaths[0]
    const payload = this.parseImportFile(readFileSync(filePath, 'utf-8'))

    const tableNames = this.getTransferTableNames()
    const existingTables = new Set(tableNames)
    const importedTables = payload.tables.filter((table) => existingTables.has(table.name))

    if (importedTables.length === 0) {
      throw new Error('В файле импорта нет таблиц, подходящих для текущей базы')
    }

    const rowsCount = importedTables.reduce((sum, table) => sum + table.rows.length, 0)

    this.withForeignKeysDisabled(() => {
      const transaction = this.database.transaction(() => {
        this.clearTables(tableNames)

        importedTables.forEach((table) => {
          this.insertRows(table.name, table.rows)
        })
      })

      transaction()

      const violations = this.database.prepare('PRAGMA foreign_key_check').all()

      if (violations.length > 0) {
        throw new Error('Импорт нарушает связи между таблицами')
      }
    })

    seedDatabase(this.database)

    return {
      success: true,
      filePath,
      tablesCount: importedTables.length,
      rowsCount,
      message: `Импортировано таблиц: ${importedTables.length}, строк: ${rowsCount}`
    }
  }

  resetDatabase(): DatabaseMaintenanceResult {
    const tableNames = this.getTransferTableNames()

    this.withForeignKeysDisabled(() => {
      const transaction = this.database.transaction(() => {
        this.clearTables(tableNames)
      })

      transaction()
    })

    seedDatabase(this.database)

    return {
      success: true,
      tablesCount: tableNames.length,
      rowsCount: 0,
      message: 'База очищена. Системные роли, права, словари и admin/admin созданы заново.'
    }
  }

  private getTransferTableNames(): string[] {
    const rows = this.database
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `
      )
      .all() as Array<{ name: string }>

    return rows.map((row) => row.name).filter((tableName) => !excludedTables.has(tableName))
  }

  private clearTables(tableNames: string[]): void {
    tableNames.forEach((tableName) => {
      this.database.prepare(`DELETE FROM ${quoteIdentifier(tableName)}`).run()
    })

    if (this.tableExists('sqlite_sequence')) {
      tableNames.forEach((tableName) => {
        this.database.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(tableName)
      })
    }
  }

  private insertRows(tableName: string, rows: Record<string, unknown>[]): void {
    if (rows.length === 0) {
      return
    }

    const columns = this.getTableColumns(tableName)

    rows.forEach((row) => {
      const rowColumns = Object.keys(row).filter((column) => columns.has(column))

      if (rowColumns.length === 0) {
        return
      }

      const statement = this.database.prepare(`
        INSERT INTO ${quoteIdentifier(tableName)} (${rowColumns.map(quoteIdentifier).join(', ')})
        VALUES (${rowColumns.map(() => '?').join(', ')})
      `)

      statement.run(...rowColumns.map((column) => row[column] ?? null))
    })
  }

  private getTableColumns(tableName: string): Set<string> {
    const rows = this.database
      .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
      .all() as TableInfoRow[]

    return new Set(rows.map((row) => row.name))
  }

  private tableExists(tableName: string): boolean {
    const row = this.database
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE name = ?
          LIMIT 1
        `
      )
      .get(tableName)

    return Boolean(row)
  }

  private parseImportFile(content: string): DatabaseJsonExport {
    const parsed = JSON.parse(content) as Partial<DatabaseJsonExport>

    if (
      parsed.app !== 'university-manager' ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.tables)
    ) {
      throw new Error('Файл не похож на экспорт University Manager')
    }

    return parsed as DatabaseJsonExport
  }

  private withForeignKeysDisabled<T>(operation: () => T): T {
    const previousValue = Number(this.database.pragma('foreign_keys', { simple: true }))

    this.database.pragma('foreign_keys = OFF')

    try {
      return operation()
    } finally {
      this.database.pragma(previousValue === 1 ? 'foreign_keys = ON' : 'foreign_keys = OFF')
    }
  }
}

function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Некорректное имя SQL-идентификатора: ${value}`)
  }

  return `"${value}"`
}

function createExportFileName(): string {
  const date = new Date().toISOString().slice(0, 10)

  return `university-manager-export-${date}.json`
}
