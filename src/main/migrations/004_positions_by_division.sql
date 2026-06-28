ALTER TABLE positions ADD COLUMN division_id INTEGER REFERENCES divisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_positions_division_id
ON positions(division_id);

UPDATE positions
SET division_id = (
  SELECT MIN(employees.division_id)
  FROM employees
  WHERE employees.position_id = positions.id
    AND employees.division_id IS NOT NULL
)
WHERE division_id IS NULL
  AND (
    SELECT COUNT(DISTINCT employees.division_id)
    FROM employees
    WHERE employees.position_id = positions.id
      AND employees.division_id IS NOT NULL
  ) = 1;