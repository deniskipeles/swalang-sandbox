package main

import (
	"bufio"
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"

	gocqlastra "github.com/datastax/gocql-astra"
	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

/* ---------- Project domain types ---------- */

type FileSystemNode struct {
	ID       string           `json:"id"`
	Name     string           `json:"name"`
	Type     string           `json:"type"`
	Content  string           `json:"content,omitempty"`
	Children []FileSystemNode `json:"children,omitempty"`
	IsFolder bool             `json:"isFolder,omitempty"`
}

type IndexJob struct {
	JobID     string    `json:"jobId"`
	ProjectID string    `json:"projectId"`
	Status    string    `json:"status"`
	Progress  int       `json:"progress"`
	Total     int       `json:"total"`
	StartedAt time.Time `json:"startedAt"`
}

type SimilarityQuery struct {
	ProjectID string `json:"projectId"`
	FilePath  string `json:"filePath,omitempty"`
	Text      string `json:"text,omitempty"`
	Limit     int    `json:"limit,omitempty"`
}

type SimilarResult struct {
	Path       string  `json:"path"`
	Name       string  `json:"name"`
	Similarity float32 `json:"similarity"`
}

/* ---------- Playground Session Types ---------- */

// PlaygroundSession holds the data for a temporary, in-memory session.
type PlaygroundSession struct {
	Files     *sync.Map // Key: path (string), Value: content (string)
	Logs      string
	CreatedAt time.Time
}

/* ---------- Globals ---------- */

var (
	// In-memory store for playground sessions
	playgroundSessions = &sync.Map{}

	// Astra DB for persistent projects
	session *gocql.Session

	// WebSockets
	upgrader     = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	projectConns = sync.Map{} // projectID -> map[connID]*websocket.Conn
	indexJobs    = sync.Map{} // jobID -> *IndexJob

	// Embedding
	embedder Embedder
)

/* ---------- Embedder ---------- */

type Embedder interface {
	Embed(text string) ([]float32, error)
}

type MockEmbedder struct{}

func (m *MockEmbedder) Embed(text string) ([]float32, error) {
	h := md5.Sum([]byte(text))
	vec := make([]float32, 384)
	for i := range vec {
		vec[i] = float32(h[i%16]) / 255.0
	}
	return vec, nil
}

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

/* ---------- Astra DB Connection ---------- */

func connectAstra() {
	bundle := os.Getenv("ASTRA_BUNDLE")
	token := os.Getenv("ASTRA_TOKEN")

	if token == "" || bundle == "" {
		log.Println("⚠️  ASTRA_TOKEN or ASTRA_BUNDLE not set. Project features disabled.")
		return
	}

	cluster, err := gocqlastra.NewClusterFromBundle(bundle, "token", token, 10*time.Second)
	if err != nil {
		log.Fatalf("Failed to create Astra cluster: %v", err)
	}
	cluster.Keyspace = "codeks"
	cluster.NumConns = 4
	cluster.ProtoVersion = 4

	session, err = gocql.NewSession(*cluster)
	if err != nil {
		log.Fatalf("Failed to connect to Astra: %v", err)
	}
	log.Println("✅ Connected to Astra DB")
}

/* ---------- Playground Session Cleanup ---------- */

// startSessionCleanup periodically removes old in-memory sessions.
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

/* ---------- Main ---------- */

func main() {
	// Start the in-memory session garbage collector
	startSessionCleanup(5*time.Minute, 15*time.Minute)

	// Setup Astra (optional — if env vars missing, skip)
	connectAstra()
	defer func() {
		if session != nil {
			session.Close()
		}
	}()

	// Embedder
	embedder = &MockEmbedder{}

	// Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(corsMiddleware())

	r.GET("/", func(c *gin.Context) {
		c.File("static/index.html")
	})

	// ======== PLAYGROUND SESSION API (In-Memory) ========
	sessionAPI := r.Group("/api")
	{
		sessionAPI.POST("/session/new", newPlaygroundSessionHandler)
		sessionAPI.POST("/session/:id/files", uploadPlaygroundFileHandler)
		sessionAPI.GET("/session/:id/ws", wsPlaygroundHandler)
		// Deprecated REST endpoints, kept for compatibility if needed.
		sessionAPI.POST("/session/:id/run", runPlaygroundHandler)
		sessionAPI.GET("/session/:id/logs", logsPlaygroundHandler)
	}

	// ======== PERSISTENT PROJECT API (Astra DB) ========
	if session != nil {
		projectAPI := r.Group("/api")
		{
			projectAPI.GET("/projects/:id", getProject)
			projectAPI.GET("/projects/:id/size", getSize)
			projectAPI.GET("/projects/:id/files/*path", getFile)
			projectAPI.POST("/projects/:id", postProject)
			projectAPI.POST("/projects/:id/index", postIndex)
			projectAPI.GET("/index/:jobId", getIndexStatus)
			projectAPI.POST("/search/similar", postSearchSimilar)
		}
		r.GET("/ws/:projectId", handleWS)
	}

	r.GET("/health", health)
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	log.Printf("🚀 Server starting on port %s", port)
	log.Println("✨ Playground features (In-Memory) enabled")
	if session != nil {
		log.Println("✨ Persistent Project features (Astra DB) enabled")
	} else {
		log.Println("⚠️  Persistent Project features disabled (missing ASTRA_BUNDLE or ASTRA_TOKEN)")
	}
	log.Fatal(srv.ListenAndServe())
}

/* ============ PLAYGROUND API HANDLERS (In-Memory) ============ */

func newPlaygroundSessionHandler(c *gin.Context) {
	sessionID := uuid.New().String()
	newSession := &PlaygroundSession{
		Files:     &sync.Map{},
		CreatedAt: time.Now(),
	}
	playgroundSessions.Store(sessionID, newSession)

	wsScheme := "ws"
	if c.Request.TLS != nil {
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

	cleanPath := filepath.Clean(req.Path)
	if strings.HasPrefix(cleanPath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
		return
	}

	session, ok := playgroundSessions.Load(sessionID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	session.(*PlaygroundSession).Files.Store(cleanPath, req.Content)
	c.Status(http.StatusCreated)
}

func wsPlaygroundHandler(c *gin.Context) {
	sessionID := c.Param("id")
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
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
	sessionVal, ok := playgroundSessions.Load(sessionID)
	if !ok {
		sendJSONError(conn, "session not found", fmt.Errorf("invalid session id %s", sessionID))
		return
	}
	session := sessionVal.(*PlaygroundSession)

	codeVal, ok := session.Files.Load("main.sw")
	if !ok {
		sendJSONError(conn, "file 'main.sw' not found in session", nil)
		return
	}
	code := codeVal.(string)

	tempDir, err := os.MkdirTemp("", "swalang-exec-*")
	if err != nil {
		sendJSONError(conn, "failed to create execution directory", err)
		return
	}
	defer os.RemoveAll(tempDir)

	entrypointPath := filepath.Join(tempDir, "main.sw")
	if err := os.WriteFile(entrypointPath, []byte(code), 0644); err != nil {
		sendJSONError(conn, "failed to write code to file", err)
		return
	}

	binPath := os.Getenv("SWALANG_PATH")
	if binPath == "" {
		binPath = "/usr/local/bin/swalang" // Default path
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, binPath, "main.sw")
	cmd.Dir = tempDir

	stdoutPipe, _ := cmd.StdoutPipe()
	stderrPipe, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		sendJSONError(conn, "failed to start execution", err)
		return
	}

	go streamPipe(conn, stdoutPipe, "stdout")
	go streamPipe(conn, stderrPipe, "stderr")

	cmd.Wait()
}

func streamPipe(conn *websocket.Conn, pipe io.ReadCloser, streamType string) {
	scanner := bufio.NewScanner(pipe)
	for scanner.Scan() {
		message := map[string]string{"type": streamType, "content": scanner.Text()}
		if err := conn.WriteJSON(message); err != nil {
			log.Printf("Failed to write to WebSocket: %v", err)
			break
		}
	}
}

func sendJSONError(conn *websocket.Conn, message string, err error) {
	errMsg := message
	if err != nil {
		errMsg = message + ": " + err.Error()
		log.Printf("%s: %v", message, err)
	}
	errorMsg := map[string]string{"type": "error", "content": errMsg}
	conn.WriteJSON(errorMsg)
}

// runPlaygroundHandler is a deprecated REST endpoint for running code.
func runPlaygroundHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Please use the WebSocket connection to run code."})
}

// logsPlaygroundHandler is a deprecated REST endpoint for fetching logs.
func logsPlaygroundHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Logs are streamed via the WebSocket connection."})
}

/* ============ PROJECT API HANDLERS (Astra DB) ============ */

func getProject(c *gin.Context) {
	projID := c.Param("id")
	size, err := projectSize(projID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}
	if size < 1*1024*1024 {
		tree := loadFat(projID)
		c.JSON(http.StatusOK, gin.H{"strategy": "fat", "size": size, "tree": tree})
		return
	}
	files := listFiles(projID)
	c.JSON(http.StatusOK, gin.H{"strategy": "split", "size": size, "fileCount": len(files), "files": files})
}

func getSize(c *gin.Context) {
	projID := c.Param("id")
	size, err := projectSize(projID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projectId": projID, "size": size})
}

func getFile(c *gin.Context) {
	projID := c.Param("id")
	filePath := c.Param("path")[1:]
	node := getSplitFile(projID, filePath)
	if node.Name == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}
	c.Data(http.StatusOK, "text/plain", []byte(node.Content))
}

func postProject(c *gin.Context) {
	projID := c.Param("id")
	var req struct {
		Tree []FileSystemNode `json:"tree"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	version, size, err := saveHybrid(projID, req.Tree)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	broadcast(projID, map[string]interface{}{"type": "update", "version": version, "size": size, "at": time.Now().Unix()})
	c.JSON(http.StatusCreated, gin.H{"projectId": projID, "version": version, "size": size})
}

func postIndex(c *gin.Context) {
	projID := c.Param("id")
	jobID := uuid.New().String()
	job := &IndexJob{
		JobID:     jobID,
		ProjectID: projID,
		Status:    "pending",
		StartedAt: time.Now(),
	}
	indexJobs.Store(jobID, job)
	go runIndex(jobID, projID)
	c.JSON(http.StatusAccepted, gin.H{"jobId": jobID, "status": job.Status, "message": "indexing started"})
}

func getIndexStatus(c *gin.Context) {
	jobID := c.Param("jobId")
	job, ok := indexJobs.Load(jobID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	c.JSON(http.StatusOK, job)
}

func postSearchSimilar(c *gin.Context) {
	var q SimilarityQuery
	if err := c.ShouldBindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if q.Limit <= 0 {
		q.Limit = 10
	}
	var queryVec []float32
	var err error
	if q.FilePath != "" {
		queryVec, err = getEmbedding(q.ProjectID, q.FilePath)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "source file not indexed"})
			return
		}
	} else if q.Text != "" {
		queryVec, err = embedder.Embed(q.Text)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "supply filePath or text"})
		return
	}
	results, err := searchSimilar(q.ProjectID, queryVec, q.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"results": results})
}

func handleWS(c *gin.Context) {
	projID := c.Param("projectId")
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("ws upgrade: %v", err)
		return
	}
	defer conn.Close()
	conns, _ := projectConns.LoadOrStore(projID, &sync.Map{})
	connID := uuid.New().String()
	conns.(*sync.Map).Store(connID, conn)
	defer conns.(*sync.Map).Delete(connID)
	conn.WriteJSON(map[string]interface{}{"type": "hello", "projectId": projID, "connId": connID[:8]})
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func broadcast(projectID string, msg interface{}) {
	if conns, ok := projectConns.Load(projectID); ok {
		conns.(*sync.Map).Range(func(key, value interface{}) bool {
			conn := value.(*websocket.Conn)
			if err := conn.WriteJSON(msg); err != nil {
				conns.(*sync.Map).Delete(key)
			}
			return true
		})
	}
}

func health(c *gin.Context) {
	status := gin.H{"status": "ok", "ts": time.Now().Unix()}
	if session != nil {
		status["astra"] = "connected"
	} else {
		status["astra"] = "disconnected"
	}
	status["playground"] = "in-memory"
	c.JSON(http.StatusOK, status)
}

/* ============ Astra Data Helpers ============ */

func projectSize(projectID string) (int, error) {
	var size int
	err := session.Query(`SELECT size FROM project_snapshots WHERE project_id=? LIMIT 1`, projectID).Scan(&size)
	return size, err
}

func loadFat(projectID string) []FileSystemNode {
	var raw string
	err := session.Query(`SELECT snapshot FROM project_snapshots WHERE project_id = ? ORDER BY version DESC LIMIT 1`, projectID).
		Consistency(gocql.One).
		Scan(&raw)
	if err != nil {
		return nil
	}
	var tree []FileSystemNode
	json.Unmarshal([]byte(raw), &tree)
	return tree
}

func listFiles(projectID string) []FileSystemNode {
	iter := session.Query(`SELECT path,name,is_folder,updated_at FROM project_files WHERE project_id=?`).Iter()
	var nodes []FileSystemNode
	var p, name string
	var folder bool
	var t time.Time
	for iter.Scan(&p, &name, &folder, &t) {
		nodes = append(nodes, FileSystemNode{Name: name, Type: map[bool]string{true: "folder", false: "file"}[folder], IsFolder: folder})
	}
	iter.Close()
	return nodes
}

func getSplitFile(projectID, filePath string) FileSystemNode {
	var f FileSystemNode
	session.Query(`SELECT name,is_folder,content FROM project_files WHERE project_id=? AND path=?`, projectID, filePath).Scan(&f.Name, &f.IsFolder, &f.Content)
	f.Type = map[bool]string{true: "folder", false: "file"}[f.IsFolder]
	return f
}

func saveHybrid(projectID string, tree []FileSystemNode) (version string, size int, err error) {
	raw, _ := json.Marshal(tree)
	ver := gocql.TimeUUID()
	size = len(raw)
	now := time.Now()
	batch := session.NewBatch(gocql.LoggedBatch)
	batch.Query(`INSERT INTO project_snapshots (project_id,version,snapshot,size,updated_at) VALUES (?,?,?,?,?)`, projectID, ver, string(raw), size, now)
	insertSplitBatch(projectID, tree, "", batch, now)
	if err = session.ExecuteBatch(batch); err != nil {
		return "", 0, err
	}
	return ver.String(), size, nil
}

func insertSplitBatch(projectID string, nodes []FileSystemNode, prefix string, batch *gocql.Batch, now time.Time) {
	for _, n := range nodes {
		p := path.Join(prefix, n.Name)
		batch.Query(`INSERT INTO project_files (project_id,path,name,is_folder,content,checksum,updated_at) VALUES (?,?,?,?,?,?,?)`, projectID, p, n.Name, n.Type == "folder", n.Content, checksum(n.Content), now)
		if n.Type == "folder" {
			insertSplitBatch(projectID, n.Children, p, batch, now)
		}
	}
}

func runIndex(jobID, projectID string) {
	job, _ := indexJobs.Load(jobID)
	job.(*IndexJob).Status = "running"

	iter := session.Query(`SELECT path,content FROM project_files WHERE project_id=?`, projectID).Iter()
	type task struct{ path, content string }
	tasks := make(chan task, 100)
	go func() {
		var p, content string
		for iter.Scan(&p, &content) {
			if content != "" {
				tasks <- task{path: p, content: content}
			}
		}
		close(tasks)
	}()

	const workers = 8
	var wg sync.WaitGroup
	var mu sync.Mutex
	done := 0
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for t := range tasks {
				vec, err := embedder.Embed(t.content)
				if err != nil {
					continue
				}
				session.Query(`UPDATE project_files SET embedding=? WHERE project_id=? AND path=?`, vec, projectID, t.path).Exec()
				mu.Lock()
				done++
				job.(*IndexJob).Progress = done
				mu.Unlock()
			}
		}()
	}
	wg.Wait()
	iter.Close()
	mu.Lock()
	job.(*IndexJob).Status = "done"
	job.(*IndexJob).Total = done
	mu.Unlock()
}

func getEmbedding(projectID, filePath string) ([]float32, error) {
	var vec []float32
	err := session.Query(`SELECT embedding FROM project_files WHERE project_id=? AND path=?`, projectID, filePath).Scan(&vec)
	if err != nil || vec == nil {
		return nil, fmt.Errorf("not indexed")
	}
	return vec, nil
}

func searchSimilar(projectID string, queryVec []float32, limit int) ([]SimilarResult, error) {
	iter := session.Query(`SELECT path,name, similarity_cosine(embedding,?) AS sim FROM project_files WHERE project_id=? AND embedding IS NOT NULL ORDER BY embedding ANN OF ? LIMIT ?`, queryVec, projectID, queryVec, limit).Iter()
	var results []SimilarResult
	var p, name string
	var sim float32
	for iter.Scan(&p, &name, &sim) {
		results = append(results, SimilarResult{Path: p, Name: name, Similarity: sim})
	}
	if err := iter.Close(); err != nil {
		return nil, err
	}
	return results, nil
}

func checksum(s string) string {
	return fmt.Sprintf("%x", md5.Sum([]byte(s)))
}