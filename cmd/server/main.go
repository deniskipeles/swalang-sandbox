package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

/* ---------- Playground Session Types ---------- */

type PlaygroundSession struct {
	Files     *sync.Map
	CreatedAt time.Time
}

// ActiveExecution manages the life-cycle and stdin pipeline of a running command
type ActiveExecution struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	mu     sync.Mutex
	active bool
}

func (ae *ActiveExecution) Write(data string) {
	ae.mu.Lock()
	defer ae.mu.Unlock()
	if ae.active && ae.stdin != nil {
		ae.stdin.Write([]byte(data))
	}
}

func (ae *ActiveExecution) Stop() {
	ae.mu.Lock()
	defer ae.mu.Unlock()
	if ae.active && ae.cmd != nil && ae.cmd.Process != nil {
		ae.cmd.Process.Kill()
	}
	ae.active = false
}

// SafeConn wraps a WebSocket connection with a mutex to ensure concurrent-safe writes.
type SafeConn struct {
	conn *websocket.Conn
	mu   sync.Mutex
}

func (s *SafeConn) WriteJSON(v interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.conn.WriteJSON(v)
}

/* ---------- Globals ---------- */

var (
	// In-memory store for active playground sessions
	playgroundSessions = &sync.Map{}

	// WebSocket upgrader
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

/* ---------- CORS Middleware ---------- */

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

/* ---------- Playground Session Cleanup ---------- */

func startSessionCleanup(interval time.Duration, maxAge time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			playgroundSessions.Range(func(key, value interface{}) bool {
				sessionID := key.(string)
				session := value.(*PlaygroundSession)
				if time.Since(session.CreatedAt) > maxAge {
					playgroundSessions.Delete(sessionID)
					log.Printf("Cleaned up expired playground session: %s", sessionID)
				}
				return true
			})
		}
	}()
}

/* ---------- Main Server Execution ---------- */

func main() {
	// Automatically clean up idle or expired sessions to manage memory
	startSessionCleanup(5*time.Minute, 15*time.Minute)

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(corsMiddleware())

	// Fallback to basic message if static HTML file is missing
	r.GET("/", func(c *gin.Context) {
		htmlPath := "static/index.html"
		if _, err := os.Stat(htmlPath); err == nil {
			c.File(htmlPath)
		} else {
			c.Data(http.StatusOK, "text/html; charset=utf-8", []byte("<h1>Swalang Sandbox is running. Place your index.html in the static/ directory.</h1>"))
		}
	})

	// Playground API endpoints
	api := r.Group("/api")
	{
		api.POST("/session/new", newPlaygroundSessionHandler)
		api.POST("/session/:id/files", uploadPlaygroundFileHandler)
		api.GET("/session/:id/ws", wsPlaygroundHandler)
	}

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("Shutting down sandbox server...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		srv.Shutdown(ctx)
	}()

	log.Printf("🚀 Playground Sandbox Server listening on port %s", port)
	log.Fatal(srv.ListenAndServe())
}

/* ============ API HANDLERS ============ */

func newPlaygroundSessionHandler(c *gin.Context) {
	sessionID := uuid.New().String()
	playgroundSessions.Store(sessionID, &PlaygroundSession{
		Files:     &sync.Map{},
		CreatedAt: time.Now(),
	})

	wsScheme := "ws"
	if c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https" {
		wsScheme = "wss"
	}
	wsURL := fmt.Sprintf("%s://%s/api/session/%s/ws", wsScheme, c.Request.Host, sessionID)

	c.JSON(http.StatusOK, gin.H{
		"session_id": sessionID,
		"ws_url":     wsURL,
	})
}

func uploadPlaygroundFileHandler(c *gin.Context) {
	sessionID := c.Param("id")
	var req struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	sessionVal, ok := playgroundSessions.Load(sessionID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	// Store clean paths to avoid path traversal vulnerabilities
	cleanPath := filepath.Clean(req.Path)
	sessionVal.(*PlaygroundSession).Files.Store(cleanPath, req.Content)
	c.Status(http.StatusCreated)
}

func wsPlaygroundHandler(c *gin.Context) {
	sessionID := c.Param("id")
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	safeConn := &SafeConn{conn: conn}
	ae := &ActiveExecution{}
	defer ae.Stop() // Terminate active process on connection drop

	for {
		var msg map[string]string
		if err := conn.ReadJSON(&msg); err != nil {
			break
		}

		action := msg["action"]
		if action == "run" {
			ae.Stop() // Kill previous processes if still running

			ae.mu.Lock()
			ae.active = true
			ae.mu.Unlock()

			// Launch execution in the background to keep the WS reader loop free for stdin writes
			go executeAndStream(safeConn, sessionID, ae)
		} else if action == "input" {
			ae.Write(msg["data"])
		}
	}
}

// resolveBinaryPath checks if SWALANG_PATH points to a directory, 
// and appends the binary name to it if necessary.
func resolveBinaryPath() string {
	binaryName := "swalang"
	if os.PathSeparator == '\\' {
		binaryName = "swalang.exe"
	}

	defaultPath := "/usr/local/bin/" + binaryName
	envPath := os.Getenv("SWALANG_PATH")
	if envPath == "" {
		return defaultPath
	}

	info, err := os.Stat(envPath)
	if err != nil {
		// Fall back directly to envPath if Stat fails
		return envPath
	}

	if info.IsDir() {
		return filepath.Join(envPath, binaryName)
	}

	return envPath
}

func executeAndStream(sConn *SafeConn, sessionID string, ae *ActiveExecution) {
	sessionVal, ok := playgroundSessions.Load(sessionID)
	if !ok {
		sendJSONError(sConn, "Session not found", nil)
		return
	}

	sessionData := sessionVal.(*PlaygroundSession)

	// Create temporary sandbox directory
	tempDir, err := os.MkdirTemp("", "swalang-exec-*")
	if err != nil {
		sendJSONError(sConn, "Failed to create execution sandbox", err)
		return
	}
	defer os.RemoveAll(tempDir)

	var hasEntry bool = false
	var writeErr error

	// Write in-memory files to temp directory
	sessionData.Files.Range(func(key, value interface{}) bool {
		relPath, ok := key.(string)
		if !ok {
			return true
		}
		content, ok := value.(string)
		if !ok {
			return true
		}

		cleanPath := filepath.Clean(relPath)
		if strings.Contains(cleanPath, "..") || strings.HasPrefix(cleanPath, "/") || strings.HasPrefix(cleanPath, "\\") {
			log.Printf("Skipping unsafe file path traversal: %s", relPath)
			return true
		}

		fullPath := filepath.Join(tempDir, cleanPath)
		dir := filepath.Dir(fullPath)

		if err := os.MkdirAll(dir, 0755); err != nil {
			writeErr = fmt.Errorf("failed to build directory %s: %w", dir, err)
			return false
		}

		if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
			writeErr = fmt.Errorf("failed to write payload to %s: %w", fullPath, err)
			return false
		}

		if cleanPath == "main.sw" {
			hasEntry = true
		}

		return true
	})

	if writeErr != nil {
		sendJSONError(sConn, "Failed to prepare local environment files", writeErr)
		ae.Stop()
		return
	}

	if !hasEntry {
		sendJSONError(sConn, "File 'main.sw' not found in workspace", nil)
		ae.Stop()
		return
	}

	// 1-minute execution context timeout to prevent hanging on unanswered inputs
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Minute)
	defer cancel()

	swalangBinary := resolveBinaryPath()

	cmd := exec.CommandContext(ctx, swalangBinary, "main.sw")
	cmd.Dir = tempDir

	stdinPipe, err := cmd.StdinPipe()
	if err != nil {
		sendJSONError(sConn, "Failed to initialize standard input channel", err)
		ae.Stop()
		return
	}

	stdoutPipe, _ := cmd.StdoutPipe()
	stderrPipe, _ := cmd.StderrPipe()

	// Update our active execution context with current running process pointers
	ae.mu.Lock()
	ae.cmd = cmd
	ae.stdin = stdinPipe
	ae.mu.Unlock()

	if err := cmd.Start(); err != nil {
		sendJSONError(sConn, "Failed to initialize Swalang runtime execution", err)
		ae.Stop()
		return
	}

	// Notify frontend that the process has launched (enables interactive input console)
	sConn.WriteJSON(map[string]string{"type": "status", "content": "running"})

	// Use WaitGroup to ensure all stream writes finish before terminating
	var streamWg sync.WaitGroup
	streamWg.Add(2)

	go streamPipe(sConn, stdoutPipe, "stdout", &streamWg)
	go streamPipe(sConn, stderrPipe, "stderr", &streamWg)

	cmd.Wait()
	streamWg.Wait()

	ae.Stop()

	// Notify frontend that the process has terminated (disables interactive input console)
	sConn.WriteJSON(map[string]string{"type": "status", "content": "stopped"})
}

func streamPipe(sConn *SafeConn, pipe io.ReadCloser, streamType string, wg *sync.WaitGroup) {
	defer wg.Done()
	buffer := make([]byte, 1024)
	for {
		n, err := pipe.Read(buffer)
		if n > 0 {
			sConn.WriteJSON(map[string]string{
				"type":    streamType,
				"content": string(buffer[:n]),
			})
		}
		if err != nil {
			break
		}
	}
}

func sendJSONError(sConn *SafeConn, message string, err error) {
	errMsg := message
	if err != nil {
		errMsg = message + ": " + err.Error()
	}
	sConn.WriteJSON(map[string]string{
		"type":    "error",
		"content": errMsg,
	})
}