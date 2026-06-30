ALTER TABLE schedule_items ADD COLUMN week_id INTEGER REFERENCES weeks(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS idx_schedule_group_conflict;
DROP INDEX IF EXISTS idx_schedule_teacher_conflict;
DROP INDEX IF EXISTS idx_schedule_audience_conflict;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_group_conflict
ON schedule_items (semester_id, week_id, day_of_week, lesson_period_id, group_id)
WHERE is_archived = 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_teacher_conflict
ON schedule_items (semester_id, week_id, day_of_week, lesson_period_id, teacher_id)
WHERE is_archived = 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_audience_conflict
ON schedule_items (semester_id, week_id, day_of_week, lesson_period_id, audience_id)
WHERE is_archived = 0 AND audience_id IS NOT NULL;