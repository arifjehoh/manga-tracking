---
name: vite
description: Vite configuration for React + TypeScript development and production builds
---

# Vite Skill

The frontend uses Vite for fast development and optimized production builds.

## Configuration

Located at `/frontend/vite.config.ts`. Key settings:
- React plugin for JSX transform
- TypeScript support
- Dev server proxy to backend API (optional)
- Build output to `frontend/dist/`

## npm Scripts

### `npm run dev`
Starts the Vite dev server with HMR (Hot Module Replacement).

```bash
cd frontend && npm run dev
```

Default: http://localhost:5173

### `npm run build`
Builds the production-optimized bundle to `frontend/dist/`.

```bash
cd frontend && npm run build
```

### `npm run preview`
Previews the production build locally.

```bash
cd frontend && npm run preview
```

## Development Workflow

1. Start backend: `cd backend && make run` (port 8080)
2. Start frontend: `cd frontend && npm run dev` (port 5173)
3. Frontend proxies API calls to `http://localhost:8080/api`

## Production Build

The Vite build generates static assets in `frontend/dist/`. In production (Docker), the Go backend serves these files and handles `/api/*` routes.

## Troubleshooting

- **Port conflict**: Change dev server port in `vite.config.ts` → `server.port`
- **API 404 errors**: Ensure backend is running and proxy is configured correctly
- **Module not found**: Run `npm install` to install dependencies
