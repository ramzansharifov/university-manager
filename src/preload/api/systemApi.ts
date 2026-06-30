import { ipcRenderer } from 'electron'
import type {
  AppHealthReport,
  DataQualityReport,
  DatabaseMaintenanceResult
} from '../../shared/types/system'

export const systemApi = {
  getHealthReport(): Promise<AppHealthReport> {
    return ipcRenderer.invoke('system:getHealthReport')
  },

  getDataQualityReport(): Promise<DataQualityReport> {
    return ipcRenderer.invoke('system:getDataQualityReport')
  },

  exportDatabaseToJson(): Promise<DatabaseMaintenanceResult> {
    return ipcRenderer.invoke('system:exportDatabaseToJson')
  },

  importDatabaseFromJson(): Promise<DatabaseMaintenanceResult> {
    return ipcRenderer.invoke('system:importDatabaseFromJson')
  },

  resetDatabase(): Promise<DatabaseMaintenanceResult> {
    return ipcRenderer.invoke('system:resetDatabase')
  }
}
