import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { adminCrudApi } from './api/adminCrudApi'
import { authApi } from './api/authApi'
import { settingsApi } from './api/settingsApi'
import { roleApi } from './api/roleApi'
import { systemApi } from './api/systemApi'

const api = {
  adminCrud: adminCrudApi,
  auth: authApi,
  roles: roleApi,
  settings: settingsApi,
  system: systemApi
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore preload fallback
  window.electron = electronAPI

  // @ts-ignore preload fallback
  window.api = api
}
