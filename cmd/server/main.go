// =========================== swalang-sandbox/cmd/server/main.go ===========================
package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"swalang-api-dualmode/internal/api"
	"time"

	"github.com/gorilla/handlers" // <-- Import the handlers package
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
	
	// === CORS Configuration ===
	// Define the allowed origins. You should make this more restrictive in production.
	allowedOrigins := handlers.AllowedOrigins([]string{"https://swalang-sandbox.vercel.app", "http://localhost:3000"})
	allowedMethods := handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"})
	allowedHeaders := handlers.AllowedHeaders([]string{"Content-Type", "X-Requested-With"})

	// Wrap the router with the CORS middleware
	corsHandler := handlers.CORS(allowedOrigins, allowedMethods, allowedHeaders)(r)
	// === End CORS Configuration ===

	srv := &http.Server{
		// Use the corsHandler instead of the raw router 'r'
		Handler:      corsHandler,
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
