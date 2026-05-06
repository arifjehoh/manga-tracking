package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/arif/manga-tracker/internal/manga"
	"github.com/google/uuid"
)

func (s *Server) handleMangaList(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/api/manga" {
		http.NotFound(w, r)
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.listManga(w, r)
	case http.MethodPost:
		s.createManga(w, r)
	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *Server) handleMangaItem(w http.ResponseWriter, r *http.Request) {
	// Check if this is the suggested endpoint
	if strings.HasSuffix(r.URL.Path, "/suggested") {
		s.getSuggestedManga(w, r)
		return
	}

	// Extract ID from path: /api/manga/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/manga/")
	if path == "" || strings.Contains(path, "/") {
		http.NotFound(w, r)
		return
	}
	id := path

	switch r.Method {
	case http.MethodGet:
		s.getManga(w, r, id)
	case http.MethodPut:
		s.updateManga(w, r, id)
	case http.MethodDelete:
		s.deleteManga(w, r, id)
	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (s *Server) handleMangaSuggested(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	s.getSuggestedManga(w, r)
}

func (s *Server) listManga(w http.ResponseWriter, r *http.Request) {
	list, err := s.repository.List()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list manga")
		return
	}

	data, err := json.Marshal(list)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to encode response")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (s *Server) createManga(w http.ResponseWriter, r *http.Request) {
	var m manga.Manga

	// Check if this is multipart form data (with image upload)
	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
			writeError(w, http.StatusBadRequest, "Failed to parse multipart form")
			return
		}

		// Parse manga data from form fields
		m.ID = uuid.New().String()
		m.Title = r.FormValue("title")
		status := r.FormValue("status")
		if status == "" {
			status = string(manga.StatusBacklog)
		}
		m.Status = manga.Status(status)

		// Parse chapter
		var chapter int
		if chapterStr := r.FormValue("chapter"); chapterStr != "" {
			if _, err := fmt.Sscanf(chapterStr, "%d", &chapter); err != nil {
				writeError(w, http.StatusBadRequest, "Invalid chapter value")
				return
			}
		}
		m.Chapter = chapter

		// Optional URL
		if url := r.FormValue("url"); url != "" {
			m.URL = &url
		}

		// Handle image upload
		if file, header, err := r.FormFile("image"); err == nil {
			defer file.Close()
			imagePath, err := saveImage(file, header, s.dataDir)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "Failed to save image: "+err.Error())
				return
			}
			m.Image = &imagePath
		}
	} else {
		// Regular JSON request
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			writeError(w, http.StatusBadRequest, "Invalid request body")
			return
		}
		m.ID = uuid.New().String()
	}

	if err := s.repository.Create(&m); err != nil {
		if err == manga.ErrInvalidTitle || err == manga.ErrInvalidChapter || err == manga.ErrInvalidStatus {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to create manga")
		return
	}

	data, err := json.Marshal(m)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to encode response")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write(data)
}

func (s *Server) getManga(w http.ResponseWriter, r *http.Request, id string) {
	m, err := s.repository.GetByID(id)
	if err == manga.ErrNotFound {
		writeError(w, http.StatusNotFound, "Manga not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get manga")
		return
	}

	data, err := json.Marshal(m)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to encode response")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (s *Server) updateManga(w http.ResponseWriter, r *http.Request, id string) {
	// First check if manga exists
	existing, err := s.repository.GetByID(id)
	if err == manga.ErrNotFound {
		writeError(w, http.StatusNotFound, "Manga not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get manga")
		return
	}

	var m manga.Manga

	// Check if this is multipart form data (with image upload)
	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
			writeError(w, http.StatusBadRequest, "Failed to parse multipart form")
			return
		}

		m.ID = id
		m.Title = r.FormValue("title")
		if m.Title == "" {
			m.Title = existing.Title
		}

		status := r.FormValue("status")
		if status == "" {
			m.Status = existing.Status
		} else {
			m.Status = manga.Status(status)
		}

		// Parse chapter
		m.Chapter = existing.Chapter
		if chapterStr := r.FormValue("chapter"); chapterStr != "" {
			var chapter int
			if _, err := fmt.Sscanf(chapterStr, "%d", &chapter); err != nil {
				writeError(w, http.StatusBadRequest, "Invalid chapter value")
				return
			}
			m.Chapter = chapter
		}

		// Handle URL
		m.URL = existing.URL
		if url := r.FormValue("url"); url != "" {
			m.URL = &url
		}

		// Keep existing image by default
		m.Image = existing.Image

		// Handle image upload (replace existing)
		if file, header, err := r.FormFile("image"); err == nil {
			defer file.Close()
			imagePath, err := saveImage(file, header, s.dataDir)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "Failed to save image: "+err.Error())
				return
			}
			m.Image = &imagePath
		}
	} else {
		// Regular JSON request
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			writeError(w, http.StatusBadRequest, "Invalid request body")
			return
		}
		m.ID = id
	}

	if err := s.repository.Update(&m); err != nil {
		if err == manga.ErrNotFound {
			writeError(w, http.StatusNotFound, "Manga not found")
			return
		}
		if err == manga.ErrInvalidTitle || err == manga.ErrInvalidChapter || err == manga.ErrInvalidStatus {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to update manga")
		return
	}

	data, err := json.Marshal(m)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to encode response")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (s *Server) deleteManga(w http.ResponseWriter, r *http.Request, id string) {
	if err := s.repository.Delete(id); err != nil {
		if err == manga.ErrNotFound {
			writeError(w, http.StatusNotFound, "Manga not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to delete manga")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) getSuggestedManga(w http.ResponseWriter, r *http.Request) {
	list, err := s.repository.GetSuggested()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get suggested manga")
		return
	}

	data, err := json.Marshal(list)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to encode response")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
