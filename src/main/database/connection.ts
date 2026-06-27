import { app } from 'electron'
import { mkdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'

let database: Database.Database | null = null

function createDatabaseConnection(): Database.Database {
  const databaseDirectory = join(app.getPath('userData'), 'database')

  mkdirSync(databaseDirectory, { recursive: true })

  const databasePath = join(databaseDirectory, 'university-manager.sqlite')
  const connection = new Database(databasePath)

  connection.pragma('journal_mode = WAL')
  connection.pragma('foreign_keys = ON')

  return connection
}

export function getDatabase(): Database.Database {
  if (!database) {
    database = createDatabaseConnection()
  }

  return database
}
