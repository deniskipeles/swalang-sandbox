// =========================== /teamspace/studios/this_studio/next-projects/swalang-sandbox/cmd/server/main.go ===========================
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

type PlaygroundSession struct {
	Files     *sync.Map
	Logs      string
	CreatedAt time.Time
}

/* ---------- Snapshot Cache ---------- */
type SnapshotCacheItem struct {
	Tree     []FileSystemNode
	CachedAt time.Time
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

	// Global cache for project snapshots
	snapshotCache = &sync.Map{} // key (projectID@version) -> *SnapshotCacheItem
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
	startSessionCleanup(5*time.Minute, 15*time.Minute)
	connectAstra()
	defer func() {
		if session != nil {
			session.Close()
		}
	}()

	embedder = &MockEmbedder{}

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(corsMiddleware())

	r.GET("/", func(c *gin.Context) { c.File("static/index.html") })

	sessionAPI := r.Group("/api")
	{
		sessionAPI.POST("/session/new", newPlaygroundSessionHandler)
		sessionAPI.POST("/session/:id/files", uploadPlaygroundFileHandler)
		sessionAPI.GET("/session/:id/ws", wsPlaygroundHandler)
		sessionAPI.POST("/session/:id/run", runPlaygroundHandler)
		sessionAPI.GET("/session/:id/logs", logsPlaygroundHandler)
	}

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

	r.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{Addr: ":" + port, Handler: r}
	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		srv.Shutdown(ctx)
	}()

	log.Printf("🚀 Server starting on port %s", port)
	if session != nil {
		log.Println("✨ Persistent Project features (Astra DB) enabled")
	}
	log.Fatal(srv.ListenAndServe())
}

/* ============ PLAYGROUND API HANDLERS (In-Memory) ============ */

func newPlaygroundSessionHandler(c *gin.Context) {
	sessionID := uuid.New().String()
	playgroundSessions.Store(sessionID, &PlaygroundSession{Files: &sync.Map{}, CreatedAt: time.Now()})
	wsScheme := "ws"
	if c.Request.TLS != nil {
		wsScheme = "wss"
	}
	wsURL := fmt.Sprintf("%s://%s/api/session/%s/ws", wsScheme, c.Request.Host, sessionID)
	c.JSON(http.StatusOK, gin.H{"session_id": sessionID, "ws_url": wsURL})
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
	session, ok := playgroundSessions.Load(sessionID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	session.(*PlaygroundSession).Files.Store(filepath.Clean(req.Path), req.Content)
	c.Status(http.StatusCreated)
}

func wsPlaygroundHandler(c *gin.Context) {
	sessionID := c.Param("id")
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()
	for {
		var msg map[string]string
		if err := conn.ReadJSON(&msg); err != nil {
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
		sendJSONError(conn, "session not found", nil)
		return
	}

	// Access the session data
	sessionData := sessionVal.(*PlaygroundSession)

	// Create a temporary directory for execution
	tempDir, err := os.MkdirTemp("", "swalang-exec-*")
	if err != nil {
		sendJSONError(conn, "failed to create execution directory", err)
		return
	}
	defer os.RemoveAll(tempDir)

	var hasEntry bool = false
	var writeErr error

	// Iterate over all files in the session and write them to disk
	sessionData.Files.Range(func(key, value interface{}) bool {
		relPath, ok := key.(string)
		if !ok {
			return true
		}
		content, ok := value.(string)
		if !ok {
			return true
		}

		// Clean the path and ensure it doesn't traverse directories dangerously
		cleanPath := filepath.Clean(relPath)
		if strings.Contains(cleanPath, "..") || strings.HasPrefix(cleanPath, "/") || strings.HasPrefix(cleanPath, "\\") {
			log.Printf("Skipping potentially unsafe file path: %s", relPath)
			return true
		}

		fullPath := filepath.Join(tempDir, cleanPath)
		dir := filepath.Dir(fullPath)

		// Create subdirectories if needed
		if err := os.MkdirAll(dir, 0755); err != nil {
			writeErr = fmt.Errorf("failed to create directory %s: %w", dir, err)
			return false // Stop iteration on error
		}

		// Write the file content
		if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
			writeErr = fmt.Errorf("failed to write file %s: %w", fullPath, err)
			return false // Stop iteration on error
		}

		// Check if this is the entry point
		if cleanPath == "main.sw" {
			hasEntry = true
		}

		return true
	})

	if writeErr != nil {
		sendJSONError(conn, "failed to prepare project files", writeErr)
		return
	}

	if !hasEntry {
		sendJSONError(conn, "file 'main.sw' not found in uploaded files", nil)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var swalang_binary = "/usr/local/bin/swalang"
	if os.Getenv("SWALANG_PATH") != "" {
		swalang_binary = os.Getenv("SWALANG_PATH")
	}

	// Run swalang with main.sw as the entry point, inside the tempDir
	cmd := exec.CommandContext(ctx, swalang_binary, "main.sw")
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
		conn.WriteJSON(map[string]string{"type": streamType, "content": scanner.Text()})
	}
}

func sendJSONError(conn *websocket.Conn, message string, err error) {
	errMsg := message
	if err != nil {
		errMsg = message + ": " + err.Error()
	}
	conn.WriteJSON(map[string]string{"type": "error", "content": errMsg})
}

func runPlaygroundHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Please use WebSocket"})
}

func logsPlaygroundHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Please use WebSocket"})
}

/* ============ PROJECT API HANDLERS (Astra DB) ============ */

func getProject(c *gin.Context) {
	projID := c.Param("id")
	versionStr := c.Query("version")

	if versionStr != "" {
		versionUUID, err := gocql.ParseUUID(versionStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid version UUID format"})
			return
		}
		tree := loadFatWithCache(projID, &versionUUID)
		if tree == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "project or version not found"})
			return
		}
		raw, _ := json.Marshal(tree)
		size := len(raw)
		if size < 1*1024*1024 {
			c.JSON(http.StatusOK, gin.H{"strategy": "fat", "size": size, "tree": tree, "version": versionUUID.String()})
		} else {
			files := flattenTree(tree, "")
			c.JSON(http.StatusOK, gin.H{"strategy": "split", "size": size, "fileCount": len(files), "files": files, "version": versionUUID.String()})
		}
		return
	}

	size, err := projectSize(projID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}
	if size < 1*1024*1024 {
		tree := loadFatWithCache(projID, nil)
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
	versionStr := c.Query("version")

	if versionStr != "" {
		versionUUID, err := gocql.ParseUUID(versionStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid version UUID format"})
			return
		}
		tree := loadFatWithCache(projID, &versionUUID)
		if tree == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "project or version not found"})
			return
		}
		foundFile := findFileInTree(tree, filePath)
		if foundFile == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found in this version"})
			return
		}
		c.Data(http.StatusOK, "text/plain", []byte(foundFile.Content))
		return
	}

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
	broadcast(projID, map[string]interface{}{"type": "update", "version": version, "size": size})
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

/* ============ Astra Data Helpers ============ */

func projectSize(projectID string) (int, error) {
	var size int
	err := session.Query(`SELECT size FROM project_snapshots WHERE project_id=? ORDER BY version DESC LIMIT 1`, projectID).Scan(&size)
	return size, err
}

func loadFat(projectID string, version *gocql.UUID) []FileSystemNode {
	var raw string
	var err error
	var q *gocql.Query
	cql := `SELECT snapshot FROM project_snapshots WHERE project_id = ?`
	if version != nil {
		cql += ` AND version = ? LIMIT 1`
		q = session.Query(cql, projectID, *version)
	} else {
		cql += ` ORDER BY version DESC LIMIT 1`
		q = session.Query(cql, projectID)
	}
	err = q.Consistency(gocql.One).Scan(&raw)
	if err != nil {
		log.Printf("Failed to load snapshot for project %s (version: %v): %v", projectID, version, err)
		return nil
	}
	var tree []FileSystemNode
	if err := json.Unmarshal([]byte(raw), &tree); err != nil {
		log.Printf("Failed to unmarshal snapshot for project %s: %v", projectID, err)
		return nil
	}
	return tree
}

func loadFatWithCache(projectID string, version *gocql.UUID) []FileSystemNode {
	const cacheDuration = 2 * time.Minute
	key := fmt.Sprintf("%s@latest", projectID)
	if version != nil {
		key = fmt.Sprintf("%s@%s", projectID, version.String())
	}
	if item, ok := snapshotCache.Load(key); ok {
		cachedItem := item.(*SnapshotCacheItem)
		if time.Since(cachedItem.CachedAt) < cacheDuration {
			log.Printf("CACHE HIT for %s", key)
			return cachedItem.Tree
		}
		log.Printf("CACHE EXPIRED for %s", key)
	}
	log.Printf("CACHE MISS for %s", key)
	tree := loadFat(projectID, version)
	if tree != nil {
		snapshotCache.Store(key, &SnapshotCacheItem{
			Tree:     tree,
			CachedAt: time.Now(),
		})
	}
	return tree
}

func listFiles(projectID string) []FileSystemNode {
	iter := session.Query(`SELECT path,name,is_folder FROM project_files WHERE project_id=?`, projectID).Iter()
	var nodes []FileSystemNode
	var p, name string
	var folder bool
	for iter.Scan(&p, &name, &folder) {
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

func saveHybrid(projectID string, tree []FileSystemNode) (string, int, error) {
	raw, _ := json.Marshal(tree)
	ver := gocql.TimeUUID()
	size := len(raw)
	batch := session.NewBatch(gocql.LoggedBatch)
	batch.Query(`INSERT INTO project_snapshots (project_id,version,snapshot,size,updated_at) VALUES (?,?,?,?,?)`, projectID, ver, string(raw), size, time.Now())
	insertSplitBatch(projectID, tree, "", batch, time.Now())
	if err := session.ExecuteBatch(batch); err != nil {
		return "", 0, err
	}
	// Invalidate cache on save
	snapshotCache.Delete(fmt.Sprintf("%s@latest", projectID))
	log.Printf("CACHE INVALIDATED for %s@latest", projectID)
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

/* ============ NEW HELPER FUNCTIONS for Versioning ============ */

func flattenTree(nodes []FileSystemNode, prefix string) []FileSystemNode {
	var fileList []FileSystemNode
	for _, n := range nodes {
		flatNode := FileSystemNode{
			ID:       path.Join(prefix, n.Name),
			Name:     n.Name,
			Type:     n.Type,
			IsFolder: n.IsFolder,
		}
		fileList = append(fileList, flatNode)
		if n.Type == "folder" && len(n.Children) > 0 {
			p := path.Join(prefix, n.Name)
			fileList = append(fileList, flattenTree(n.Children, p)...)
		}
	}
	return fileList
}

func findFileInTree(nodes []FileSystemNode, targetPath string) *FileSystemNode {
	parts := strings.SplitN(targetPath, "/", 2)
	head := parts[0]
	tail := ""
	if len(parts) > 1 {
		tail = parts[1]
	}
	for i := range nodes {
		node := &nodes[i]
		if node.Name == head {
			if tail == "" {
				if node.Type == "file" {
					return node
				}
				return nil
			}
			if node.Type == "folder" {
				return findFileInTree(node.Children, tail)
			}
		}
	}
	return nil
}