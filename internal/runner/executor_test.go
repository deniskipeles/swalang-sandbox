package runner

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestRunSwalang(t *testing.T) {
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

	// Create a temporary work directory
	workDir, err := os.MkdirTemp("", "swalang-exec-*")
	if err != nil {
		t.Fatalf("Failed to create execution directory: %v", err)
	}
	defer os.RemoveAll(workDir)

	// Create a dummy entry file
	entrypointPath := filepath.Join(workDir, "main.sw")
	if err := os.WriteFile(entrypointPath, []byte(""), 0644); err != nil {
		t.Fatalf("Failed to write code to file: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := RunSwalang(ctx, mockBinPath, workDir, "main.sw")
	if err != nil {
		t.Fatalf("RunSwalang() error = %v", err)
	}

	if result.Stdout != "hello" {
		t.Errorf("RunSwalang() stdout = %q, want %q", result.Stdout, "hello")
	}

	if result.Stderr != "" {
		t.Errorf("RunSwalang() stderr = %q, want %q", result.Stderr, "")
	}
}
