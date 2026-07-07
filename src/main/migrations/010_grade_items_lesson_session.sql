ALTER TABLE grade_items
ADD COLUMN lesson_session_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_grade_items_lesson_session_id
ON grade_items (lesson_session_id);
