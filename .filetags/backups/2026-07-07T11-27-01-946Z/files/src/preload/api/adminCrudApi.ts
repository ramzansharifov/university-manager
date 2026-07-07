import { ipcRenderer } from 'electron'
import type {
  AdminCrudAccessModule,
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
    return ipcRenderer.invoke('adminCrud:list', withCurrentAccessModule(params))
  },

  getById(params: AdminCrudGetByIdParams): Promise<AdminCrudRecord | null> {
    return ipcRenderer.invoke('adminCrud:getById', withCurrentAccessModule(params))
  },

  create(params: AdminCrudCreateParams): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:create', withCurrentAccessModule(params))
  },

  update(params: AdminCrudUpdateParams): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:update', withCurrentAccessModule(params))
  },

  saveDepartmentWithFaculties(
    params: SaveDepartmentWithFacultiesParams
  ): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke(
      'adminCrud:saveDepartmentWithFaculties',
      withCurrentAccessModule(params)
    )
  },

  delete(params: AdminCrudDeleteParams): Promise<AdminCrudOperationResult> {
    return ipcRenderer.invoke('adminCrud:delete', withCurrentAccessModule(params))
  }
}

function withCurrentAccessModule<TParams extends { accessModule?: AdminCrudAccessModule }>(
  params: TParams
): TParams {
  const accessModule = params.accessModule ?? getCurrentAccessModule()

  if (!accessModule) {
    return params
  }

  return {
    ...params,
    accessModule
  }
}

function getCurrentAccessModule(): AdminCrudAccessModule | undefined {
  const pathname = getCurrentPathname()

  if (pathname === '/') {
    return 'settings'
  }

  if (isExactOrNested(pathname, '/university')) {
    return 'university'
  }

  if (isExactOrNested(pathname, '/people')) {
    return 'people'
  }
  if (isExactOrNested(pathname, '/filters')) {
    return 'people'
  }

  if (isExactOrNested(pathname, '/academic-process')) {
    return 'academic_process'
  }

  if (isExactOrNested(pathname, '/schedule')) {
    return 'schedule'
  }

  if (isExactOrNested(pathname, '/learning-journal')) {
    return 'learning_journal'
  }

  if (isExactOrNested(pathname, '/reports')) {
    return 'reports'
  }

  if (isExactOrNested(pathname, '/administration')) {
    return 'administration'
  }

  if (isExactOrNested(pathname, '/audit-log')) {
    return 'audit_log'
  }

  if (isExactOrNested(pathname, '/settings')) {
    return 'settings'
  }

  return undefined
}

function getCurrentPathname(): string {
  const runtimeGlobal = globalThis as {
    location?: {
      pathname?: string
    }
  }

  const pathname = runtimeGlobal.location?.pathname ?? '/'

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function isExactOrNested(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}
