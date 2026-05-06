---
name: tdd
description: Test-driven development workflow for backend and frontend
---

# TDD Skill

This project follows TDD principles: write tests first, then implement to pass.

## Backend (Go)

### Test Structure

```
backend/
├── internal/
│   ├── manga/
│   │   ├── manga.go
│   │   ├── manga_test.go
│   │   └── repository_test.go
│   └── api/
│       ├── handlers.go
│       └── handlers_test.go
```

### Running Tests

```bash
cd backend && make test
# Or directly:
cd backend && go test ./...
```

### Test Types

**Unit tests** — test business logic in isolation:
```go
func TestMangaValidation(t *testing.T) {
    m := manga.New("One Piece", "Reading", 1050)
    if err := m.Validate(); err != nil {
        t.Errorf("unexpected error: %v", err)
    }
}
```

**Integration tests** — test with a real test DB:
```go
func TestRepository_Create(t *testing.T) {
    db := setupTestDB(t) // Creates temp DB
    defer db.Close()
    
    repo := manga.NewRepository(db)
    m := &manga.Manga{...}
    err := repo.Create(m)
    // assertions...
}
```

### TDD Workflow (Backend)

1. Write a failing test
2. Run `make test` → RED
3. Write minimal code to pass
4. Run `make test` → GREEN
5. Refactor if needed
6. Repeat

## Frontend (React)

### Test Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── MangaTable.tsx
│   │   └── MangaTable.test.tsx
│   └── features/
│       ├── kanban/
│       │   ├── KanbanBoard.tsx
│       │   └── KanbanBoard.test.tsx
```

### Running Tests

```bash
cd frontend && npm test
# Or watch mode:
cd frontend && npm test -- --watch
```

### Test Types

**Component tests** — test UI behavior:
```tsx
import { render, screen } from '@testing-library/react'
import { MangaTable } from './MangaTable'

test('renders manga list', () => {
  const manga = [{ id: '1', title: 'Naruto', status: 'Reading' }]
  render(<MangaTable manga={manga} />)
  expect(screen.getByText('Naruto')).toBeInTheDocument()
})
```

**User interaction tests**:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'

test('updates chapter on input change', () => {
  render(<ChapterInput initialValue={10} onUpdate={jest.fn()} />)
  const input = screen.getByRole('spinbutton')
  fireEvent.change(input, { target: { value: '15' } })
  expect(input).toHaveValue(15)
})
```

### TDD Workflow (Frontend)

1. Write a failing component test
2. Run `npm test` → RED
3. Implement component to pass
4. Run `npm test` → GREEN
5. Refactor
6. Repeat

## Coverage

Don't chase 100% coverage—aim for confidence:
- Test critical paths (CRUD, status changes, bulk actions)
- Test edge cases (empty states, errors, invalid input)
- Skip trivial code (simple getters, config)

## Verification Checklist

Before committing:
1. `cd backend && make format && make test`
2. `cd frontend && npm run format && npm test`
3. All tests pass ✅
