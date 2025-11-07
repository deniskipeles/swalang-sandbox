// =========================== swalang-sandbox/cmd/server/main.go ===========================
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"swalang-api-dualmode/internal/api"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/gorilla/handlers" // <-- Import the handlers package
	"github.com/gorilla/mux"
)

var rdb *redis.Client

func main() {
	// Initialize Redis client
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	rdb = redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	// Check Redis connection
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	log.Println("Connected to Redis successfully")

	// Pass the redis client to the api package
	api.SetRedisClient(rdb)

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
	allowedOrigins := handlers.AllowedOrigins([]string{"*"})
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

	log.Printf("Server starting on port %s", port)
	log.Fatal(srv.ListenAndServe())
}
