ALTER TABLE grade_element_types ADD COLUMN grading_mode TEXT NOT NULL DEFAULT 'score';
ALTER TABLE grade_element_types ADD COLUMN min_score REAL;
ALTER TABLE grade_element_types ADD COLUMN max_score REAL;
ALTER TABLE grade_element_types ADD COLUMN passing_score REAL;
ALTER TABLE grade_element_types ADD COLUMN is_intermediate INTEGER NOT NULL DEFAULT 0;
ALTER TABLE grade_element_types ADD COLUMN is_final INTEGER NOT NULL DEFAULT 0;