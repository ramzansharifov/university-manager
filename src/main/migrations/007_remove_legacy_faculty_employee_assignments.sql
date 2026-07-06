-- Historical compatibility marker.
-- Existing legacy columns are intentionally left untouched to avoid deleting user data.
-- Backend and frontend ignore them; new databases never create them.
SELECT 1;
