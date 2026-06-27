import { ipcMain } from 'electron'
import { DataQualityRepository } from '../dataQuality/dataQualityRepository'
import { DataQualityService } from '../dataQuality/dataQualityService'
import { getDatabase } from '../database/connection'
import { HealthRepository } from '../health/healthRepository'
import { HealthService } from '../health/healthService'

export function registerSystemIpcHandlers(): void {
  const database = getDatabase()

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
}
