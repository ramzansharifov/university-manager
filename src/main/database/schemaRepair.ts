import type Database from 'better-sqlite3'

interface TableInfoRow {
  name: string
}

interface DuplicateNameRow {
  scope_id: number
  name: string
  record_ids: string
  duplicate_count: number
}

interface DuplicateLinkRow {
  department_id: number
  faculty_id: number
}

interface DepartmentFacultyRow {
  id: number
  faculty_id: number
}

interface ForeignKeyViolationRow {
  table: string
  rowid: number | null
  parent: string
  fkid: number
}

const academicVacationsSql = `
  CREATE TABLE IF NOT EXISTS academic_vacations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER NOT NULL,
    vacation_type TEXT NOT NULL,
    name TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    description TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
    UNIQUE (academic_year_id, vacation_type)
  );
`

const departmentFacultiesSql = `
  CREATE TABLE IF NOT EXISTS department_faculties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
  );
`

const requiredRebuildTableColumns: Record<string, string[]> = {
  student_groups: [
    'id',
    'specialty_id',
    'academic_year_id',
    'education_form_id',
    'curator_teacher_id',
    'name',
    'course',
    'description',
    'is_archived',
    'created_at',
    'updated_at'
  ],
  teachers: [
    'id',
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
    'note',
    'is_archived',
    'created_at',
    'updated_at'
  ],
  subjects: [
    'id',
    'department_id',
    'name',
    'description',
    'is_archived',
    'created_at',
    'updated_at'
  ],
  curriculum_plans: [
    'id',
    'specialty_id',
    'course',
    'academic_year_id',
    'education_form_id',
    'name',
    'status',
    'note',
    'is_archived',
    'created_at',
    'updated_at'
  ]
}

/**
 * Repairs schema drift caused by manually or partially applied historical migrations.
 *
 * Legacy university-structure tables are rebuilt only after their actual columns have
 * been inspected. Rebuilds run atomically with foreign keys temporarily disabled and
 * are rolled back when the resulting schema contains a foreign-key violation.
 */
export function repairDatabaseSchema(database: Database.Database): void {
  const additiveRepair = database.transaction(() => {
    ensureColumn(database, 'faculties', 'dean_teacher_id', 'INTEGER')
    ensureColumn(database, 'faculties', 'deputy_dean_teacher_id', 'INTEGER')

    if (tableExists(database, 'academic_years')) {
      database.exec(academicVacationsSql)
    }

    if (tableExists(database, 'departments')) {
      database.exec(departmentFacultiesSql)
      ensureColumn(
        database,
        'departments',
        'applies_to_all_faculties',
        'INTEGER NOT NULL DEFAULT 0'
      )
      migrateLegacyDepartmentFacultyId(database)
    }
  })

  additiveRepair()
  repairUniversityStructureTables(database)

  const relationshipRepair = database.transaction(() => {
    repairDuplicateActiveDepartmentFacultyLinks(database)
    createDepartmentFacultyIndexes(database)
  })

  relationshipRepair()
}

function migrateLegacyDepartmentFacultyId(database: Database.Database): void {
  if (!columnExists(database, 'departments', 'faculty_id')) {
    return
  }

  const legacyLinks = database
    .prepare(
      `
        SELECT id, faculty_id
        FROM departments
        WHERE faculty_id IS NOT NULL
      `
    )
    .all() as DepartmentFacultyRow[]
  const findExisting = database.prepare(
    `
      SELECT id, is_archived
      FROM department_faculties
      WHERE department_id = ? AND faculty_id = ?
      ORDER BY is_archived ASC, id ASC
      LIMIT 1
    `
  )
  const restoreExisting = database.prepare(
    `
      UPDATE department_faculties
      SET is_archived = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )
  const insertLink = database.prepare(
    `
      INSERT INTO department_faculties (department_id, faculty_id)
      VALUES (?, ?)
    `
  )

  legacyLinks.forEach((link) => {
    const existing = findExisting.get(link.id, link.faculty_id) as
      { id: number; is_archived: number } | undefined

    if (!existing) {
      insertLink.run(link.id, link.faculty_id)
      return
    }

    if (Number(existing.is_archived) === 1) {
      restoreExisting.run(existing.id)
    }
  })
}

function repairUniversityStructureTables(database: Database.Database): void {
  const hasLegacyDepartmentFaculty = columnExists(database, 'departments', 'faculty_id')
  const hasLegacySpecialtyDepartment = columnExists(database, 'specialties', 'department_id')

  if (!hasLegacyDepartmentFaculty && !hasLegacySpecialtyDepartment) {
    return
  }

  assertLegacyRebuildInputs(database)
  assertNoDuplicateDepartmentNames(database)
  assertNoDuplicateSpecialtyNames(database)
  assertRepairTablesAbsent(database)

  const foreignKeysWereEnabled = Number(database.pragma('foreign_keys', { simple: true })) === 1

  if (foreignKeysWereEnabled) {
    database.pragma('foreign_keys = OFF')

    if (Number(database.pragma('foreign_keys', { simple: true })) !== 0) {
      throw new Error('Schema repair отменён: SQLite не позволил временно отключить внешние ключи')
    }
  }

  try {
    const rebuildTransaction = database.transaction(() => {
      rebuildDepartments(database)
      rebuildSpecialties(database)
      rebuildStudentGroups(database)
      rebuildTeachers(database)
      rebuildSubjects(database)
      rebuildCurriculumPlans(database)
      createUniversityStructureIndexes(database)
      assertNoForeignKeyViolations(database)
    })

    rebuildTransaction()
  } finally {
    if (foreignKeysWereEnabled) {
      database.pragma('foreign_keys = ON')
    }
  }
}

function assertLegacyRebuildInputs(database: Database.Database): void {
  const requiredColumns: Record<string, string[]> = {
    departments: [
      'id',
      'head_teacher_id',
      'deputy_head_teacher_id',
      'name',
      'short_name',
      'description',
      'is_archived',
      'created_at',
      'updated_at'
    ],
    specialties: [
      'id',
      'faculty_id',
      'code',
      'name',
      'degree',
      'study_duration_years',
      'description',
      'is_archived',
      'created_at',
      'updated_at'
    ],
    ...requiredRebuildTableColumns
  }

  Object.entries(requiredColumns).forEach(([tableName, columns]) => {
    if (!tableExists(database, tableName)) {
      throw new Error(`Невозможно выполнить schema repair: таблица "${tableName}" не найдена`)
    }

    const actualColumns = getTableColumns(database, tableName)
    const missingColumns = columns.filter((column) => !actualColumns.has(column))

    if (missingColumns.length > 0) {
      throw new Error(
        `Невозможно безопасно перестроить таблицу "${tableName}". ` +
          `Отсутствуют колонки: ${missingColumns.join(', ')}`
      )
    }
  })
}

function assertNoDuplicateDepartmentNames(database: Database.Database): void {
  const duplicate = database
    .prepare(
      `
        SELECT 0 AS scope_id, name, GROUP_CONCAT(id) AS record_ids, COUNT(*) AS duplicate_count
        FROM departments
        GROUP BY name
        HAVING COUNT(*) > 1
        ORDER BY name
        LIMIT 1
      `
    )
    .get() as DuplicateNameRow | undefined

  if (duplicate) {
    throw new Error(
      `Невозможно перенести кафедры: название "${duplicate.name}" повторяется в записях ` +
        `ID ${duplicate.record_ids}. Переименуйте дублирующиеся кафедры и повторите запуск.`
    )
  }
}

function assertNoDuplicateSpecialtyNames(database: Database.Database): void {
  const duplicate = database
    .prepare(
      `
        SELECT faculty_id AS scope_id, name, GROUP_CONCAT(id) AS record_ids,
               COUNT(*) AS duplicate_count
        FROM specialties
        GROUP BY faculty_id, name
        HAVING COUNT(*) > 1
        ORDER BY faculty_id, name
        LIMIT 1
      `
    )
    .get() as DuplicateNameRow | undefined

  if (duplicate) {
    throw new Error(
      `Невозможно перенести специальности: на факультете ID ${duplicate.scope_id} ` +
        `название "${duplicate.name}" повторяется в записях ID ${duplicate.record_ids}. ` +
        `Переименуйте дублирующиеся специальности и повторите запуск.`
    )
  }
}

function assertRepairTablesAbsent(database: Database.Database): void {
  const temporaryTables = [
    '__repair_departments',
    '__repair_specialties',
    '__repair_student_groups',
    '__repair_teachers',
    '__repair_subjects',
    '__repair_curriculum_plans'
  ]
  const existing = temporaryTables.filter((tableName) => tableExists(database, tableName))

  if (existing.length > 0) {
    throw new Error(
      `Невозможно запустить schema repair: найдены временные таблицы предыдущего запуска: ` +
        existing.join(', ')
    )
  }
}

function rebuildDepartments(database: Database.Database): void {
  const appliesToAllExpression = columnExists(database, 'departments', 'applies_to_all_faculties')
    ? 'applies_to_all_faculties'
    : '0'

  database.exec(`
    CREATE TABLE __repair_departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      head_teacher_id INTEGER,
      deputy_head_teacher_id INTEGER,
      applies_to_all_faculties INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      short_name TEXT,
      description TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (name)
    );

    INSERT INTO __repair_departments (
      id, head_teacher_id, deputy_head_teacher_id, applies_to_all_faculties,
      name, short_name, description, is_archived, created_at, updated_at
    )
    SELECT
      id, head_teacher_id, deputy_head_teacher_id, ${appliesToAllExpression},
      name, short_name, description, is_archived, created_at, updated_at
    FROM departments;

    DROP TABLE departments;
    ALTER TABLE __repair_departments RENAME TO departments;
  `)
}

function rebuildSpecialties(database: Database.Database): void {
  database.exec(`
    CREATE TABLE __repair_specialties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id INTEGER NOT NULL,
      code TEXT,
      name TEXT NOT NULL,
      degree TEXT,
      study_duration_years INTEGER NOT NULL DEFAULT 4,
      description TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE RESTRICT,
      UNIQUE (faculty_id, name)
    );

    INSERT INTO __repair_specialties (
      id, faculty_id, code, name, degree, study_duration_years,
      description, is_archived, created_at, updated_at
    )
    SELECT
      id, faculty_id, code, name, degree, study_duration_years,
      description, is_archived, created_at, updated_at
    FROM specialties;

    DROP TABLE specialties;
    ALTER TABLE __repair_specialties RENAME TO specialties;
  `)
}

function rebuildStudentGroups(database: Database.Database): void {
  database.exec(`
    CREATE TABLE __repair_student_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      specialty_id INTEGER NOT NULL,
      academic_year_id INTEGER,
      education_form_id INTEGER,
      curator_teacher_id INTEGER,
      name TEXT NOT NULL UNIQUE,
      course INTEGER,
      description TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE RESTRICT,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
      FOREIGN KEY (education_form_id) REFERENCES dictionary_items(id) ON DELETE SET NULL,
      FOREIGN KEY (curator_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    );

    INSERT INTO __repair_student_groups (
      id, specialty_id, academic_year_id, education_form_id, curator_teacher_id,
      name, course, description, is_archived, created_at, updated_at
    )
    SELECT
      id, specialty_id, academic_year_id, education_form_id, curator_teacher_id,
      name, course, description, is_archived, created_at, updated_at
    FROM student_groups;

    DROP TABLE student_groups;
    ALTER TABLE __repair_student_groups RENAME TO student_groups;
  `)
}

function rebuildTeachers(database: Database.Database): void {
  database.exec(`
    CREATE TABLE __repair_teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER,
      status_id INTEGER,
      teaching_subjects TEXT,
      last_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      middle_name TEXT,
      birth_date TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      hire_date TEXT,
      dismissal_date TEXT,
      note TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (status_id) REFERENCES dictionary_items(id) ON DELETE SET NULL
    );

    INSERT INTO __repair_teachers (
      id, department_id, status_id, teaching_subjects, last_name, first_name,
      middle_name, birth_date, email, phone, address, hire_date, dismissal_date,
      note, is_archived, created_at, updated_at
    )
    SELECT
      id, department_id, status_id, teaching_subjects, last_name, first_name,
      middle_name, birth_date, email, phone, address, hire_date, dismissal_date,
      note, is_archived, created_at, updated_at
    FROM teachers;

    DROP TABLE teachers;
    ALTER TABLE __repair_teachers RENAME TO teachers;
  `)
}

function rebuildSubjects(database: Database.Database): void {
  database.exec(`
    CREATE TABLE __repair_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      UNIQUE (department_id, name)
    );

    INSERT INTO __repair_subjects (
      id, department_id, name, description, is_archived, created_at, updated_at
    )
    SELECT id, department_id, name, description, is_archived, created_at, updated_at
    FROM subjects;

    DROP TABLE subjects;
    ALTER TABLE __repair_subjects RENAME TO subjects;
  `)
}

function rebuildCurriculumPlans(database: Database.Database): void {
  database.exec(`
    CREATE TABLE __repair_curriculum_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      specialty_id INTEGER NOT NULL,
      course INTEGER NOT NULL DEFAULT 1,
      academic_year_id INTEGER NOT NULL,
      education_form_id INTEGER,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      note TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE RESTRICT,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
      FOREIGN KEY (education_form_id) REFERENCES dictionary_items(id) ON DELETE SET NULL
    );

    INSERT INTO __repair_curriculum_plans (
      id, specialty_id, course, academic_year_id, education_form_id,
      name, status, note, is_archived, created_at, updated_at
    )
    SELECT
      id, specialty_id, course, academic_year_id, education_form_id,
      name, status, note, is_archived, created_at, updated_at
    FROM curriculum_plans;

    DROP TABLE curriculum_plans;
    ALTER TABLE __repair_curriculum_plans RENAME TO curriculum_plans;
  `)
}

function createUniversityStructureIndexes(database: Database.Database): void {
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_specialties_faculty ON specialties (faculty_id);
    CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers (department_id);
    CREATE INDEX IF NOT EXISTS idx_curriculum_plans_specialty_course
      ON curriculum_plans (specialty_id, course)
      WHERE is_archived = 0;
  `)
}

function repairDuplicateActiveDepartmentFacultyLinks(database: Database.Database): void {
  if (!tableExists(database, 'department_faculties')) {
    return
  }

  const duplicates = database
    .prepare(
      `
        SELECT department_id, faculty_id
        FROM department_faculties
        WHERE is_archived = 0
        GROUP BY department_id, faculty_id
        HAVING COUNT(*) > 1
      `
    )
    .all() as DuplicateLinkRow[]
  const findActiveIds = database.prepare(
    `
      SELECT id
      FROM department_faculties
      WHERE department_id = ? AND faculty_id = ? AND is_archived = 0
      ORDER BY id ASC
    `
  )
  const archiveDuplicate = database.prepare(
    `
      UPDATE department_faculties
      SET is_archived = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  )

  duplicates.forEach((duplicate) => {
    const rows = findActiveIds.all(duplicate.department_id, duplicate.faculty_id) as Array<{
      id: number
    }>

    rows.slice(1).forEach((row) => archiveDuplicate.run(row.id))
  })
}

function createDepartmentFacultyIndexes(database: Database.Database): void {
  if (!tableExists(database, 'department_faculties')) {
    return
  }

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_department_faculties_department
      ON department_faculties (department_id);
    CREATE INDEX IF NOT EXISTS idx_department_faculties_faculty
      ON department_faculties (faculty_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_department_faculties_active_unique
      ON department_faculties (department_id, faculty_id)
      WHERE is_archived = 0;
  `)
}

function assertNoForeignKeyViolations(database: Database.Database): void {
  const violations = database.pragma('foreign_key_check') as ForeignKeyViolationRow[]

  if (violations.length === 0) {
    return
  }

  const details = violations
    .slice(0, 5)
    .map(
      (violation) =>
        `${violation.table}[rowid=${violation.rowid ?? '—'}] -> ${violation.parent} ` +
        `(fk=${violation.fkid})`
    )
    .join('; ')

  throw new Error(
    `Schema repair отменён: после перестроения найдены нарушения внешних ключей ` +
      `(${violations.length}). ${details}`
  )
}

function ensureColumn(
  database: Database.Database,
  tableName: string,
  columnName: string,
  columnDefinition: string
): void {
  if (!tableExists(database, tableName) || columnExists(database, tableName, columnName)) {
    return
  }

  database.exec(
    `ALTER TABLE ${quoteIdentifier(tableName)} ADD COLUMN ${quoteIdentifier(columnName)} ${columnDefinition}`
  )
}

function tableExists(database: Database.Database, tableName: string): boolean {
  const row = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName)

  return Boolean(row)
}

function columnExists(database: Database.Database, tableName: string, columnName: string): boolean {
  if (!tableExists(database, tableName)) {
    return false
  }

  return getTableColumns(database, tableName).has(columnName)
}

function getTableColumns(database: Database.Database, tableName: string): Set<string> {
  const rows = database
    .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
    .all() as TableInfoRow[]

  return new Set(rows.map((row) => row.name))
}

function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Некорректное имя SQL-идентификатора: ${value}`)
  }

  return `"${value}"`
}
