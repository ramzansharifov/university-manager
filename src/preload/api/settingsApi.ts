import { ipcRenderer } from 'electron'
import type {
  AppSettings,
  UpdateAppSettingsParams,
  UpdateAppSettingsResult
} from '../../shared/types/settings'

export const settingsApi = {
  get(): Promise<AppSettings> {
    return ipcRenderer.invoke('settings:get')
  },

  update(params: UpdateAppSettingsParams): Promise<UpdateAppSettingsResult> {
    return ipcRenderer.invoke('settings:update', params)
  }
}
