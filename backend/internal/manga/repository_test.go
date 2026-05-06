package manga

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/arif/manga-tracker/internal/database"
)

func setupTestDB(t *testing.T) (*database.DB, string, func()) {
	t.Helper()

	tmpDir := filepath.Join(os.TempDir(), "manga-tracker-test-"+time.Now().Format("20060102-150405"))
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	db, err := database.Initialize(tmpDir)
	if err != nil {
		os.RemoveAll(tmpDir)
		t.Fatalf("Failed to initialize database: %v", err)
	}

	cleanup := func() {
		db.Close()
		os.RemoveAll(tmpDir)
	}

	return db, tmpDir, cleanup
}

func TestRepositoryCreate(t *testing.T) {
	db, _, cleanup := setupTestDB(t)
	defer cleanup()

	repo := NewRepository(db)

	tests := []struct {
		name    string
		manga   *Manga
		wantErr bool
	}{
		{
			name: "valid manga",
			manga: &Manga{
				ID:      "test-1",
				Title:   "One Piece",
				Status:  StatusReading,
				Chapter: 1000,
			},
			wantErr: false,
		},
		{
			name: "empty title",
			manga: &Manga{
				ID:      "test-2",
				Title:   "",
				Status:  StatusReading,
				Chapter: 0,
			},
			wantErr: true,
		},
		{
			name: "negative chapter",
			manga: &Manga{
				ID:      "test-3",
				Title:   "Test Manga",
				Status:  StatusReading,
				Chapter: -1,
			},
			wantErr: true,
		},
		{
			name: "invalid status",
			manga: &Manga{
				ID:      "test-4",
				Title:   "Test Manga",
				Status:  "Invalid",
				Chapter: 0,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.Create(tt.manga)
			if (err != nil) != tt.wantErr {
				t.Errorf("Create() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr {
				// Verify it was created
				got, err := repo.GetByID(tt.manga.ID)
				if err != nil {
					t.Errorf("GetByID() error = %v", err)
					return
				}
				if got.Title != tt.manga.Title {
					t.Errorf("Title = %v, want %v", got.Title, tt.manga.Title)
				}
				if got.Status != tt.manga.Status {
					t.Errorf("Status = %v, want %v", got.Status, tt.manga.Status)
				}
				if got.Chapter != tt.manga.Chapter {
					t.Errorf("Chapter = %v, want %v", got.Chapter, tt.manga.Chapter)
				}
			}
		})
	}
}

func TestRepositoryGetByID(t *testing.T) {
	db, _, cleanup := setupTestDB(t)
	defer cleanup()

	repo := NewRepository(db)

	manga := &Manga{
		ID:      "test-1",
		Title:   "Test Manga",
		Status:  StatusReading,
		Chapter: 50,
	}
	if err := repo.Create(manga); err != nil {
		t.Fatalf("Failed to create manga: %v", err)
	}

	t.Run("existing manga", func(t *testing.T) {
		got, err := repo.GetByID("test-1")
		if err != nil {
			t.Errorf("GetByID() error = %v", err)
			return
		}
		if got.ID != manga.ID {
			t.Errorf("ID = %v, want %v", got.ID, manga.ID)
		}
		if got.Title != manga.Title {
			t.Errorf("Title = %v, want %v", got.Title, manga.Title)
		}
	})

	t.Run("non-existing manga", func(t *testing.T) {
		_, err := repo.GetByID("non-existing")
		if err != ErrNotFound {
			t.Errorf("GetByID() error = %v, want %v", err, ErrNotFound)
		}
	})
}

func TestRepositoryList(t *testing.T) {
	db, _, cleanup := setupTestDB(t)
	defer cleanup()

	repo := NewRepository(db)

	// Create some manga
	mangas := []*Manga{
		{ID: "test-1", Title: "Manga 1", Status: StatusReading, Chapter: 10},
		{ID: "test-2", Title: "Manga 2", Status: StatusBacklog, Chapter: 0},
		{ID: "test-3", Title: "Manga 3", Status: StatusCompleted, Chapter: 100},
	}

	for _, m := range mangas {
		if err := repo.Create(m); err != nil {
			t.Fatalf("Failed to create manga: %v", err)
		}
		time.Sleep(10 * time.Millisecond) // Ensure different updated_at times
	}

	list, err := repo.List()
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}

	if len(list) != len(mangas) {
		t.Errorf("List() returned %d items, want %d", len(list), len(mangas))
	}

	// Should be ordered by updated_at DESC (most recent first)
	if list[0].ID != "test-3" {
		t.Errorf("List() first item ID = %v, want test-3", list[0].ID)
	}
}

func TestRepositoryUpdate(t *testing.T) {
	db, _, cleanup := setupTestDB(t)
	defer cleanup()

	repo := NewRepository(db)

	manga := &Manga{
		ID:      "test-1",
		Title:   "Original Title",
		Status:  StatusReading,
		Chapter: 10,
	}
	if err := repo.Create(manga); err != nil {
		t.Fatalf("Failed to create manga: %v", err)
	}

	t.Run("update existing manga", func(t *testing.T) {
		manga.Title = "Updated Title"
		manga.Chapter = 20
		manga.Status = StatusCompleted

		err := repo.Update(manga)
		if err != nil {
			t.Errorf("Update() error = %v", err)
			return
		}

		// Verify update
		got, err := repo.GetByID("test-1")
		if err != nil {
			t.Errorf("GetByID() error = %v", err)
			return
		}
		if got.Title != "Updated Title" {
			t.Errorf("Title = %v, want Updated Title", got.Title)
		}
		if got.Chapter != 20 {
			t.Errorf("Chapter = %v, want 20", got.Chapter)
		}
		if got.Status != StatusCompleted {
			t.Errorf("Status = %v, want %v", got.Status, StatusCompleted)
		}
	})

	t.Run("update non-existing manga", func(t *testing.T) {
		nonExisting := &Manga{
			ID:      "non-existing",
			Title:   "Test",
			Status:  StatusReading,
			Chapter: 0,
		}
		err := repo.Update(nonExisting)
		if err != ErrNotFound {
			t.Errorf("Update() error = %v, want %v", err, ErrNotFound)
		}
	})
}

func TestRepositoryDelete(t *testing.T) {
	db, _, cleanup := setupTestDB(t)
	defer cleanup()

	repo := NewRepository(db)

	manga := &Manga{
		ID:      "test-1",
		Title:   "Test Manga",
		Status:  StatusReading,
		Chapter: 10,
	}
	if err := repo.Create(manga); err != nil {
		t.Fatalf("Failed to create manga: %v", err)
	}

	t.Run("delete existing manga", func(t *testing.T) {
		err := repo.Delete("test-1")
		if err != nil {
			t.Errorf("Delete() error = %v", err)
			return
		}

		// Verify it's deleted
		_, err = repo.GetByID("test-1")
		if err != ErrNotFound {
			t.Errorf("GetByID() after delete error = %v, want %v", err, ErrNotFound)
		}
	})

	t.Run("delete non-existing manga", func(t *testing.T) {
		err := repo.Delete("non-existing")
		if err != ErrNotFound {
			t.Errorf("Delete() error = %v, want %v", err, ErrNotFound)
		}
	})
}

func TestRepositoryGetSuggested(t *testing.T) {
	db, _, cleanup := setupTestDB(t)
	defer cleanup()

	repo := NewRepository(db)

	// Create manga with different statuses and update times
	oldTime := time.Now().Add(-8 * 24 * time.Hour)    // 8 days ago
	recentTime := time.Now().Add(-1 * 24 * time.Hour) // 1 day ago

	mangas := []*Manga{
		{ID: "test-1", Title: "Old Reading", Status: StatusReading, Chapter: 10},      // Should be suggested
		{ID: "test-2", Title: "Recent Reading", Status: StatusReading, Chapter: 20},   // Should NOT be suggested
		{ID: "test-3", Title: "Old Backlog", Status: StatusBacklog, Chapter: 0},       // Should NOT be suggested
		{ID: "test-4", Title: "Old Completed", Status: StatusCompleted, Chapter: 100}, // Should NOT be suggested
	}

	for _, m := range mangas {
		if err := repo.Create(m); err != nil {
			t.Fatalf("Failed to create manga: %v", err)
		}
	}

	// Manually update timestamps to simulate old entries
	_, err := db.Exec("UPDATE manga SET updated_at = ? WHERE id = ?", oldTime, "test-1")
	if err != nil {
		t.Fatalf("Failed to update timestamp: %v", err)
	}
	_, err = db.Exec("UPDATE manga SET updated_at = ? WHERE id = ?", recentTime, "test-2")
	if err != nil {
		t.Fatalf("Failed to update timestamp: %v", err)
	}
	_, err = db.Exec("UPDATE manga SET updated_at = ? WHERE id = ?", oldTime, "test-3")
	if err != nil {
		t.Fatalf("Failed to update timestamp: %v", err)
	}
	_, err = db.Exec("UPDATE manga SET updated_at = ? WHERE id = ?", oldTime, "test-4")
	if err != nil {
		t.Fatalf("Failed to update timestamp: %v", err)
	}

	suggested, err := repo.GetSuggested()
	if err != nil {
		t.Fatalf("GetSuggested() error = %v", err)
	}

	if len(suggested) != 1 {
		t.Errorf("GetSuggested() returned %d items, want 1", len(suggested))
	}

	if len(suggested) > 0 && suggested[0].ID != "test-1" {
		t.Errorf("GetSuggested() returned ID = %v, want test-1", suggested[0].ID)
	}
}
