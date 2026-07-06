import { getDatabase } from './connection'
import { runMigrations } from './migrations'
import { seedDatabase } from '../seed/seedDatabase'
import { validateDatabaseSchema } from './schemaValidation'

export function initializeDatabase(): void {
  const database = getDatabase()

  runMigrations(database)
  validateDatabaseSchema(database)
  seedDatabase(database)
  validateDatabaseSchema(database)
}
