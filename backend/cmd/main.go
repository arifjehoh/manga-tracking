package main

import (
	"fmt"
	"log"
	"os"

	"github.com/arif/manga-tracker/internal/api"
	"github.com/arif/manga-tracker/internal/database"
	"github.com/arif/manga-tracker/internal/manga"
)

func main() {
	port := getEnv("PORT", "8080")
	dataDir := getEnv("DATA_DIR", "../data")

	fmt.Printf("Starting Manga Tracker server on port %s\n", port)
	fmt.Printf("Data directory: %s\n", dataDir)

	// Initialize database
	db, err := database.Initialize(dataDir)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	// Create repository
	repo := manga.NewRepository(db)

	// Create and start HTTP server
	server := api.NewServer(repo, dataDir, port)
	if err := server.Start(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
