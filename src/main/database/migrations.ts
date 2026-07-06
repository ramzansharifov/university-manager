import type Database from 'better-sqlite3'
import { app } from 'electron'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const migrationsDirectory = resolveMigrationsDirectory()

  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()

  const migrationTransaction = database.transaction((fileName: string, sql: string) => {
    database.exec(sql)

    database
      .prepare(
        `
      INSERT INTO schema_migrations (name)
      VALUES (?)
    `
      )
      .run(fileName)
  })

  for (const fileName of migrationFiles) {
    const appliedMigration = database
      .prepare('SELECT id FROM schema_migrations WHERE name = ?')
      .get(fileName)

    if (appliedMigration) {
      continue
    }

    const filePath = join(migrationsDirectory, fileName)
    const sql = readFileSync(filePath, 'utf8')

    try {
      migrationTransaction(fileName, sql)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      throw new Error(`Не удалось применить миграцию ${fileName}: ${message}`, {
        cause: error
      })
    }
  }
}

function resolveMigrationsDirectory(): string {
  const candidates = [
    join(process.resourcesPath, 'migrations'),
    join(app.getAppPath(), 'src/main/migrations'),
    join(process.cwd(), 'src/main/migrations')
  ]
  const migrationsDirectory = candidates.find((candidate) => existsSync(candidate))

  if (!migrationsDirectory) {
    throw new Error(`Каталог миграций не найден. Проверены пути: ${candidates.join(', ')}`)
  }

  return migrationsDirectory
}
