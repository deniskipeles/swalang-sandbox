package api

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"
)

func TestNewSessionHandler(t *testing.T) {
	// Start a mock Redis server
	s, err := miniredis.Run()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer s.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})
	SetRedisClient(rdb)

	req, err := http.NewRequest("GET", "/api/session/new", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(NewSessionHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
}

func TestUploadFileHandler(t *testing.T) {
	s, err := miniredis.Run()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer s.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})
	SetRedisClient(rdb)

	sessionID := "test-session"
	s.HSet("session:"+sessionID, "status", "created")

	body := `{"path": "main.sw", "content": "print(\"hello\")"}`
	req, err := http.NewRequest("POST", "/api/session/"+sessionID+"/upload", strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(UploadFileHandler)

	// Create a router and add the handler to it to test mux.Vars
	router := mux.NewRouter()
	router.HandleFunc("/api/session/{id}/upload", handler)
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusCreated)
	}
}

func TestRunHandler(t *testing.T) {
	// Create a mock swalang binary
	mockBinDir, err := os.MkdirTemp("", "mock-bin")
	if err != nil {
		t.Fatalf("Failed to create mock bin directory: %v", err)
	}
	defer os.RemoveAll(mockBinDir)

	mockBinPath := filepath.Join(mockBinDir, "swalang")
	mockScript := "#!/bin/sh\necho -n \"hello\"\n"
	if err := os.WriteFile(mockBinPath, []byte(mockScript), 0755); err != nil {
		t.Fatalf("Failed to write mock swalang binary: %v", err)
	}
	os.Setenv("SWALANG_PATH", mockBinPath)
	defer os.Unsetenv("SWALANG_PATH")

	s, err := miniredis.Run()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer s.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})
	SetRedisClient(rdb)

	sessionID := "test-session"
	s.HSet("session:"+sessionID, "file:main.sw", "print(\"hello\")")

	req, err := http.NewRequest("POST", "/api/session/"+sessionID+"/run", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(RunHandler)

	router := mux.NewRouter()
	router.HandleFunc("/api/session/{id}/run", handler)
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
}

func TestLogsHandler(t *testing.T) {
	s, err := miniredis.Run()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer s.Close()

	rdb := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})
	SetRedisClient(rdb)

	sessionID := "test-session"
	s.Set("logs:"+sessionID, "hello")

	req, err := http.NewRequest("GET", "/api/session/"+sessionID+"/logs", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(LogsHandler)

	router := mux.NewRouter()
	router.HandleFunc("/api/session/{id}/logs", handler)
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	if body := rr.Body.String(); body != "hello" {
		t.Errorf("handler returned unexpected body: got %v want %v",
			body, "hello")
	}
}

func TestServeIndex(t *testing.T) {
	// Create a temporary directory for static files
	tmpDir, err := os.MkdirTemp("", "static")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	// Create a dummy index.html file in the temp dir
	tmpFile := filepath.Join(tmpDir, "index.html")
	if err := os.WriteFile(tmpFile, []byte("hello"), 0644); err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("GET", "/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	// This test simulates the handler defined in main.go
	handler := func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, tmpFile)
	}

	router := mux.NewRouter()
	router.HandleFunc("/", handler)
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	if body := rr.Body.String(); body != "hello" {
		t.Errorf("handler returned unexpected body: got %v want %v",
			body, "hello")
	}
}
