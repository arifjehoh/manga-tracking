# Test-Driven Development Workflow

Follow this TDD workflow when adding features or fixing bugs.

## The Red-Green-Refactor Loop

```
1. RED:    Write a failing test
2. GREEN:  Write minimal code to pass
3. REFACTOR: Improve without breaking tests
4. REPEAT
```

## Backend TDD (Go)

### Example: Adding a new API endpoint

**Step 1: Write the test (RED)**

`backend/internal/api/handlers_test.go`:
```go
func TestGetSuggestedReadings(t *testing.T) {
    // Setup test DB with old manga
    db := setupTestDB(t)
    defer db.Close()
    
    repo := manga.NewRepository(db)
    repo.Create(&manga.Manga{
        ID: "1",
        Title: "Old Manga",
        Status: "Reading",
        UpdatedAt: time.Now().Add(-8 * 24 * time.Hour), // 8 days ago
    })
    
    // Make request
    req := httptest.NewRequest("GET", "/api/manga/suggested", nil)
    w := httptest.NewRecorder()
    
    h := NewHandler(repo)
    h.GetSuggestedReadings(w, req)
    
    // Assert
    assert.Equal(t, 200, w.Code)
    var result []manga.Manga
    json.Unmarshal(w.Body.Bytes(), &result)
    assert.Len(t, result, 1)
    assert.Equal(t, "Old Manga", result[0].Title)
}
```

Run test: `make test` → FAIL ❌

**Step 2: Implement (GREEN)**

`backend/internal/api/handlers.go`:
```go
func (h *Handler) GetSuggestedReadings(w http.ResponseWriter, r *http.Request) {
    oneWeekAgo := time.Now().Add(-7 * 24 * time.Hour)
    manga, err := h.repo.FindByStatusAndOlderThan("Reading", oneWeekAgo)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    json.NewEncoder(w).Encode(manga)
}
```

Run test: `make test` → PASS ✅

**Step 3: Refactor**

Extract constants, improve naming, add comments. Rerun tests to ensure still passing.

### Running Tests

```bash
cd backend

# Run all tests
make test

# Run specific package
go test ./internal/manga/...

# Run with coverage
go test -cover ./...

# Verbose output
go test -v ./...
```

## Frontend TDD (React)

### Example: Adding a manga card component

**Step 1: Write the test (RED)**

`frontend/src/components/MangaCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MangaCard } from './MangaCard'

describe('MangaCard', () => {
  test('renders manga title and status', () => {
    const manga = {
      id: '1',
      title: 'Naruto',
      status: 'Reading',
      chapter: 50
    }
    
    render(<MangaCard manga={manga} onEdit={jest.fn()} />)
    
    expect(screen.getByText('Naruto')).toBeInTheDocument()
    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText(/Chapter 50/i)).toBeInTheDocument()
  })
  
  test('calls onEdit when edit button clicked', () => {
    const manga = { id: '1', title: 'Naruto', status: 'Reading', chapter: 50 }
    const onEdit = jest.fn()
    
    render(<MangaCard manga={manga} onEdit={onEdit} />)
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    
    expect(onEdit).toHaveBeenCalledWith(manga)
  })
})
```

Run test: `npm test` → FAIL ❌

**Step 2: Implement (GREEN)**

`frontend/src/components/MangaCard.tsx`:
```tsx
import { Card, Heading, Text, Button } from '@chakra-ui/react'

interface Props {
  manga: Manga
  onEdit: (manga: Manga) => void
}

export function MangaCard({ manga, onEdit }: Props) {
  return (
    <Card>
      <Heading size="md">{manga.title}</Heading>
      <Text>{manga.status}</Text>
      <Text>Chapter {manga.chapter}</Text>
      <Button onClick={() => onEdit(manga)}>Edit</Button>
    </Card>
  )
}
```

Run test: `npm test` → PASS ✅

**Step 3: Refactor**

Improve layout, extract styled components, add accessibility. Rerun tests.

### Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run in watch mode (auto-rerun on changes)
npm test -- --watch

# Run specific test file
npm test MangaCard.test

# Coverage report
npm test -- --coverage
```

## Best Practices

### Do:
✅ Write the test first (resist the urge to code first)
✅ Start with the simplest test case
✅ Make each test independent (no shared state)
✅ Test behavior, not implementation details
✅ Use descriptive test names: `test('updates chapter when user submits form')`

### Don't:
❌ Skip writing tests ("I'll add them later")
❌ Write tests after the code is done (that's not TDD)
❌ Test trivial code (getters, simple config)
❌ Mock everything (prefer real dependencies when fast)
❌ Ignore failing tests (fix or remove, never commit red)

## Debugging Failed Tests

### Backend:
```bash
# Run single test with verbose output
cd backend && go test -v -run TestGetSuggestedReadings ./internal/api/

# Print debug info in tests
t.Logf("Debug: %+v", someValue)
```

### Frontend:
```bash
# Run single test file
cd frontend && npm test MangaCard.test

# Debug with screen.debug()
import { screen } from '@testing-library/react'
screen.debug() // Prints current DOM
```

## Pre-Commit Checklist

Before committing:
1. All tests pass: `make test` (backend) and `npm test` (frontend)
2. No skipped tests (fix or remove)
3. Code formatted: `make format` and `npm run format`
4. Meaningful commit message describing what and why

Happy TDD! 🧪
