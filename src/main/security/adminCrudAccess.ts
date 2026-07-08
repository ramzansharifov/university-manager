import type { IpcMainInvokeEvent } from 'electron'
import type { AdminCrudAccessModule, AdminEntityKey } from '../../shared/types/adminCrud'
import type { AuthService } from '../auth/authService'
import { getAuthTokenForWebContents } from '../auth/sessionContext'
import { canPerformAction } from './accessControl'
import type { AccessAction } from './accessControl'

export type AdminCrudAccessAction = AccessAction

interface AdminCrudAccessParams {
  entity?: AdminEntityKey
  accessModule?: AdminCrudAccessModule
}

const defaultAccessModuleByEntity: Partial<Record<AdminEntityKey, AdminCrudAccessModule>> = {
  faculties: 'university',
  departments: 'university',
  department_faculties: 'university',
  specialties: 'university',
  student_groups: 'university',
  divisions: 'university',
  positions: 'university',

  students: 'people',
  teachers: 'people',
  employees: 'people',

  academic_years: 'academic_process',
  semesters: 'academic_process',
  weeks: 'academic_process',
  academic_vacations: 'academic_process',
  subjects: 'academic_process',
  curriculum_plans: 'academic_process',
  curriculum_items: 'academic_process',
  disciplines: 'academic_process',

  audience_types: 'schedule',
  buildings: 'schedule',
  audiences: 'schedule',
  lesson_periods: 'schedule',
  schedule_items: 'schedule',
  lesson_sessions: 'schedule',

  attendance_records: 'learning_journal',
  grade_element_types: 'learning_journal',
  grade_items: 'learning_journal',
  final_assessments: 'learning_journal',
  final_assessment_rounds: 'learning_journal',
  score_scales: 'learning_journal',
  grades: 'learning_journal',
  lesson_completion_records: 'learning_journal',

  dictionary_items: 'settings',
  roles: 'administration',
  permissions: 'administration',
  app_users: 'administration',
  audit_logs: 'audit_log',
  app_settings: 'settings'
}

export function requireAdminCrudAccess(
  event: IpcMainInvokeEvent,
  authService: AuthService,
  params: AdminCrudAccessParams,
  action: AdminCrudAccessAction,
  fallbackModule?: AdminCrudAccessModule
): void {
  const token = getAuthTokenForWebContents(event.sender.id)

  if (!token) {
    throw new Error('Требуется авторизация для работы с данными')
  }

  const user = authService.getCurrentUser({ token })

  if (!user) {
    throw new Error('Сессия истекла. Войди в систему заново')
  }

  const module = resolveAccessModule(params, fallbackModule)

  if (!module) {
    throw new Error('Не удалось определить модуль доступа для операции')
  }

  if (!canPerformAction(user, module, action)) {
    throw new Error(`Нет прав на выполнение операции: ${module}.${action}`)
  }
}

function resolveAccessModule(
  params: AdminCrudAccessParams,
  fallbackModule?: AdminCrudAccessModule
): AdminCrudAccessModule | null {
  if (params.accessModule) {
    return params.accessModule
  }

  if (fallbackModule) {
    return fallbackModule
  }

  if (!params.entity) {
    return null
  }

  return defaultAccessModuleByEntity[params.entity] ?? null
}
