export type PermissionAction = 'view' | 'create' | 'update' | 'delete'

export type PermissionModule =
  | 'university'
  | 'people'
  | 'academicCalendar'
  | 'academicProcess'
  | 'roomsAndLessons'
  | 'schedule'
  | 'learningJournal'
  | 'reports'
  | 'administration'
  | 'auditLog'
  | 'settings'

export type PermissionKey = `${PermissionModule}.${PermissionAction}`

export const systemRoles = {
  superAdmin: 'super_admin',
  teacher: 'teacher',
  student: 'student'
} as const

export type SystemRole = (typeof systemRoles)[keyof typeof systemRoles]
