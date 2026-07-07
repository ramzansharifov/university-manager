import { ipcMain } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import type {
  AdminCrudAccessModule,
  AdminCrudCreateParams,
  AdminCrudDeleteParams,
  AdminCrudGetByIdParams,
  AdminCrudListParams,
  SaveDepartmentWithFacultiesParams,
  AdminCrudUpdateParams
} from '../../shared/types/adminCrud'
import { AuditRepository } from '../audit/auditRepository'
import { AuditService } from '../audit/auditService'
import { AuthRepository } from '../auth/authRepository'
import { AuthService } from '../auth/authService'
import { getDatabase } from '../database/connection'
import { AdminCrudRepository } from '../repositories/adminCrudRepository'
import { AdminCrudService } from '../services/adminCrudService'
import { requireAdminCrudAccess, type AdminCrudAccessAction } from '../security/adminCrudAccess'

type GuardedAdminCrudParams =
  | AdminCrudListParams
  | AdminCrudGetByIdParams
  | AdminCrudCreateParams
  | AdminCrudUpdateParams
  | AdminCrudDeleteParams
  | SaveDepartmentWithFacultiesParams

export function registerAdminCrudIpcHandlers(): void {
  const database = getDatabase()

  const auditRepository = new AuditRepository(database)
  const auditService = new AuditService(auditRepository)

  const authRepository = new AuthRepository(database)
  const authService = new AuthService(authRepository, auditService)

  const repository = new AdminCrudRepository(database)
  const service = new AdminCrudService(repository, auditService)

  function requireAccess(
    event: IpcMainInvokeEvent,
    params: GuardedAdminCrudParams,
    action: AdminCrudAccessAction,
    fallbackModule?: AdminCrudAccessModule
  ): void {
    requireAdminCrudAccess(event, authService, params, action, fallbackModule)
  }

  ipcMain.handle('adminCrud:list', (event, params: AdminCrudListParams) => {
    requireAccess(event, params, 'view')

    return service.list(params)
  })

  ipcMain.handle('adminCrud:getById', (event, params: AdminCrudGetByIdParams) => {
    requireAccess(event, params, 'view')

    return service.getById(params)
  })

  ipcMain.handle('adminCrud:create', (event, params: AdminCrudCreateParams) => {
    requireAccess(event, params, 'create')

    return service.create(params)
  })

  ipcMain.handle('adminCrud:update', (event, params: AdminCrudUpdateParams) => {
    requireAccess(event, params, 'update')

    return service.update(params)
  })

  ipcMain.handle(
    'adminCrud:saveDepartmentWithFaculties',
    (event, params: SaveDepartmentWithFacultiesParams) => {
      requireAccess(event, params, params.id === undefined ? 'create' : 'update', 'university')

      return service.saveDepartmentWithFaculties(params)
    }
  )

  ipcMain.handle('adminCrud:delete', (event, params: AdminCrudDeleteParams) => {
    requireAccess(event, params, 'delete')

    return service.delete(params)
  })
}
