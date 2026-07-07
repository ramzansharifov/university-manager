export type AdminCrudAccessModule =
  | 'university'
  | 'people'
  | 'academic_calendar'
  | 'academic_process'
  | 'rooms_and_lessons'
  | 'schedule'
  | 'learning_journal'
  | 'reports'
  | 'administration'
  | 'audit_log'
  | 'settings'

export type AdminEntityKey =
  | 'faculties'
  | 'departments'
  | 'department_faculties'
  | 'specialties'
  | 'student_groups'
  | 'divisions'
  | 'positions'
  | 'dictionary_items'
  | 'academic_years'
  | 'semesters'
  | 'weeks'
  | 'academic_vacations'
  | 'lesson_periods'
  | 'teachers'
  | 'employees'
  | 'students'
  | 'subjects'
  | 'curriculum_plans'
  | 'curriculum_items'
  | 'disciplines'
  | 'audience_types'
  | 'buildings'
  | 'audiences'
  | 'schedule_items'
  | 'lesson_sessions'
  | 'attendance_records'
  | 'grade_element_types'
  | 'grade_items'
  | 'score_scales'
  | 'grades'
  | 'lesson_completion_records'
  | 'roles'
  | 'permissions'
  | 'app_users'
  | 'audit_logs'
  | 'app_settings'

export type SortDirection = 'asc' | 'desc'

export type AdminCrudRecord = Record<string, unknown>

export interface AdminCrudListParams {
  entity: AdminEntityKey
  accessModule?: AdminCrudAccessModule
  page?: number
  pageSize?: number
  search?: string

  orderBy?: string
  orderDirection?: SortDirection
  filters?: Record<string, string | number | boolean | null>
}

export interface AdminCrudListResult<TRecord = AdminCrudRecord> {
  items: TRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminCrudGetByIdParams {
  entity: AdminEntityKey
  accessModule?: AdminCrudAccessModule
  id: number
}

export interface AdminCrudCreateParams {
  entity: AdminEntityKey
  accessModule?: AdminCrudAccessModule
  data: AdminCrudRecord
}

export interface AdminCrudUpdateParams {
  entity: AdminEntityKey
  accessModule?: AdminCrudAccessModule
  id: number
  data: AdminCrudRecord
}

export interface SaveDepartmentWithFacultiesParams {
  id?: number
  accessModule?: AdminCrudAccessModule
  data: AdminCrudRecord
  facultyIds: number[]
}

export interface AdminCrudDeleteParams {
  entity: AdminEntityKey
  accessModule?: AdminCrudAccessModule
  id: number
}

export interface AdminCrudOperationResult<TRecord = AdminCrudRecord> {
  success: boolean
  item?: TRecord
}
