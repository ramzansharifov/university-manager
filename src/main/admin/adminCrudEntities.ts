import type { AdminEntityKey } from '../../shared/types/adminCrud'

export interface AdminCrudEntityConfig {
  key: AdminEntityKey
  tableName: string
  primaryKey: string
  allowedColumns: string[]
  searchableColumns: string[]
  defaultOrderBy: string
  hasUpdatedAt: boolean
  supportsArchive: boolean
}

const commonSystemColumns = ['id', 'created_at', 'updated_at', 'is_archived']

export const adminCrudEntities: Record<AdminEntityKey, AdminCrudEntityConfig> = {
  faculties: entity(
    'faculties',
    ['name', 'short_name', 'description', 'dean_employee_id', 'deputy_dean_employee_id'],
    ['name', 'short_name']
  ),
  departments: entity(
    'departments',
    [
      'faculty_id',
      'head_teacher_id',
      'deputy_head_teacher_id',
      'name',
      'short_name',
      'description'
    ],
    ['name', 'short_name']
  ),
  specialties: entity(
    'specialties',
    ['faculty_id', 'department_id', 'code', 'name', 'degree', 'description'],
    ['code', 'name', 'degree']
  ),
  student_groups: entity(
    'student_groups',
    [
      'specialty_id',
      'academic_year_id',
      'education_form_id',
      'curator_teacher_id',
      'name',
      'course',
      'description'
    ],
    ['name']
  ),
  divisions: entity('divisions', ['name', 'short_name', 'description'], ['name', 'short_name']),
  positions: entity('positions', ['division_id', 'name', 'description'], ['name', 'description']),

  dictionary_items: entity(
    'dictionary_items',
    ['dictionary_key', 'item_key', 'name', 'sort_order'],
    ['dictionary_key', 'item_key', 'name']
  ),

  academic_years: entity(
    'academic_years',
    ['name', 'starts_at', 'ends_at', 'status'],
    ['name', 'status']
  ),
  semesters: entity(
    'semesters',
    ['academic_year_id', 'name', 'number', 'starts_at', 'ends_at', 'status'],
    ['name', 'status']
  ),
  weeks: entity(
    'weeks',
    ['semester_id', 'number', 'starts_at', 'ends_at', 'week_type', 'status'],
    ['week_type', 'status']
  ),
  lesson_periods: entity(
    'lesson_periods',
    ['number', 'name', 'starts_at', 'ends_at'],
    ['name', 'starts_at', 'ends_at']
  ),

  teachers: entity(
    'teachers',
    [
      'department_id',
      'status_id',
      'teaching_subjects',
      'last_name',
      'first_name',
      'middle_name',
      'birth_date',
      'email',
      'phone',
      'address',
      'hire_date',
      'dismissal_date',
      'note'
    ],
    ['last_name', 'first_name', 'middle_name', 'email', 'phone', 'teaching_subjects']
  ),
  employees: entity(
    'employees',
    [
      'division_id',
      'position_id',
      'status_id',
      'last_name',
      'first_name',
      'middle_name',
      'birth_date',
      'email',
      'phone',
      'address',
      'hire_date',
      'dismissal_date',
      'note'
    ],
    ['last_name', 'first_name', 'middle_name', 'email', 'phone']
  ),
  students: entity(
    'students',
    [
      'group_id',
      'status_id',
      'last_name',
      'first_name',
      'middle_name',
      'birth_date',
      'email',
      'phone',
      'address',
      'admission_date',
      'student_card_number',
      'social_status',
      'public_activity',
      'transfer_info',
      'status_changed_at',
      'note'
    ],
    ['last_name', 'first_name', 'middle_name', 'email', 'phone', 'student_card_number']
  ),

  subjects: entity('subjects', ['department_id', 'name', 'description'], ['name']),
  curriculum_plans: entity(
    'curriculum_plans',
    ['specialty_id', 'academic_year_id', 'education_form_id', 'name', 'status', 'note'],
    ['name', 'status']
  ),
  curriculum_items: entity(
    'curriculum_items',
    [
      'curriculum_plan_id',
      'subject_id',
      'semester_id',
      'hours_total',
      'hours_lectures',
      'hours_practices',
      'hours_labs',
      'hours_self_study',
      'control_form'
    ],
    ['control_form']
  ),
  disciplines: entity(
    'disciplines',
    ['curriculum_item_id', 'subject_id', 'group_id', 'teacher_id', 'semester_id', 'name', 'status'],
    ['name', 'status']
  ),

  audiences: entity(
    'audiences',
    ['audience_type_id', 'name', 'building', 'floor', 'capacity', 'note'],
    ['name', 'building']
  ),

  schedule_items: entity(
    'schedule_items',
    [
      'semester_id',
      'day_of_week',
      'lesson_period_id',
      'group_id',
      'discipline_id',
      'teacher_id',
      'audience_id',
      'lesson_type_id',
      'week_type',
      'starts_on',
      'ends_on',
      'status'
    ],
    ['week_type', 'status']
  ),
  lesson_sessions: entity(
    'lesson_sessions',
    ['schedule_item_id', 'week_id', 'lesson_date', 'topic', 'status', 'comment', 'teacher_id'],
    ['topic', 'status', 'comment']
  ),

  attendance_records: entity(
    'attendance_records',
    ['lesson_session_id', 'student_id', 'attendance_status_id', 'comment', 'marked_by_user_id'],
    ['comment'],
    {
      supportsArchive: false
    }
  ),

  grade_items: entity(
    'grade_items',
    ['discipline_id', 'grade_category_id', 'name', 'max_score', 'grade_date', 'description'],
    ['name', 'description']
  ),
  score_scales: entity(
    'score_scales',
    ['name', 'min_score', 'max_score', 'result_name'],
    ['name', 'result_name']
  ),
  grades: entity(
    'grades',
    ['grade_item_id', 'student_id', 'score', 'comment', 'graded_by_user_id'],
    ['comment'],
    {
      supportsArchive: false
    }
  ),
  lesson_completion_records: entity(
    'lesson_completion_records',
    ['lesson_session_id', 'status', 'topic_completed', 'comment', 'updated_by_user_id'],
    ['status', 'comment'],
    {
      supportsArchive: false
    }
  ),

  roles: entity(
    'roles',
    ['role_key', 'name', 'description', 'is_system'],
    ['role_key', 'name', 'description']
  ),
  permissions: entity(
    'permissions',
    ['permission_key', 'module', 'action', 'name'],
    ['permission_key', 'module', 'action', 'name'],
    {
      hasUpdatedAt: false,
      supportsArchive: false
    }
  ),
  app_users: entity(
    'app_users',
    [
      'role_id',
      'username',
      'password_hash',
      'profile_type',
      'profile_id',
      'is_active',
      'last_login_at'
    ],
    ['username', 'profile_type']
  ),
  audit_logs: entity(
    'audit_logs',
    ['user_id', 'action', 'module', 'entity_name', 'entity_id', 'before_json', 'after_json'],
    ['action', 'module', 'entity_name'],
    {
      hasUpdatedAt: false,
      supportsArchive: false
    }
  ),
  app_settings: entity(
    'app_settings',
    ['setting_key', 'setting_value'],
    ['setting_key', 'setting_value'],
    {
      supportsArchive: false
    }
  )
}

function entity(
  tableName: AdminEntityKey,
  editableColumns: string[],
  searchableColumns: string[],
  options?: Partial<Pick<AdminCrudEntityConfig, 'hasUpdatedAt' | 'supportsArchive'>>
): AdminCrudEntityConfig {
  return {
    key: tableName,
    tableName,
    primaryKey: 'id',
    allowedColumns: [...commonSystemColumns, ...editableColumns],
    searchableColumns,
    defaultOrderBy: 'id',
    hasUpdatedAt: options?.hasUpdatedAt ?? true,
    supportsArchive: options?.supportsArchive ?? true
  }
}

export function getAdminCrudEntityConfig(entityKey: AdminEntityKey): AdminCrudEntityConfig {
  const config = adminCrudEntities[entityKey]

  if (!config) {
    throw new Error(`Unknown admin entity: ${entityKey}`)
  }

  return config
}
