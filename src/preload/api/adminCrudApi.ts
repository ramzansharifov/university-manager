import { ipcRenderer } from 'electron'
import type {
  AdminCrudCreateParams,
  AdminCrudDeleteParams,
  AdminCrudGetByIdParams,
  AdminCrudListParams,
  AdminCrudListResult,
  AdminCrudOperationResult,
  AdminCrudRecord,
  SaveDepartmentWithFacultiesParams,
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
  saveDepartmentWithFaculties(
    params: SaveDepartmentWithFacultiesParams
  ): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:saveDepartmentWithFaculties', params)
  },

  delete(params: AdminCrudDeleteParams): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:delete', params)
  }
}
