import type { AppHealthReport, AppHealthStatus } from '../../shared/types/system'
import type { HealthRepository } from './healthRepository'

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  getHealthReport(): AppHealthReport {
    const databaseConnected = this.healthRepository.checkConnection()
    const appliedMigrationsCount = databaseConnected
      ? this.healthRepository.getAppliedMigrationsCount()
      : 0

    const lastMigration = databaseConnected ? this.healthRepository.getLastMigration() : null

    const systemRolesCount = databaseConnected ? this.healthRepository.getSystemRolesCount() : 0
    const permissionsCount = databaseConnected ? this.healthRepository.getPermissionsCount() : 0
    const adminUserExists = databaseConnected ? this.healthRepository.adminUserExists() : false

    return {
      status: getHealthStatus({
        databaseConnected,
        appliedMigrationsCount,
        systemRolesCount,
        permissionsCount,
        adminUserExists
      }),
      generatedAt: new Date().toISOString(),
      database: {
        connected: databaseConnected
      },
      migrations: {
        appliedCount: appliedMigrationsCount,
        lastMigrationName: lastMigration?.name ?? null,
        lastMigrationAppliedAt: lastMigration?.applied_at ?? null
      },
      seed: {
        systemRolesCount,
        permissionsCount,
        adminUserExists
      }
    }
  }
}

function getHealthStatus(params: {
  databaseConnected: boolean
  appliedMigrationsCount: number
  systemRolesCount: number
  permissionsCount: number
  adminUserExists: boolean
}): AppHealthStatus {
  if (!params.databaseConnected || params.appliedMigrationsCount === 0) {
    return 'error'
  }

  if (params.systemRolesCount < 3 || params.permissionsCount === 0 || !params.adminUserExists) {
    return 'warning'
  }

  return 'ok'
}
