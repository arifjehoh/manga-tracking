---
name: sqlite
description: SQLite database schema, queries, and management for manga tracking
---

# SQLite Skill

This project uses SQLite as the persistent datastore. DB file lives at `/data/manga.db` (volume-mounted in Docker).

## Schema

### `manga` table

```sql
CREATE TABLE manga (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    image TEXT,
    url TEXT,
    status TEXT NOT NULL CHECK(status IN ('Reading', 'Backlog', 'Completed', 'Dropped', 'Hiatus')),
    chapter INTEGER NOT NULL DEFAULT 0,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_manga_status ON manga(status);
CREATE INDEX idx_manga_updated_at ON manga(updated_at);
```

## Common Queries

### List all manga
```sql
SELECT * FROM manga ORDER BY updated_at DESC;
```

### Get suggested readings (Reading status, 1+ week old)
```sql
SELECT * FROM manga 
WHERE status = 'Reading' 
  AND updated_at < datetime('now', '-7 days')
ORDER BY updated_at ASC;
```

### Filter by status
```sql
SELECT * FROM manga WHERE status = 'Reading';
```

### Update manga
```sql
UPDATE manga 
SET chapter = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;
```

## Database Reset

The `make db-reset` target in the backend Makefile:
1. Renames current `manga.db` to `manga.db.<timestamp>`
2. Creates a fresh empty database with schema

## Migrations

For schema changes:
1. Add migration logic to backend initialization code
2. Version the schema (e.g., `PRAGMA user_version`)
3. Apply migrations on startup if needed

Start simple—manual schema changes are fine for a personal tool.

## SQLite CLI

Inspect the DB directly:
```bash
sqlite3 /data/manga.db
sqlite> .schema manga
sqlite> SELECT * FROM manga LIMIT 5;
```

## Performance

SQLite is fast enough for personal use (hundreds/thousands of manga). If needed:
- Add indexes on frequently queried columns
- Use EXPLAIN QUERY PLAN to debug slow queries
- Consider WAL mode for concurrent reads/writes
