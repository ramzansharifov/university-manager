ALTER TABLE faculties ADD COLUMN dean_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE faculties ADD COLUMN deputy_dean_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE departments ADD COLUMN head_teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL;
ALTER TABLE departments ADD COLUMN deputy_head_teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL;

ALTER TABLE students ADD COLUMN address TEXT;
ALTER TABLE students ADD COLUMN social_status TEXT;
ALTER TABLE students ADD COLUMN public_activity TEXT;
ALTER TABLE students ADD COLUMN transfer_info TEXT;
ALTER TABLE students ADD COLUMN status_changed_at TEXT;

ALTER TABLE teachers ADD COLUMN birth_date TEXT;
ALTER TABLE teachers ADD COLUMN address TEXT;
ALTER TABLE teachers ADD COLUMN hire_date TEXT;
ALTER TABLE teachers ADD COLUMN dismissal_date TEXT;

ALTER TABLE employees ADD COLUMN birth_date TEXT;
ALTER TABLE employees ADD COLUMN address TEXT;
ALTER TABLE employees ADD COLUMN hire_date TEXT;
ALTER TABLE employees ADD COLUMN dismissal_date TEXT;

INSERT OR IGNORE INTO dictionary_items (dictionary_key, item_key, name, sort_order)
VALUES
  ('student_statuses', 'transferred', 'Переведён', 35),
  ('student_statuses', 'dismissed', 'Отчислен', 36),

  ('teacher_statuses', 'on_leave', 'В отпуске', 30),
  ('teacher_statuses', 'dismissed', 'Уволен', 40),

  ('employee_statuses', 'on_leave', 'В отпуске', 30),
  ('employee_statuses', 'dismissed', 'Уволен', 40);