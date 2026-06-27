import type Database from 'better-sqlite3'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const migrationsDirectory = join(process.cwd(), 'src/main/migrations')

export function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  if (!existsSync(migrationsDirectory)) {
    throw new Error(`Migrations directory not found: ${migrationsDirectory}`)
  }

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

    migrationTransaction(fileName, sql)
  }
}
