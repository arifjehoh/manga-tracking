package main

import (
	"fmt"
	"log"
	"os"
)

func main() {
	port := getEnv("PORT", "8080")
	dataDir := getEnv("DATA_DIR", "../data")

	fmt.Printf("Starting Manga Tracker server on port %s\n", port)
	fmt.Printf("Data directory: %s\n", dataDir)

	// TODO: Initialize database, HTTP server, and routes
	log.Fatal("Server not yet implemented")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
