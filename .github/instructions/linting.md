# Linting Guide

Linting ensures consistent code style and catches common errors.

## Backend (Go)

### Tool: golangci-lint

A fast Go linters aggregator that runs multiple linters in parallel.

### Installation

```bash
# macOS
brew install golangci-lint

# Linux
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin

# Or use the Makefile (it will prompt to install if missing)
cd backend && make lint
```

### Configuration

Located at `backend/.golangci.yml`. Key linters enabled:
- `gofmt` / `goimports` — formatting
- `govet` — suspicious constructs
- `staticcheck` — advanced static analysis
- `errcheck` — unchecked errors
- `unused` — unused code
- `gosimple` — simplifications

### Usage

**Auto-fix issues:**
```bash
cd backend && make format
```

**Check without fixing:**
```bash
cd backend && golangci-lint run
```

**Run specific linters:**
```bash
golangci-lint run --disable-all --enable=errcheck
```

### Common Issues

**Unchecked errors:**
```go
// Bad
file.Close()

// Good
defer file.Close()
```

**Unused variables:**
```go
// Bad
func process() {
    unused := "value"  // linter will flag this
    // ...
}

// Fix: remove or use the variable
```

**Ineffectual assignments:**
```go
// Bad
err := doSomething()
err = doSomethingElse()  // first err never checked

// Good
if err := doSomething(); err != nil {
    return err
}
```

## Frontend (TypeScript/React)

### Tool: Biome

A fast all-in-one linter and formatter for JavaScript/TypeScript.

### Installation

Already included in `package.json`. No separate install needed.

### Configuration

Located at `frontend/biome.json`. Features:
- TypeScript + JSX support
- React-specific rules
- Import sorting
- Consistent formatting (Prettier-compatible)

### Usage

**Auto-fix issues:**
```bash
cd frontend && npm run format
```
This runs `biome check --write .`

**Check without fixing:**
```bash
cd frontend && npm run lint
```
This runs `biome check .`

**Format only (skip linting):**
```bash
npx biome format --write .
```

### Common Issues

**Unused variables:**
```tsx
// Bad
const [value, setValue] = useState(0)  // setValue never used

// Fix: prefix with underscore or remove
const [value, _setValue] = useState(0)
```

**Missing React dependencies:**
```tsx
// Bad
useEffect(() => {
  fetchData(id)  // 'id' should be in deps
}, [])

// Good
useEffect(() => {
  fetchData(id)
}, [id])
```

**Prefer const over let:**
```tsx
// Bad
let name = "Naruto"  // never reassigned

// Good
const name = "Naruto"
```

## Editor Integration

### VS Code

**Backend (Go):**
1. Install [Go extension](https://marketplace.visualstudio.com/items?itemName=golang.go)
2. Settings → `"go.lintTool": "golangci-lint"`
3. Settings → `"editor.formatOnSave": true`

**Frontend (TypeScript):**
1. Install [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
2. Settings → `"editor.defaultFormatter": "biomejs.biome"`
3. Settings → `"editor.formatOnSave": true`

### Other Editors

- **Neovim**: Use `nvim-lspconfig` with Biome LSP
- **IntelliJ**: Built-in Go support, add Biome as external tool

## Pre-Commit Hook (Optional)

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash

echo "Running backend linter..."
cd backend && make format || exit 1

echo "Running frontend linter..."
cd frontend && npm run format || exit 1

echo "✅ Linting passed"
```

Make executable: `chmod +x .git/hooks/pre-commit`

## CI Integration

Both linters run in CI. Simulate locally:
```bash
# Backend
cd backend && make format && make test

# Frontend
cd frontend && npm run format && npm test
```

## Ignoring Rules (Use Sparingly)

**Backend:**
```go
//nolint:errcheck // Reason why this is OK
file.Close()
```

**Frontend:**
```tsx
// biome-ignore lint/suspicious/noExplicitAny: legacy code, will fix later
const data: any = legacyAPI()
```

Only ignore rules when absolutely necessary and always include a reason.
