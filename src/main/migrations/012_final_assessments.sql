CREATE TABLE IF NOT EXISTS final_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  discipline_id INTEGER NOT NULL,
  grade_element_type_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
  FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE RESTRICT,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE RESTRICT,
  FOREIGN KEY (grade_element_type_id) REFERENCES grade_element_types(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS final_assessment_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  final_assessment_id INTEGER NOT NULL,
  round_type TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  grade_item_id INTEGER,
  week_id INTEGER,
  day_of_week INTEGER,
  assessment_date TEXT,
  starts_at TEXT,
  ends_at TEXT,
  lesson_period_id INTEGER,
  teacher_id INTEGER,
  audience_id INTEGER,
  status TEXT NOT NULL DEFAULT 'not_scheduled',
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (final_assessment_id) REFERENCES final_assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_item_id) REFERENCES grade_items(id) ON DELETE SET NULL,
  FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_period_id) REFERENCES lesson_periods(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (audience_id) REFERENCES audiences(id) ON DELETE SET NULL,
  UNIQUE (final_assessment_id, round_type),
  UNIQUE (final_assessment_id, round_number),
  UNIQUE (grade_item_id)
);

CREATE INDEX IF NOT EXISTS idx_final_assessments_group_semester
ON final_assessments (group_id, semester_id);

CREATE INDEX IF NOT EXISTS idx_final_assessment_rounds_assessment
ON final_assessment_rounds (final_assessment_id, round_number);
