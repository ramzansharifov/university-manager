ALTER TABLE grade_items ADD COLUMN week_id INTEGER REFERENCES weeks(id) ON DELETE SET NULL;
ALTER TABLE grade_items ADD COLUMN day_of_week INTEGER;

CREATE INDEX IF NOT EXISTS idx_grade_items_week
ON grade_items (discipline_id, week_id, day_of_week)
WHERE is_archived = 0;