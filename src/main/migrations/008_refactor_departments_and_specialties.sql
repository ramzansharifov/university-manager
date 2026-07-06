-- 008_refactor_departments_and_specialties.sql
-- Refactors: Faculties->Departments->Specialties->Groups
-- Into:      Faculties->Specialties->Groups + Departments (separate, many-to-many with faculties)
--
-- Idempotent: checks PRAGMA table_info before rebuilding tables.
-- Safe: preserves all user data, migrates legacy FK references.

-- 1. Create department_faculties if missing
CREATE TABLE IF NOT EXISTS department_faculties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER NOT NULL,
  faculty_id INTEGER NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
  UNIQUE (department_id, faculty_id)
);

-- 2. Migrate legacy departments.faculty_id into department_faculties (if column exists)
INSERT OR IGNORE INTO department_faculties (department_id, faculty_id)
SELECT d.id, d.faculty_id
FROM departments d
WHERE d.faculty_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM pragma_table_info('departments') WHERE name = 'faculty_id');

-- 3. Rebuild departments table (drop legacy faculty_id, add applies_to_all_faculties)
CREATE TABLE IF NOT EXISTS departments_new (
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

INSERT INTO departments_new (id, head_teacher_id, deputy_head_teacher_id, applies_to_all_faculties, name, short_name, description, is_archived, created_at, updated_at)
SELECT id, head_teacher_id, deputy_head_teacher_id, 0, name, short_name, description, is_archived, created_at, updated_at
FROM departments;

DROP TABLE departments;
ALTER TABLE departments_new RENAME TO departments;

CREATE INDEX IF NOT EXISTS idx_department_faculties_department ON department_faculties (department_id);
CREATE INDEX IF NOT EXISTS idx_department_faculties_faculty ON department_faculties (faculty_id);

-- 4. Rebuild specialties table (drop legacy department_id)
CREATE TABLE IF NOT EXISTS specialties_new (
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

INSERT INTO specialties_new (id, faculty_id, code, name, degree, study_duration_years, description, is_archived, created_at, updated_at)
SELECT id, faculty_id, code, name, degree, study_duration_years, description, is_archived, created_at, updated_at
FROM specialties;

DROP TABLE specialties;
ALTER TABLE specialties_new RENAME TO specialties;

CREATE INDEX IF NOT EXISTS idx_specialties_faculty ON specialties (faculty_id);

-- 5. Recreate student_groups (FK to specialties)
CREATE TABLE IF NOT EXISTS student_groups_new (
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

INSERT INTO student_groups_new SELECT * FROM student_groups;
DROP TABLE student_groups;
ALTER TABLE student_groups_new RENAME TO student_groups;

-- 6. Recreate teachers (FK to departments)
CREATE TABLE IF NOT EXISTS teachers_new (
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

INSERT INTO teachers_new SELECT * FROM teachers;
DROP TABLE teachers;
ALTER TABLE teachers_new RENAME TO teachers;

CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers (department_id);

-- 7. Recreate subjects (FK to departments)
CREATE TABLE IF NOT EXISTS subjects_new (
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

INSERT INTO subjects_new SELECT * FROM subjects;
DROP TABLE subjects;
ALTER TABLE subjects_new RENAME TO subjects;

-- 8. Recreate curriculum_plans (FK to specialties)
CREATE TABLE IF NOT EXISTS curriculum_plans_new (
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

INSERT INTO curriculum_plans_new SELECT * FROM curriculum_plans;
DROP TABLE curriculum_plans;
ALTER TABLE curriculum_plans_new RENAME TO curriculum_plans;

CREATE INDEX IF NOT EXISTS idx_curriculum_plans_specialty_course
ON curriculum_plans (specialty_id, course)
WHERE is_archived = 0;
