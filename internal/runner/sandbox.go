package runner

import (
	"os"
	"path/filepath"
	"github.com/google/uuid"
)

func CreateSandbox(baseDir string) (string, error) {
	id := uuid.NewString()
	path := filepath.Join(baseDir, id)
	err := os.MkdirAll(path, 0755)
	return path, err
}

func CleanupSandbox(path string) {
	os.RemoveAll(path)
}
