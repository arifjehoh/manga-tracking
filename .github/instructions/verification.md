# Code Verification Guide

This guide explains how to verify your code changes before committing.

## Quick Checklist

Before pushing code, run:

**Backend:**
```bash
cd backend
make format  # Auto-fix style issues
make test    # Run all tests
make build   # Verify it compiles
```

**Frontend:**
```bash
cd frontend
npm run format  # Auto-fix with Biome
npm test        # Run component tests
npm run build   # Verify production build
```

## Detailed Verification Steps

### 1. Formatting

**Backend (golangci-lint):**
```bash
cd backend && make format
```
This runs `golangci-lint run --fix` to auto-correct style issues.

**Frontend (Biome):**
```bash
cd frontend && npm run format
```
This runs `biome check --write .` to fix formatting and imports.

### 2. Linting

**Backend:**
Included in `make format`. To check without fixing:
```bash
cd backend && golangci-lint run
```

**Frontend:**
```bash
cd frontend && npm run lint
```
This runs `biome check .` without modifications.

### 3. Testing

**Backend:**
```bash
cd backend && make test
```
Runs all unit and integration tests. Expected output: `PASS` for all packages.

**Frontend:**
```bash
cd frontend && npm test
```
Runs Vitest tests. All tests should pass.

### 4. Build Verification

**Backend:**
```bash
cd backend && make build
```
Compiles to `backend/bin/manga-tracker`. Should exit with code 0.

**Frontend:**
```bash
cd frontend && npm run build
```
Builds to `frontend/dist/`. Check for build errors.

### 5. Integration Check

After backend + frontend changes:
1. Start backend: `cd backend && make run`
2. Start frontend: `cd frontend && npm run dev`
3. Manually test affected features
4. Stop both servers

### 6. Docker Build (Optional)

For deployment verification:
```bash
docker build -t manga-tracker .
docker run -v $(pwd)/data:/data -p 8080:8080 manga-tracker
```
Visit http://localhost:8080 and verify functionality.

## Common Issues

**Backend won't build:**
- Check `go.mod` for missing dependencies
- Run `go mod tidy`

**Frontend tests fail:**
- Check for missing mocks or test setup
- Verify dependencies: `npm install`

**Linting errors:**
- Most can be auto-fixed with `make format` (backend) or `npm run format` (frontend)
- Manual fixes required for logic issues

## CI Pipeline Simulation

To simulate what CI will run:
```bash
# Backend
cd backend && make format && make test && make build

# Frontend  
cd frontend && npm run format && npm test && npm run build
```

All steps should pass before committing.
