import { ipcRenderer } from 'electron'
import type {
  AdminCrudArchiveParams,
  AdminCrudCreateParams,
  AdminCrudDeleteParams,
  AdminCrudGetByIdParams,
  AdminCrudListParams,
  AdminCrudListResult,
  AdminCrudOperationResult,
  AdminCrudRecord,
  AdminCrudUpdateParams
} from '../../shared/types/adminCrud'

export const adminCrudApi = {
  list(params: AdminCrudListParams): Promise<AdminCrudListResult> {
    return ipcRenderer.invoke('adminCrud:list', params)
  },

  getById(params: AdminCrudGetByIdParams): Promise<AdminCrudRecord | null> {
    return ipcRenderer.invoke('adminCrud:getById', params)
  },

  create(params: AdminCrudCreateParams): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:create', params)
  },

  update(params: AdminCrudUpdateParams): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:update', params)
  },

  archive(params: AdminCrudArchiveParams): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:archive', params)
  },

  delete(params: AdminCrudDeleteParams): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:delete', params)
  }
}
