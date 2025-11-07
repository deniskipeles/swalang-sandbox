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
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity
	},
}

// HandleWS handles WebSocket connections for a given session.
func HandleWS(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]

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
			executeAndStream(conn, sessionID)
		}
	}
}

func executeAndStream(conn *websocket.Conn, sessionID string) {
	ctx := context.Background()

	// Retrieve the code from Redis
	code, err := rdb.HGet(ctx, "session:"+sessionID, "file:main.sw").Result()
	if err != nil {
		sendJSONError(conn, "Failed to retrieve code from session", err)
		return
	}

	// Create a temporary directory for execution
	tempDir, err := os.MkdirTemp("", "swalang-exec-*")
	if err != nil {
		sendJSONError(conn, "Failed to create execution directory", err)
		return
	}
	defer os.RemoveAll(tempDir)

	// Write the code to a temporary file
	entrypointPath := filepath.Join(tempDir, "main.sw")
	if err := os.WriteFile(entrypointPath, []byte(code), 0644); err != nil {
		sendJSONError(conn, "Failed to write code to file", err)
		return
	}

	binPath := os.Getenv("SWALANG_PATH")
	if binPath == "" {
		binPath = "swalang" // Default path
	}
	entryFile := "main.sw"

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, binPath, entryFile)
	cmd.Dir = tempDir

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
			log.Printf("Execution finished with non-zero status for %s: %s", sessionID, exitErr)
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
