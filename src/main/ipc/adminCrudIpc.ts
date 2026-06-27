import { ipcMain } from 'electron'
import type {
  AdminCrudArchiveParams,
  AdminCrudCreateParams,
  AdminCrudDeleteParams,
  AdminCrudGetByIdParams,
  AdminCrudListParams,
  AdminCrudUpdateParams
} from '../../shared/types/adminCrud'
import { getDatabase } from '../database/connection'
import { AdminCrudRepository } from '../repositories/adminCrudRepository'
import { AdminCrudService } from '../services/adminCrudService'

export function registerAdminCrudIpcHandlers(): void {
  const repository = new AdminCrudRepository(getDatabase())
  const service = new AdminCrudService(repository)

  ipcMain.handle('adminCrud:list', (_event, params: AdminCrudListParams) => {
    return service.list(params)
  })

  ipcMain.handle('adminCrud:getById', (_event, params: AdminCrudGetByIdParams) => {
    return service.getById(params)
  })

  ipcMain.handle('adminCrud:create', (_event, params: AdminCrudCreateParams) => {
    return service.create(params)
  })

  ipcMain.handle('adminCrud:update', (_event, params: AdminCrudUpdateParams) => {
    return service.update(params)
  })

  ipcMain.handle('adminCrud:archive', (_event, params: AdminCrudArchiveParams) => {
    return service.archive(params)
  })

  ipcMain.handle('adminCrud:delete', (_event, params: AdminCrudDeleteParams) => {
    return service.delete(params)
  })
}
