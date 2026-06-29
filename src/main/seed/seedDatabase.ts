import type Database from 'better-sqlite3'
import { hashPassword } from '../security/password'

const systemRoles = [
  {
    key: 'super_admin',
    name: 'Суперадмин',
    description: 'Полный доступ ко всей системе'
  },
  {
    key: 'teacher',
    name: 'Преподаватель',
    description: 'Фиксированная роль преподавателя'
  },
  {
    key: 'student',
    name: 'Студент',
    description: 'Фиксированная роль студента'
  }
]

const permissionModules = [
  'university',
  'people',
  'academic_calendar',
  'academic_process',
  'rooms_and_lessons',
  'schedule',
  'learning_journal',
  'reports',
  'administration',
  'audit_log',
  'settings'
]

const permissionActions = ['view', 'create', 'update', 'delete']

export function seedDatabase(database: Database.Database): void {
  const transaction = database.transaction(() => {
    seedRoles(database)
    seedPermissions(database)
    seedSuperAdminPermissions(database)
    seedDefaultAdminUser(database)
    seedDictionaries(database)
    seedSettings(database)
  })

  transaction()
}

function seedRoles(database: Database.Database): void {
  const insertRole = database.prepare(`
    INSERT OR IGNORE INTO roles (role_key, name, description, is_system)
    VALUES (@key, @name, @description, 1)
  `)

  for (const role of systemRoles) {
    insertRole.run(role)
  }
}

function seedPermissions(database: Database.Database): void {
  const insertPermission = database.prepare(`
    INSERT OR IGNORE INTO permissions (permission_key, module, action, name)
    VALUES (@permissionKey, @module, @action, @name)
  `)

  for (const module of permissionModules) {
    for (const action of permissionActions) {
      const permissionKey = `${module}.${action}`

      insertPermission.run({
        permissionKey,
        module,
        action,
        name: permissionKey
      })
    }
  }
}

function seedSuperAdminPermissions(database: Database.Database): void {
  const superAdminRole = database
    .prepare('SELECT id FROM roles WHERE role_key = ?')
    .get('super_admin') as { id: number } | undefined

  if (!superAdminRole) {
    return
  }

  database.exec(`
    INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
    SELECT ${superAdminRole.id}, permissions.id
    FROM permissions
  `)
}

function seedDictionaries(database: Database.Database): void {
  const insertSimpleDictionaryItem = database.prepare(`
    INSERT OR IGNORE INTO dictionary_items (dictionary_key, item_key, name, sort_order)
    VALUES (?, ?, ?, ?)
  `)

  const items = [
    ['student_statuses', 'active', 'Обучается', 10],
    ['student_statuses', 'academic_leave', 'Академический отпуск', 20],
    ['student_statuses', 'expelled', 'Отчислен', 30],
    ['student_statuses', 'graduated', 'Выпущен', 40],

    ['teacher_statuses', 'active', 'Работает', 10],
    ['teacher_statuses', 'inactive', 'Не работает', 20],

    ['employee_statuses', 'active', 'Работает', 10],
    ['employee_statuses', 'inactive', 'Не работает', 20],

    ['education_forms', 'full_time', 'Очная', 10],
    ['education_forms', 'part_time', 'Заочная', 20],
    ['education_forms', 'distance', 'Дистанционная', 30],

    ['attendance_statuses', 'present', 'Присутствовал', 10],
    ['attendance_statuses', 'absent', 'Отсутствовал', 20],
    ['attendance_statuses', 'late', 'Опоздал', 30],
    ['attendance_statuses', 'excused', 'Уважительная причина', 40],
    ['attendance_statuses', 'online', 'Дистанционно', 50],

    ['grade_categories', 'current', 'Текущий контроль', 10],
    ['grade_categories', 'midterm', 'Промежуточный контроль', 20],
    ['grade_categories', 'final', 'Итоговый контроль', 30],
    ['grade_categories', 'exam', 'Экзамен', 40],
    ['grade_categories', 'credit', 'Зачёт', 50],

    ['lesson_types', 'lecture', 'Лекция', 10],
    ['lesson_types', 'seminar', 'Семинар', 20],
    ['lesson_types', 'practice', 'Практика', 30],
    ['lesson_types', 'lab', 'Лабораторная работа', 40],
    ['lesson_types', 'consultation', 'Консультация', 50],
    ['lesson_types', 'exam', 'Экзамен', 60],
    ['lesson_types', 'credit', 'Зачёт', 70]
  ]

  for (const item of items) {
    insertSimpleDictionaryItem.run(...item)
  }
}

function seedSettings(database: Database.Database): void {
  const insertSetting = database.prepare(`
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value)
    VALUES (?, ?)
  `)

  insertSetting.run('theme.mode', 'light')
  insertSetting.run('theme.accent', 'blue')
  insertSetting.run('i18n.language', 'ru')
}

function seedDefaultAdminUser(database: Database.Database): void {
  const existingAdmin = database
    .prepare('SELECT id FROM app_users WHERE username = ? LIMIT 1')
    .get('admin')

  if (existingAdmin) {
    return
  }

  const superAdminRole = database
    .prepare('SELECT id FROM roles WHERE role_key = ? LIMIT 1')
    .get('super_admin') as { id: number } | undefined

  if (!superAdminRole) {
    return
  }

  database
    .prepare(
      `
      INSERT INTO app_users (
        role_id,
        username,
        password_hash,
        profile_type,
        profile_id,
        is_active
      )
      VALUES (
        @roleId,
        @username,
        @passwordHash,
        @profileType,
        @profileId,
        @isActive
      )
    `
    )
    .run({
      roleId: superAdminRole.id,
      username: 'admin',
      passwordHash: hashPassword('admin'),
      profileType: 'system',
      profileId: 0,
      isActive: 1
    })
}
