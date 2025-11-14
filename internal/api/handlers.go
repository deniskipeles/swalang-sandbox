package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"swalang-api-dualmode/internal/runner"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/gorilla/mux"
)

var rdb *redis.Client

func SetRedisClient(client *redis.Client) {
	rdb = client
}

// NewSessionHandler creates a new session in Redis.
func NewSessionHandler(w http.ResponseWriter, r *http.Request) {
	sessionID := uuid.New().String()
	ctx := context.Background()

	// Store session data in a Redis hash
	_, err := rdb.HSet(ctx, "session:"+sessionID, "status", "created").Result()
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// Set a TTL for the session key
	_, err = rdb.Expire(ctx, "session:"+sessionID, 15*time.Minute).Result()
	if err != nil {
		http.Error(w, "Failed to set session expiry", http.StatusInternalServerError)
		return
	}

	wsScheme := "ws"
	if r.TLS != nil {
		wsScheme = "wss"
	}
	wsURL := fmt.Sprintf("%s://%s/api/session/%s/ws", wsScheme, r.Host, sessionID)

	response := map[string]string{
		"session_id": sessionID,
		"ws_url":     wsURL,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UploadFileHandler handles file uploads to a specific session in Redis.
func UploadFileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	ctx := context.Background()

	var req struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Prevent path traversal attacks
	cleanPath := filepath.Clean(req.Path)
	if strings.HasPrefix(cleanPath, "..") {
		http.Error(w, "Invalid file path", http.StatusBadRequest)
		return
	}

	// Store the file content in the session's hash
	_, err := rdb.HSet(ctx, "session:"+sessionID, "file:"+cleanPath, req.Content).Result()
	if err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// RunHandler executes the Swalang code from a session in Redis and returns the output.
func RunHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	ctx := context.Background()

	// Retrieve the code from Redis
	code, err := rdb.HGet(ctx, "session:"+sessionID, "file:main.sw").Result()
	if err != nil {
		http.Error(w, "Failed to retrieve code from session", http.StatusInternalServerError)
		return
	}

	// Create a temporary directory for execution
	tempDir, err := os.MkdirTemp("", "swalang-exec-*")
	if err != nil {
		http.Error(w, "Failed to create execution directory", http.StatusInternalServerError)
		return
	}
	defer os.RemoveAll(tempDir)

	// Write the code to a temporary file
	entrypointPath := filepath.Join(tempDir, "main.sw")
	if err := os.WriteFile(entrypointPath, []byte(code), 0644); err != nil {
		http.Error(w, "Failed to write code to file", http.StatusInternalServerError)
		return
	}

	binPath := os.Getenv("SWALANG_PATH") 
	if binPath == "" {
		binPath = "/usr/local/bin/swalang" // Default path
	}

	maxExecutionTimeStr := os.Getenv("MAX_EXECUTION_TIME")
	maxExecutionTime, err := time.ParseDuration(maxExecutionTimeStr)
	if err != nil {
		maxExecutionTime = 15 * time.Second // Default timeout
	}

	ctx, cancel := context.WithTimeout(r.Context(), maxExecutionTime)
	defer cancel()

	result, err := runner.RunSwalang(ctx, binPath, tempDir, "main.sw")
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			http.Error(w, "Execution timed out", http.StatusRequestTimeout)
			return
		}
		http.Error(w, "Failed to execute code", http.StatusInternalServerError)
		return
	}

	// Save the log to Redis
	logKey := "logs:" + sessionID
	logValue := "Stdout:\n" + result.Stdout + "\nStderr:\n" + result.Stderr
	_, err = rdb.Set(ctx, logKey, logValue, 15*time.Minute).Result()
	if err != nil {
		http.Error(w, "Failed to save logs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// LogsHandler retrieves the logs for a given session from Redis.
func LogsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	ctx := context.Background()

	logContent, err := rdb.Get(ctx, "logs:"+sessionID).Result()
	if err != nil {
		if err == redis.Nil {
			http.Error(w, "Logs not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to retrieve logs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(logContent))
}
