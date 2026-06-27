import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { adminCrudApi } from './api/adminCrudApi'

const api = {
  adminCrud: adminCrudApi
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
