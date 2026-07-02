CREATE TABLE IF NOT EXISTS faculties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  description TEXT,
  dean_employee_id INTEGER,
  deputy_dean_employee_id INTEGER,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS divisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  division_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
  UNIQUE (division_id, name)
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faculty_id INTEGER NOT NULL,
  head_teacher_id INTEGER,
  deputy_head_teacher_id INTEGER,
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE RESTRICT,
  UNIQUE (faculty_id, name)
);

CREATE TABLE IF NOT EXISTS specialties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faculty_id INTEGER NOT NULL,
  department_id INTEGER NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  degree TEXT,
  study_duration_years INTEGER NOT NULL DEFAULT 4,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE RESTRICT,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  UNIQUE (department_id, name)
);

CREATE TABLE IF NOT EXISTS dictionary_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dictionary_key TEXT NOT NULL,
  item_key TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (dictionary_key, item_key)
);

CREATE TABLE IF NOT EXISTS academic_years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  starts_at TEXT,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS semesters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academic_year_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
  UNIQUE (academic_year_id, number)
);

CREATE TABLE IF NOT EXISTS weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_id INTEGER NOT NULL,
  number INTEGER NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  week_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
  UNIQUE (semester_id, number)
);

CREATE TABLE IF NOT EXISTS lesson_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
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

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  division_id INTEGER,
  position_id INTEGER,
  status_id INTEGER,
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

  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
  FOREIGN KEY (status_id) REFERENCES dictionary_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS student_groups (
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

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER,
  status_id INTEGER,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  birth_date TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  admission_date TEXT,
  student_card_number TEXT UNIQUE,
  social_status TEXT,
  public_activity TEXT,
  transfer_info TEXT,
  status_changed_at TEXT,
  note TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE SET NULL,
  FOREIGN KEY (status_id) REFERENCES dictionary_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS subjects (
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

CREATE TABLE IF NOT EXISTS curriculum_plans (
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

CREATE TABLE IF NOT EXISTS curriculum_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_plan_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  semester_id INTEGER NOT NULL,
  hours_total INTEGER NOT NULL DEFAULT 0,
  hours_lectures INTEGER NOT NULL DEFAULT 0,
  hours_practices INTEGER NOT NULL DEFAULT 0,
  hours_labs INTEGER NOT NULL DEFAULT 0,
  hours_self_study INTEGER NOT NULL DEFAULT 0,
  control_form TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (curriculum_plan_id) REFERENCES curriculum_plans(id) ON DELETE RESTRICT,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS disciplines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_item_id INTEGER,
  subject_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  semester_id INTEGER NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (curriculum_item_id) REFERENCES curriculum_items(id) ON DELETE SET NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE RESTRICT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS audience_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience_type_id INTEGER,
  building_id INTEGER,
  name TEXT NOT NULL UNIQUE,
  floor INTEGER,
  capacity INTEGER,
  note TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (audience_type_id) REFERENCES audience_types(id) ON DELETE SET NULL,
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS schedule_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_id INTEGER NOT NULL,
  week_id INTEGER,
  day_of_week INTEGER NOT NULL,
  lesson_period_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  discipline_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  audience_id INTEGER,
  lesson_type_id INTEGER,
  week_type TEXT,
  starts_on TEXT,
  ends_on TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
  FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_period_id) REFERENCES lesson_periods(id) ON DELETE RESTRICT,
  FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE RESTRICT,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE RESTRICT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
  FOREIGN KEY (audience_id) REFERENCES audiences(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_type_id) REFERENCES dictionary_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lesson_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_item_id INTEGER NOT NULL,
  week_id INTEGER,
  lesson_date TEXT NOT NULL,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  comment TEXT,
  teacher_id INTEGER,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (schedule_item_id) REFERENCES schedule_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_session_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  attendance_status_id INTEGER NOT NULL,
  comment TEXT,
  marked_by_user_id INTEGER,
  marked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (lesson_session_id) REFERENCES lesson_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (attendance_status_id) REFERENCES dictionary_items(id) ON DELETE RESTRICT,
  UNIQUE (lesson_session_id, student_id)
);

CREATE TABLE IF NOT EXISTS grade_element_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  grading_mode TEXT NOT NULL DEFAULT 'score',
  min_score REAL NOT NULL DEFAULT 0,
  max_score REAL NOT NULL DEFAULT 100,
  passing_score REAL,
  is_intermediate INTEGER NOT NULL DEFAULT 1,
  is_final INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discipline_id INTEGER NOT NULL,
  grade_element_type_id INTEGER,
  grade_category_id INTEGER,
  week_id INTEGER,
  day_of_week INTEGER,
  name TEXT NOT NULL,
  max_score REAL NOT NULL DEFAULT 100,
  grade_date TEXT,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE RESTRICT,
  FOREIGN KEY (grade_element_type_id) REFERENCES grade_element_types(id) ON DELETE SET NULL,
  FOREIGN KEY (grade_category_id) REFERENCES dictionary_items(id) ON DELETE SET NULL,
  FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS score_scales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  min_score REAL NOT NULL,
  max_score REAL NOT NULL,
  result_name TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grade_item_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  score REAL NOT NULL,
  comment TEXT,
  graded_by_user_id INTEGER,
  graded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (grade_item_id) REFERENCES grade_items(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE (grade_item_id, student_id)
);

CREATE TABLE IF NOT EXISTS lesson_completion_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_session_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'not_completed',
  topic_completed INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (lesson_session_id) REFERENCES lesson_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permission_key TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,

  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  profile_type TEXT NOT NULL DEFAULT 'system',
  profile_id INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_name TEXT,
  entity_id INTEGER,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_faculty ON departments (faculty_id);
CREATE INDEX IF NOT EXISTS idx_specialties_faculty ON specialties (faculty_id);
CREATE INDEX IF NOT EXISTS idx_specialties_department ON specialties (department_id);
CREATE INDEX IF NOT EXISTS idx_positions_division ON positions (division_id);

CREATE INDEX IF NOT EXISTS idx_students_group ON students (group_id);
CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers (department_id);
CREATE INDEX IF NOT EXISTS idx_employees_division ON employees (division_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees (position_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_plans_specialty_course
ON curriculum_plans (specialty_id, course)
WHERE is_archived = 0;

CREATE INDEX IF NOT EXISTS idx_curriculum_items_plan_semester
ON curriculum_items (curriculum_plan_id, semester_id)
WHERE is_archived = 0;

CREATE INDEX IF NOT EXISTS idx_disciplines_group_semester
ON disciplines (group_id, semester_id)
WHERE is_archived = 0;

CREATE INDEX IF NOT EXISTS idx_audiences_type ON audiences (audience_type_id);
CREATE INDEX IF NOT EXISTS idx_audiences_building ON audiences (building_id);

CREATE INDEX IF NOT EXISTS idx_schedule_items_group_week
ON schedule_items (group_id, week_id)
WHERE is_archived = 0;

CREATE INDEX IF NOT EXISTS idx_schedule_items_week_day
ON schedule_items (week_id, day_of_week)
WHERE is_archived = 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_group_conflict
ON schedule_items (week_id, day_of_week, lesson_period_id, group_id)
WHERE is_archived = 0 AND week_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_teacher_conflict
ON schedule_items (week_id, day_of_week, lesson_period_id, teacher_id)
WHERE is_archived = 0 AND week_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_audience_conflict
ON schedule_items (week_id, day_of_week, lesson_period_id, audience_id)
WHERE is_archived = 0 AND week_id IS NOT NULL AND audience_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_sessions_schedule_week
ON lesson_sessions (schedule_item_id, week_id)
WHERE is_archived = 0;

CREATE INDEX IF NOT EXISTS idx_attendance_records_student
ON attendance_records (student_id);

CREATE INDEX IF NOT EXISTS idx_grade_items_week_day
ON grade_items (week_id, day_of_week)
WHERE is_archived = 0;

CREATE INDEX IF NOT EXISTS idx_grade_items_discipline_week
ON grade_items (discipline_id, week_id)
WHERE is_archived = 0;

CREATE INDEX IF NOT EXISTS idx_grades_student
ON grades (student_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON audit_logs (entity_name, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON audit_logs (created_at);