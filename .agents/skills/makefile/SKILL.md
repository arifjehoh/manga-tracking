---
name: makefile
description: Go backend Makefile targets for running, building, linting, cleaning, and resetting the database
---

# Makefile Skill

This project uses a Makefile in `/backend` for common development tasks.

## Available Targets

### `make run`
Starts the Go backend server for development. Listens on port 8080 by default (configurable via `PORT` env var).

```bash
cd backend && make run
# Or with custom port:
cd backend && PORT=3000 make run
```

### `make build`
Compiles the Go binary to `backend/bin/manga-tracker`.

```bash
cd backend && make build
```

### `make lint` / `make format`
Runs golangci-lint to check and auto-fix code style issues.

```bash
cd backend && make format
```

### `make clean`
Removes built binaries and temporary files.

```bash
cd backend && make clean
```

### `make db-reset`
Renames the current SQLite database file with a timestamp suffix (backup) and creates a fresh empty database with the schema.

```bash
cd backend && make db-reset
# Example: manga.db → manga.db.2026-05-06_21-30-45
```

**Warning:** Use with caution—this archives the current DB and starts fresh.

### `make test`
Runs all tests (unit + integration).

```bash
cd backend && make test
```

## Usage Pattern

For local development:
```bash
# Terminal 1: Run backend
cd backend && make run

# Terminal 2: In another session, run frontend
cd frontend && npm run dev
```

For CI/testing:
```bash
cd backend && make format && make test && make build
```
