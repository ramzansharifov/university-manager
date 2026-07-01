ALTER TABLE specialties
ADD COLUMN study_duration_years INTEGER NOT NULL DEFAULT 4;

ALTER TABLE curriculum_plans
ADD COLUMN course INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_curriculum_plans_specialty_course
ON curriculum_plans (specialty_id, course, academic_year_id, education_form_id)
WHERE is_archived = 0;