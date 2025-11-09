package runner

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCreateSandbox(t *testing.T) {
	baseDir := os.TempDir()
	path, err := CreateSandbox(baseDir)
	if err != nil {
		t.Fatalf("CreateSandbox() error = %v", err)
	}
	defer os.RemoveAll(path)

	if _, err := os.Stat(path); os.IsNotExist(err) {
		t.Errorf("Sandbox directory was not created")
	}

	// Check if the path is inside the base directory
	if !filepath.HasPrefix(path, baseDir) {
		t.Errorf("Sandbox directory is not inside the base directory")
	}
}

func TestCleanupSandbox(t *testing.T) {
	baseDir := os.TempDir()
	path, err := CreateSandbox(baseDir)
	if err != nil {
		t.Fatalf("CreateSandbox() error = %v", err)
	}

	CleanupSandbox(path)

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Errorf("Sandbox directory was not cleaned up")
	}
}
