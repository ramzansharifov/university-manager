import { ipcMain } from 'electron'
import { DataQualityRepository } from '../dataQuality/dataQualityRepository'
import { DataQualityService } from '../dataQuality/dataQualityService'
import { getDatabase } from '../database/connection'
import { DatabaseTransferService } from '../database/databaseTransferService'
import { HealthRepository } from '../health/healthRepository'
import { HealthService } from '../health/healthService'

export function registerSystemIpcHandlers(): void {
  const database = getDatabase()
  const databaseTransferService = new DatabaseTransferService(database)

  const healthRepository = new HealthRepository(database)
  const healthService = new HealthService(healthRepository)

  const dataQualityRepository = new DataQualityRepository(database)
  const dataQualityService = new DataQualityService(dataQualityRepository)

  ipcMain.handle('system:getHealthReport', () => {
    return healthService.getHealthReport()
  })

  ipcMain.handle('system:getDataQualityReport', () => {
    return dataQualityService.getReport()
  })

  ipcMain.handle('system:exportDatabaseToJson', () => {
    return databaseTransferService.exportToJson()
  })

  ipcMain.handle('system:importDatabaseFromJson', () => {
    return databaseTransferService.importFromJson()
  })

  ipcMain.handle('system:resetDatabase', () => {
    return databaseTransferService.resetDatabase()
  })
}
