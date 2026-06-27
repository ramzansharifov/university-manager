import type Database from 'better-sqlite3'

interface LastMigrationRow {
  name: string
  applied_at: string
}

export class HealthRepository {
  constructor(private readonly database: Database.Database) {}

  checkConnection(): boolean {
    try {
      this.database.prepare('SELECT 1 as ok').get()
      return true
    } catch {
      return false
    }
  }

  getAppliedMigrationsCount(): number {
    const row = this.database
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM schema_migrations
      `
      )
      .get() as { total: number }

    return row.total
  }

  getLastMigration(): LastMigrationRow | null {
    const row = this.database
      .prepare(
        `
        SELECT name, applied_at
        FROM schema_migrations
        ORDER BY id DESC
        LIMIT 1
      `
      )
      .get() as LastMigrationRow | undefined

    return row ?? null
  }

  getSystemRolesCount(): number {
    const row = this.database
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM roles
        WHERE is_system = 1
      `
      )
      .get() as { total: number }

    return row.total
  }

  getPermissionsCount(): number {
    const row = this.database
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM permissions
      `
      )
      .get() as { total: number }

    return row.total
  }

  adminUserExists(): boolean {
    const row = this.database
      .prepare(
        `
        SELECT id
        FROM app_users
        WHERE username = 'admin'
        LIMIT 1
      `
      )
      .get()

    return Boolean(row)
  }
}
