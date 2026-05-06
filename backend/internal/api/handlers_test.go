package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/arif/manga-tracker/internal/database"
	"github.com/arif/manga-tracker/internal/manga"
)

func setupTestServer(t *testing.T) (*Server, func()) {
	t.Helper()

	tmpDir := filepath.Join(os.TempDir(), "manga-tracker-api-test-"+time.Now().Format("20060102-150405"))
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	db, err := database.Initialize(tmpDir)
	if err != nil {
		os.RemoveAll(tmpDir)
		t.Fatalf("Failed to initialize database: %v", err)
	}

	repo := manga.NewRepository(db)
	server := NewServer(repo, tmpDir, "8080")

	cleanup := func() {
		db.Close()
		os.RemoveAll(tmpDir)
	}

	return server, cleanup
}

func TestListManga(t *testing.T) {
	server, cleanup := setupTestServer(t)
	defer cleanup()

	// Create some test data
	testManga := []*manga.Manga{
		{ID: "test-1", Title: "One Piece", Status: manga.StatusReading, Chapter: 1000},
		{ID: "test-2", Title: "Naruto", Status: manga.StatusCompleted, Chapter: 700},
	}

	for _, m := range testManga {
		if err := server.repository.Create(m); err != nil {
			t.Fatalf("Failed to create test manga: %v", err)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/api/manga", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Status = %d, want %d", w.Code, http.StatusOK)
	}

	var result []*manga.Manga
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if len(result) != 2 {
		t.Errorf("Got %d manga, want 2", len(result))
	}
}

func TestCreateManga(t *testing.T) {
	server, cleanup := setupTestServer(t)
	defer cleanup()

	tests := []struct {
		name       string
		payload    map[string]interface{}
		wantStatus int
	}{
		{
			name: "valid manga",
			payload: map[string]interface{}{
				"title":   "New Manga",
				"status":  "Reading",
				"chapter": 10,
			},
			wantStatus: http.StatusCreated,
		},
		{
			name: "empty title",
			payload: map[string]interface{}{
				"title":   "",
				"status":  "Reading",
				"chapter": 0,
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "invalid status",
			payload: map[string]interface{}{
				"title":   "Test Manga",
				"status":  "InvalidStatus",
				"chapter": 0,
			},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPost, "/api/manga", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			server.router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d", w.Code, tt.wantStatus)
			}

			if tt.wantStatus == http.StatusCreated {
				var result manga.Manga
				if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}
				if result.ID == "" {
					t.Error("Created manga has empty ID")
				}
				if result.Title != tt.payload["title"] {
					t.Errorf("Title = %v, want %v", result.Title, tt.payload["title"])
				}
			}
		})
	}
}

func TestGetManga(t *testing.T) {
	server, cleanup := setupTestServer(t)
	defer cleanup()

	// Create test manga
	testManga := &manga.Manga{
		ID:      "test-1",
		Title:   "Test Manga",
		Status:  manga.StatusReading,
		Chapter: 50,
	}
	if err := server.repository.Create(testManga); err != nil {
		t.Fatalf("Failed to create test manga: %v", err)
	}

	tests := []struct {
		name       string
		id         string
		wantStatus int
	}{
		{
			name:       "existing manga",
			id:         "test-1",
			wantStatus: http.StatusOK,
		},
		{
			name:       "non-existing manga",
			id:         "non-existing",
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/manga/"+tt.id, nil)
			w := httptest.NewRecorder()

			server.router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d", w.Code, tt.wantStatus)
			}

			if tt.wantStatus == http.StatusOK {
				var result manga.Manga
				if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}
				if result.ID != tt.id {
					t.Errorf("ID = %v, want %v", result.ID, tt.id)
				}
			}
		})
	}
}

func TestUpdateManga(t *testing.T) {
	server, cleanup := setupTestServer(t)
	defer cleanup()

	// Create test manga
	testManga := &manga.Manga{
		ID:      "test-1",
		Title:   "Original Title",
		Status:  manga.StatusReading,
		Chapter: 10,
	}
	if err := server.repository.Create(testManga); err != nil {
		t.Fatalf("Failed to create test manga: %v", err)
	}

	tests := []struct {
		name       string
		id         string
		payload    map[string]interface{}
		wantStatus int
	}{
		{
			name: "valid update",
			id:   "test-1",
			payload: map[string]interface{}{
				"title":   "Updated Title",
				"status":  "Completed",
				"chapter": 100,
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "non-existing manga",
			id:   "non-existing",
			payload: map[string]interface{}{
				"title":   "Test",
				"status":  "Reading",
				"chapter": 0,
			},
			wantStatus: http.StatusNotFound,
		},
		{
			name: "invalid data",
			id:   "test-1",
			payload: map[string]interface{}{
				"title":   "",
				"status":  "Reading",
				"chapter": 0,
			},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPut, "/api/manga/"+tt.id, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			server.router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d (body: %s)", w.Code, tt.wantStatus, w.Body.String())
			}

			if tt.wantStatus == http.StatusOK {
				var result manga.Manga
				if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}
				if result.Title != tt.payload["title"] {
					t.Errorf("Title = %v, want %v", result.Title, tt.payload["title"])
				}
			}
		})
	}
}

func TestDeleteManga(t *testing.T) {
	server, cleanup := setupTestServer(t)
	defer cleanup()

	// Create test manga
	testManga := &manga.Manga{
		ID:      "test-1",
		Title:   "Test Manga",
		Status:  manga.StatusReading,
		Chapter: 10,
	}
	if err := server.repository.Create(testManga); err != nil {
		t.Fatalf("Failed to create test manga: %v", err)
	}

	tests := []struct {
		name       string
		id         string
		wantStatus int
	}{
		{
			name:       "existing manga",
			id:         "test-1",
			wantStatus: http.StatusNoContent,
		},
		{
			name:       "non-existing manga",
			id:         "non-existing",
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodDelete, "/api/manga/"+tt.id, nil)
			w := httptest.NewRecorder()

			server.router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d", w.Code, tt.wantStatus)
			}

			// For successful delete, verify it's gone
			if tt.wantStatus == http.StatusNoContent {
				_, err := server.repository.GetByID(tt.id)
				if err != manga.ErrNotFound {
					t.Error("Manga should be deleted but still exists")
				}
			}
		})
	}
}

func TestGetSuggestedManga(t *testing.T) {
	server, cleanup := setupTestServer(t)
	defer cleanup()

	// Create manga with different statuses and update times
	oldTime := time.Now().Add(-8 * 24 * time.Hour)

	testManga := []*manga.Manga{
		{ID: "test-1", Title: "Old Reading", Status: manga.StatusReading, Chapter: 10},
		{ID: "test-2", Title: "Recent Reading", Status: manga.StatusReading, Chapter: 20},
		{ID: "test-3", Title: "Old Backlog", Status: manga.StatusBacklog, Chapter: 0},
	}

	for _, m := range testManga {
		if err := server.repository.Create(m); err != nil {
			t.Fatalf("Failed to create test manga: %v", err)
		}
	}

	// Manually update timestamp to simulate old entry
	_, err := server.repository.GetDB().Exec("UPDATE manga SET updated_at = ? WHERE id = ?", oldTime, "test-1")
	if err != nil {
		t.Fatalf("Failed to update timestamp: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/manga/suggested", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Status = %d, want %d", w.Code, http.StatusOK)
	}

	var result []*manga.Manga
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if len(result) != 1 {
		t.Errorf("Got %d suggested manga, want 1", len(result))
	}

	if len(result) > 0 && result[0].ID != "test-1" {
		t.Errorf("Suggested manga ID = %v, want test-1", result[0].ID)
	}
}

func TestCORSMiddleware(t *testing.T) {
	server, cleanup := setupTestServer(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodOptions, "/api/manga", nil)
	w := httptest.NewRecorder()

	// Apply CORS middleware directly
	handler := corsMiddleware(server.router)
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Status = %d, want %d", w.Code, http.StatusOK)
	}

	corsHeader := w.Header().Get("Access-Control-Allow-Origin")
	if corsHeader != "*" {
		t.Errorf("CORS header = %v, want *", corsHeader)
	}

	methodsHeader := w.Header().Get("Access-Control-Allow-Methods")
	if methodsHeader == "" {
		t.Error("Access-Control-Allow-Methods header is missing")
	}
}
