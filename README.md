# Manga Tracker

A personal web app for tracking manga series across different reading statuses. Built with Go backend and React frontend, deployable as a single Docker image.

## Features

- **Track Manga**: Title, cover image, URL, reading status, current chapter
- **Multiple Statuses**: Reading, Backlog, Completed, Dropped, Hiatus
- **Two Views**:
  - **Table View**: Sortable, filterable list with inline actions
  - **Kanban View**: Drag-and-drop cards to change status
- **Suggested Readings**: See manga you haven't updated in a week
- **Bulk Actions**: Open all URLs or just Reading manga in browser tabs
- **Image Management**: Upload and store cover images locally
- **Offline-First**: No external dependencies, runs anywhere

## Tech Stack

**Backend:**
- Go 1.21+
- SQLite database
- REST API

**Frontend:**
- React 18+ with TypeScript
- Chakra UI v3
- Vite
- TanStack Query

## Local Development

### Prerequisites

- Go 1.21+
- Node.js 18+
- make

### Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd manga-tracker
```

2. Start the backend:
```bash
cd backend
make run
```
Backend runs on http://localhost:8080

3. In another terminal, start the frontend:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

### Backend Commands (via Makefile)

```bash
cd backend

make run        # Start development server
make build      # Build binary
make test       # Run tests
make format     # Format and lint code
make clean      # Remove build artifacts
make db-reset   # Backup and reset database
```

### Frontend Commands

```bash
cd frontend

npm run dev     # Start dev server
npm run build   # Build for production
npm test        # Run tests
npm run format  # Format and lint with Biome
```

## Production Deployment

### Using Docker/Podman

1. Build the image:
```bash
# With Docker
docker build -t manga-tracker .

# With Podman
podman build -t manga-tracker .
```

2. Run the container:
```bash
# With Docker
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  --name manga-tracker \
  manga-tracker

# With Podman
podman run -d \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  --name manga-tracker \
  manga-tracker
```

3. Access at http://localhost:8080

The `/data` volume contains:
- `manga.db` - SQLite database
- `images/` - Uploaded cover images

### Manual Deployment

1. Build frontend:
```bash
cd frontend
npm install
npm run build
```

2. Build backend:
```bash
cd backend
make build
```

3. Run backend (serves both API and frontend):
```bash
cd backend
DATA_DIR=/path/to/data PORT=8080 ./bin/manga-tracker
```

## Project Structure

```
.
├── backend/               # Go backend
│   ├── cmd/              # Application entrypoint
│   ├── internal/         # Internal packages
│   │   ├── api/         # HTTP handlers
│   │   ├── database/    # DB initialization
│   │   └── manga/       # Domain models
│   ├── Makefile         # Development commands
│   └── go.mod
├── frontend/             # React frontend
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # Reusable components
│   │   ├── features/    # Feature modules
│   │   └── types/       # TypeScript types
│   ├── vite.config.ts
│   ├── biome.json       # Linter config
│   └── package.json
├── docs/
│   └── adr/             # Architecture Decision Records
├── .github/instructions/ # Development guides
├── .agents/skills/      # Agent skill documentation
├── CONTEXT.md           # Domain language glossary
├── Dockerfile           # Production image
└── README.md
```

## API Endpoints

- `GET /api/manga` - List all manga
- `POST /api/manga` - Create new manga
- `GET /api/manga/:id` - Get single manga
- `PUT /api/manga/:id` - Update manga
- `DELETE /api/manga/:id` - Delete manga
- `GET /api/manga/suggested` - Get suggested readings

## Testing

**Backend:**
```bash
cd backend
make test
```

**Frontend:**
```bash
cd frontend
npm test
```

See [TDD Workflow](.github/instructions/tdd-workflow.md) for development practices.

## Documentation

- [CONTEXT.md](./CONTEXT.md) - Domain language and concepts
- [Architecture Decisions](./docs/adr/) - Key technical choices
- [Verification Guide](.github/instructions/verification.md) - How to verify changes
- [Linting Guide](.github/instructions/linting.md) - Code quality tools
- [TDD Workflow](.github/instructions/tdd-workflow.md) - Test-driven development

## Skills Documentation

Agent-friendly guides for common tasks:
- [Makefile](.agents/skills/makefile/SKILL.md)
- [Vite](.agents/skills/vite/SKILL.md)
- [Chakra UI](.agents/skills/chakra-ui-v3/SKILL.md)
- [Biome](.agents/skills/biome/SKILL.md)
- [SQLite](.agents/skills/sqlite/SKILL.md)
- [TDD](.agents/skills/tdd/SKILL.md)

## License

Personal project - use as you wish.

