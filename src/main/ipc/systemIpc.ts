import { ipcMain } from 'electron'
import { AuditRepository } from '../audit/auditRepository'
import { AuditService } from '../audit/auditService'
import { AuthRepository } from '../auth/authRepository'
import { AuthService } from '../auth/authService'
import { DataQualityRepository } from '../dataQuality/dataQualityRepository'
import { DataQualityService } from '../dataQuality/dataQualityService'
import { getDatabase } from '../database/connection'
import { DatabaseTransferService } from '../database/databaseTransferService'
import { HealthRepository } from '../health/healthRepository'
import { HealthService } from '../health/healthService'
import { requireAnyModuleAccess, requireModuleAccess } from '../security/ipcAccess'

export function registerSystemIpcHandlers(): void {
  const database = getDatabase()
  const databaseTransferService = new DatabaseTransferService(database)

  const auditRepository = new AuditRepository(database)
  const auditService = new AuditService(auditRepository)

  const authRepository = new AuthRepository(database)
  const authService = new AuthService(authRepository, auditService)

  const healthRepository = new HealthRepository(database)
  const healthService = new HealthService(healthRepository)

  const dataQualityRepository = new DataQualityRepository(database)
  const dataQualityService = new DataQualityService(dataQualityRepository)

  ipcMain.handle('system:getHealthReport', (event) => {
    requireAnyModuleAccess(event, authService, [
      { module: 'settings', action: 'view' },
      { module: 'administration', action: 'view' }
    ])

    return healthService.getHealthReport()
  })

  ipcMain.handle('system:getDataQualityReport', (event) => {
    requireAnyModuleAccess(event, authService, [
      { module: 'settings', action: 'view' },
      { module: 'administration', action: 'view' }
    ])

    return dataQualityService.getReport()
  })

  ipcMain.handle('system:exportDatabaseToJson', (event) => {
    requireModuleAccess(event, authService, 'administration', 'view')

    return databaseTransferService.exportToJson()
  })

  ipcMain.handle('system:importDatabaseFromJson', (event) => {
    requireModuleAccess(event, authService, 'administration', 'update')

    return databaseTransferService.importFromJson()
  })

  ipcMain.handle('system:resetDatabase', (event) => {
    requireModuleAccess(event, authService, 'administration', 'delete')

    return databaseTransferService.resetDatabase()
  })
}
