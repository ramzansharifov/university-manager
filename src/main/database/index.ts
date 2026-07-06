import { getDatabase } from './connection'
import { runMigrations } from './migrations'
import { seedDatabase } from '../seed/seedDatabase'
import { validateDatabaseSchema } from './schemaValidation'
import { repairDatabaseSchema } from './schemaRepair'

export function initializeDatabase(): void {
  const database = getDatabase()

  runMigrations(database)
  repairDatabaseSchema(database)
  validateDatabaseSchema(database)
  seedDatabase(database)
  validateDatabaseSchema(database)
}
