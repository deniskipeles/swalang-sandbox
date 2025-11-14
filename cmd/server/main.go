package main

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path"
	"sync"
	"syscall"
	"time"

	"swalang-api-dualmode/internal/api"

	gocqlastra "github.com/datastax/gocql-astra"
	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

/* ---------- Project domain types (from second app) ---------- */

type FileSystemNode struct {
	ID       string           `json:"id"`
	Name     string           `json:"name"`
	Type     string           `json:"type"` // "file" | "folder"
	Content  string           `json:"content,omitempty"`
	Children []FileSystemNode `json:"children,omitempty"`
	IsFolder bool             `json:"isFolder,omitempty"`
}

type IndexJob struct {
	JobID     string    `json:"jobId"`
	ProjectID string    `json:"projectId"`
	Status    string    `json:"status"` // pending|running|done|failed
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

/* ---------- Globals ---------- */

var (
	// Redis
	rdb *redis.Client

	// Astra DB
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
		// Be permissive like original: allow all origins for dev
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

	if token == "" {
		log.Println("⚠️  ASTRA_TOKEN not set. Project features disabled.")
		return
	}
	if bundle == "" {
		log.Println("⚠️  ASTRA_BUNDLE  not set. Project features disabled.")
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

/* ---------- Redis Setup ---------- */

func setupRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Could not parse Redis URL: %v", err)
	}
	rdb = redis.NewClient(opt)

	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	log.Println("✅ Connected to Redis")
}

/* ---------- Main ---------- */

func main() {
	// Setup Redis (required for session API)
	setupRedis()
	api.SetRedisClient(rdb)

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

	// Static file
	r.GET("/", func(c *gin.Context) {
		c.File("static/index.html")
	})

	// ======== SESSION API (original) ========
	sessionAPI := r.Group("/api")
	{
		sessionAPI.POST("/session/new", gin.WrapF(api.NewSessionHandler))
		sessionAPI.POST("/session/:id/files", gin.WrapF(api.UploadFileHandler))
		sessionAPI.POST("/session/:id/run", gin.WrapF(api.RunHandler))
		sessionAPI.GET("/session/:id/logs", gin.WrapF(api.LogsHandler))
		sessionAPI.GET("/session/:id/ws", gin.WrapF(api.HandleWS))
	}

	// ======== PROJECT API (new) — only if Astra is connected ========
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

	// Health check (works regardless)
	r.GET("/health", health)

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	// Graceful shutdown
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
	if session != nil {
		log.Println("✨ Project features (Astra) enabled")
	} else {
		log.Println("⚠️  Project features disabled (missing ASTRA_BUNDLE or ASTRA_TOKEN)")
	}
	log.Fatal(srv.ListenAndServe())
}

/* ============ PROJECT API HANDLERS (copied from second app) ============ */

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
	}
	if rdb != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := rdb.Ping(ctx).Err(); err == nil {
			status["redis"] = "connected"
		} else {
			status["redis"] = "disconnected"
		}
	}
	c.JSON(http.StatusOK, status)
}

/* ============ Astra Data Helpers (copied) ============ */

func projectSize(projectID string) (int, error) {
	var size int
	err := session.Query(`SELECT size FROM project_snapshots WHERE project_id=? LIMIT 1`, projectID).Scan(&size)
	return size, err
}

func loadFat(projectID string) []FileSystemNode {
	var raw string
	err := session.Query(`SELECT snapshot FROM project_snapshots WHERE project_id = ? LIMIT 1`, projectID).
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
