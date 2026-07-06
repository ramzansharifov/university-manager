-- Historical compatibility marker.
--
-- The original SQL rebuild was unsafe for databases where departments.faculty_id
-- had already been removed: SQLite still parsed the missing column reference.
-- The guarded rebuild now lives in database/schemaRepair.ts, where the actual
-- table shape is inspected before any legacy column is referenced.
SELECT 1;
