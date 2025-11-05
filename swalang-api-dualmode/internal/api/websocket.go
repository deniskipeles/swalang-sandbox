package api

import (
	"bufio"
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
		if allowedOrigins == "" {
			// Allow all origins if not set, for local development
			return true
		}

		origin := r.Header.Get("Origin")
		for _, allowed := range strings.Split(allowedOrigins, ",") {
			if origin == allowed {
				return true
			}
		}
		return false
	},
}

// HandleWS handles WebSocket connections for a given session.
func HandleWS(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	sessionDir := filepath.Join(sessionBaseDir, sessionID)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection for session %s: %v", sessionID, err)
		return
	}
	defer conn.Close()

	for {
		var msg map[string]string
		if err := conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket closed unexpectedly for session %s: %v", sessionID, err)
			}
			break
		}

		if action, ok := msg["action"]; ok && action == "run" {
			executeAndStream(conn, sessionDir)
		}
	}
}

func executeAndStream(conn *websocket.Conn, sessionDir string) {
	binPath := os.Getenv("SWALANG_PATH")
	if binPath == "" {
		binPath = "swalang" // Default path
	}
	entryFile := "main.sw"

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, binPath, entryFile)
	cmd.Dir = sessionDir

	stdoutPipe, _ := cmd.StdoutPipe()
	stderrPipe, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		sendJSONError(conn, "Failed to start execution", err)
		return
	}

	go streamPipe(conn, stdoutPipe, "stdout")
	go streamPipe(conn, stderrPipe, "stderr")

	if err := cmd.Wait(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			// The process exited with a non-zero status code, which is not necessarily an API error.
			// The stderr stream will have already sent the error message.
			log.Printf("Execution finished with non-zero status for %s: %s", sessionDir, exitErr)
		} else {
			// An actual error occurred while waiting for the command to finish.
			sendJSONError(conn, "Execution failed", err)
		}
	}
}

func streamPipe(conn *websocket.Conn, pipe io.ReadCloser, streamType string) {
	scanner := bufio.NewScanner(pipe)
	for scanner.Scan() {
		message := map[string]string{
			"type":    streamType,
			"content": scanner.Text(),
		}
		if err := conn.WriteJSON(message); err != nil {
			log.Printf("Failed to write to WebSocket: %v", err)
			break
		}
	}
}

func sendJSONError(conn *websocket.Conn, message string, err error) {
	log.Printf("%s: %v", message, err)
	errorMsg := map[string]string{
		"type":    "error",
		"content": message + ": " + err.Error(),
	}
	conn.WriteJSON(errorMsg)
}
