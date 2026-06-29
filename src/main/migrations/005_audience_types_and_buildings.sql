CREATE TABLE IF NOT EXISTS audience_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  description TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO buildings (name)
SELECT DISTINCT TRIM(building)
FROM audiences
WHERE building IS NOT NULL
  AND TRIM(building) <> '';

INSERT OR IGNORE INTO audience_types (name)
SELECT DISTINCT dictionary_items.name
FROM audiences
JOIN dictionary_items ON dictionary_items.id = audiences.audience_type_id
WHERE audiences.audience_type_id IS NOT NULL;

CREATE TABLE audiences_next (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience_type_id INTEGER,
  building_id INTEGER,
  name TEXT NOT NULL,
  floor INTEGER,
  capacity INTEGER,
  note TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (audience_type_id) REFERENCES audience_types(id) ON DELETE SET NULL,
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL
);

INSERT INTO audiences_next (
  id,
  audience_type_id,
  building_id,
  name,
  floor,
  capacity,
  note,
  is_archived,
  created_at,
  updated_at
)
SELECT
  audiences.id,
  audience_types.id,
  buildings.id,
  audiences.name,
  CASE
    WHEN audiences.name GLOB '[0-9]*' THEN CAST(SUBSTR(audiences.name, 1, 1) AS INTEGER)
    ELSE NULL
  END,
  audiences.capacity,
  audiences.note,
  audiences.is_archived,
  audiences.created_at,
  audiences.updated_at
FROM audiences
LEFT JOIN dictionary_items ON dictionary_items.id = audiences.audience_type_id
LEFT JOIN audience_types ON audience_types.name = dictionary_items.name
LEFT JOIN buildings ON buildings.name = TRIM(audiences.building);

DROP TABLE audiences;

ALTER TABLE audiences_next RENAME TO audiences;

CREATE UNIQUE INDEX IF NOT EXISTS idx_audiences_unique_without_building
ON audiences(name)
WHERE building_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_audiences_unique_with_building
ON audiences(building_id, name)
WHERE building_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audiences_type_id
ON audiences(audience_type_id);

CREATE INDEX IF NOT EXISTS idx_audiences_building_id
ON audiences(building_id);