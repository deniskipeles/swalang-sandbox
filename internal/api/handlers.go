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
	"swalang-api-dualmode/internal/storage"
	"time"

	"github.com/gorilla/mux"
)

var sessionBaseDir = os.Getenv("SESSION_DIR")

func init() {
	if sessionBaseDir == "" {
		sessionBaseDir = "/tmp/swalang_sessions"
	}
}

// NewSessionHandler creates a new session and its corresponding sandbox directory.
func NewSessionHandler(w http.ResponseWriter, r *http.Request) {
	sandboxPath, err := runner.CreateSandbox(sessionBaseDir)
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	sessionID := filepath.Base(sandboxPath)

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

// UploadFileHandler handles file uploads to a specific session's sandbox.
func UploadFileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]

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

	sessionDir := filepath.Join(sessionBaseDir, sessionID)
	fullPath := filepath.Join(sessionDir, cleanPath)

	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		http.Error(w, "Failed to create directories for file", http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// RunHandler executes the Swalang code in a session and returns the output.
func RunHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	sessionDir := filepath.Join(sessionBaseDir, sessionID)

	binPath := os.Getenv("SWALANG_PATH")
	if binPath == "" {
		binPath = "swalang" // Default path
	}

	maxExecutionTimeStr := os.Getenv("MAX_EXECUTION_TIME")
	maxExecutionTime, err := time.ParseDuration(maxExecutionTimeStr)
	if err != nil {
		maxExecutionTime = 15 * time.Second // Default timeout
	}

	ctx, cancel := context.WithTimeout(r.Context(), maxExecutionTime)
	defer cancel()

	result, err := runner.RunSwalang(ctx, binPath, sessionDir, "main.sw")
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			http.Error(w, "Execution timed out", http.StatusRequestTimeout)
			return
		}
		http.Error(w, "Failed to execute code", http.StatusInternalServerError)
		return
	}

	// Save the log
	storage.SaveLog(sessionID, result.Stdout, result.Stderr)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// LogsHandler retrieves the logs for a given session.
func LogsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]

	logContent, err := storage.GetLog(sessionID)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Logs not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to retrieve logs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write(logContent)
}
