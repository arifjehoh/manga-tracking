package api

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/arif/manga-tracker/internal/manga"
)

type Server struct {
	router     *http.ServeMux
	repository *manga.Repository
	dataDir    string
	port       string
}

func NewServer(repo *manga.Repository, dataDir, port string) *Server {
	s := &Server{
		router:     http.NewServeMux(),
		repository: repo,
		dataDir:    dataDir,
		port:       port,
	}
	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	// API routes
	s.router.HandleFunc("/api/manga", s.handleMangaList)
	s.router.HandleFunc("/api/manga/", s.handleMangaItem)
	s.router.HandleFunc("/api/manga/suggested", s.handleMangaSuggested)

	// Serve uploaded images
	imagesDir := filepath.Join(s.dataDir, "images")
	s.router.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir(imagesDir))))

	// Serve frontend static files with SPA fallback
	frontendDir := os.Getenv("FRONTEND_DIR")
	if frontendDir == "" {
		frontendDir = "../frontend/dist"
	}
	if _, err := os.Stat(frontendDir); err == nil {
		s.router.HandleFunc("/", s.serveSPA(frontendDir))
	} else {
		log.Printf("Warning: Frontend directory %s not found", frontendDir)
	}
}

// serveSPA serves the single page application and handles client-side routing
func (s *Server) serveSPA(dir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Build the full path
		path := filepath.Join(dir, r.URL.Path)

		// Check if file exists
		if _, err := os.Stat(path); os.IsNotExist(err) {
			// File doesn't exist, serve index.html for client-side routing
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
			return
		}

		// File exists, serve it
		http.FileServer(http.Dir(dir)).ServeHTTP(w, r)
	}
}

func (s *Server) Start() error {
	handler := corsMiddleware(s.router)
	handler = loggingMiddleware(handler)

	log.Printf("Server listening on :%s", s.port)
	return http.ListenAndServe(":"+s.port, handler)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		if err, ok := data.(error); ok {
			fmt.Fprintf(w, `{"error":"%s"}`, err.Error())
		} else {
			fmt.Fprintf(w, "%v", data)
		}
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	fmt.Fprintf(w, `{"error":"%s"}`, message)
}
