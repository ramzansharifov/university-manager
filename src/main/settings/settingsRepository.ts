import type Database from 'better-sqlite3'

export class SettingsRepository {
  constructor(private readonly database: Database.Database) {}

  getValue(key: string): string | null {
    const row = this.database
      .prepare(
        `
        SELECT setting_value
        FROM app_settings
        WHERE setting_key = ?
      `
      )
      .get(key) as { setting_value: string | null } | undefined

    return row?.setting_value ?? null
  }

  setValue(key: string, value: string): void {
    this.database
      .prepare(
        `
        INSERT INTO app_settings (setting_key, setting_value)
        VALUES (@key, @value)
        ON CONFLICT(setting_key)
        DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `
      )
      .run({
        key,
        value
      })
  }
}
