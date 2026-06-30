export type AppHealthStatus = 'ok' | 'warning' | 'error'

export interface AppHealthReport {
  status: AppHealthStatus
  generatedAt: string
  database: {
    connected: boolean
  }
  migrations: {
    appliedCount: number
    lastMigrationName: string | null
    lastMigrationAppliedAt: string | null
  }
  seed: {
    systemRolesCount: number
    permissionsCount: number
    adminUserExists: boolean
  }
}

export type DataQualitySeverity = 'info' | 'warning' | 'error'

export type DataQualityCheckStatus = 'passed' | 'warning' | 'failed'

export interface DataQualityCheckResult {
  id: string
  module: string
  title: string
  description: string
  severity: DataQualitySeverity
  status: DataQualityCheckStatus
  count: number
}

export interface DataQualityReport {
  generatedAt: string
  readinessPercent: number
  summary: {
    totalChecks: number
    passedChecks: number
    warningChecks: number
    failedChecks: number
  }
  checks: DataQualityCheckResult[]
  issues: DataQualityCheckResult[]
}

export interface DatabaseMaintenanceResult {
  success: boolean
  canceled?: boolean
  filePath?: string
  tablesCount?: number
  rowsCount?: number
  message: string
}
