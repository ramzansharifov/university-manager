import { ipcRenderer } from 'electron'
import type { AppHealthReport, DataQualityReport } from '../../shared/types/system'

export const systemApi = {
  getHealthReport(): Promise<AppHealthReport> {
    return ipcRenderer.invoke('system:getHealthReport')
  },

  getDataQualityReport(): Promise<DataQualityReport> {
    return ipcRenderer.invoke('system:getDataQualityReport')
  }
}
