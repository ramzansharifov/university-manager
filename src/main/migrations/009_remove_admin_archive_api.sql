-- Historical compatibility marker.
--
-- The active admin CRUD model no longer exposes soft archive/restore.
-- Legacy is_archived columns may remain in existing SQLite databases for compatibility,
-- but the app no longer exposes archive actions through admin CRUD.
SELECT 1;