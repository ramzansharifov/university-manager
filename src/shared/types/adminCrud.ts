export type AdminEntityKey =
  | 'faculties'
  | 'departments'
  | 'specialties'
  | 'student_groups'
  | 'divisions'
  | 'positions'
  | 'dictionary_items'
  | 'academic_years'
  | 'semesters'
  | 'weeks'
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
  page?: number
  pageSize?: number
  search?: string
  includeArchived?: boolean
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
  id: number
}

export interface AdminCrudCreateParams {
  entity: AdminEntityKey
  data: AdminCrudRecord
}

export interface AdminCrudUpdateParams {
  entity: AdminEntityKey
  id: number
  data: AdminCrudRecord
}

export interface AdminCrudDeleteParams {
  entity: AdminEntityKey
  id: number
}

export interface AdminCrudArchiveParams {
  entity: AdminEntityKey
  id: number
}

export interface AdminCrudOperationResult<TRecord = AdminCrudRecord> {
  success: boolean
  item?: TRecord
}
