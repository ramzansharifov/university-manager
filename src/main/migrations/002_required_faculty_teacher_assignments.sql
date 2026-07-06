-- Historical compatibility marker.
-- The schema repair step adds these columns only when they are absent.
-- Keeping this migration name is required for databases that already recorded it.
SELECT 1;
