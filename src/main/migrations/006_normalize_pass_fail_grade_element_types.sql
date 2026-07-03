UPDATE grade_element_types
SET
  min_score = 0,
  max_score = 1,
  passing_score = 1
WHERE grading_mode = 'pass_fail';
