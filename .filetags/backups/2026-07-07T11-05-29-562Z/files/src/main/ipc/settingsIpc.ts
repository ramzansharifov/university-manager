import { ipcMain } from 'electron'
import type { UpdateAppSettingsParams } from '../../shared/types/settings'
import { AuditRepository } from '../audit/auditRepository'
import { AuditService } from '../audit/auditService'
import { getDatabase } from '../database/connection'
import { SettingsRepository } from '../settings/settingsRepository'
import { SettingsService } from '../settings/settingsService'

export function registerSettingsIpcHandlers(): void {
  const database = getDatabase()

  const auditRepository = new AuditRepository(database)
  const auditService = new AuditService(auditRepository)

  const settingsRepository = new SettingsRepository(database)
  const settingsService = new SettingsService(settingsRepository, auditService)

  ipcMain.handle('settings:get', () => {
    return settingsService.getSettings()
  })

  ipcMain.handle('settings:update', (_event, params: UpdateAppSettingsParams) => {
    return settingsService.updateSettings(params)
  })
}
