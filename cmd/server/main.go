package main

import (
	"log"
	"net/http"
	"os"
	"swalang-api-dualmode/internal/api"
	"time"
	"io/ioutil"
	"path/filepath"

	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()

	// API routes
	apiRouter := r.PathPrefix("/api").Subrouter()
	apiRouter.HandleFunc("/session/new", api.NewSessionHandler).Methods("POST")
	apiRouter.HandleFunc("/session/{id}/files", api.UploadFileHandler).Methods("POST")
	apiRouter.HandleFunc("/session/{id}/run", api.RunHandler).Methods("POST")
	apiRouter.HandleFunc("/session/{id}/logs", api.LogsHandler).Methods("GET")
	apiRouter.HandleFunc("/session/{id}/ws", api.HandleWS)

	// Server configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Handler:      r,
		Addr:         ":" + port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	// Start the cleanup worker
	go startCleanupWorker()

	log.Printf("Server starting on port %s", port)
	log.Fatal(srv.ListenAndServe())
}

func startCleanupWorker() {
	sessionDir := os.Getenv("SESSION_DIR")
	if sessionDir == "" {
		sessionDir = "/tmp/swalang_sessions"
	}

	cleanupInterval := 5 * time.Minute // Clean up every 5 minutes
	sessionTTL := 15 * time.Minute      // Sessions older than 15 minutes are removed

	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	for {
		<-ticker.C
		log.Println("Running session cleanup...")
		cleanupOldSessions(sessionDir, sessionTTL)
	}
}

func cleanupOldSessions(dir string, ttl time.Duration) {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		log.Printf("Error reading session directory for cleanup: %v", err)
		return
	}

	for _, file := range files {
		if file.IsDir() {
			sessionPath := filepath.Join(dir, file.Name())
			if time.Since(file.ModTime()) > ttl {
				log.Printf("Removing old session: %s", sessionPath)
				os.RemoveAll(sessionPath)
			}
		}
	}
}
