package storage

import (
	"os"
	"path/filepath"
)

var logBaseDir = "/var/log/swalang"

func init() {
	if err := os.MkdirAll(logBaseDir, 0755); err != nil {
		// In a real application, you'd want to handle this more gracefully.
		panic("could not create log directory: " + err.Error())
	}
}

// SaveLog saves the output of a session to a log file.
func SaveLog(sessionID, stdout, stderr string) error {
	logFilePath := filepath.Join(logBaseDir, sessionID+".log")
	logContent := "--- STDOUT ---\n" + stdout + "\n--- STDERR ---\n" + stderr
	return os.WriteFile(logFilePath, []byte(logContent), 0644)
}

// GetLog retrieves the log file for a given session.
func GetLog(sessionID string) ([]byte, error) {
	logFilePath := filepath.Join(logBaseDir, sessionID+".log")
	return os.ReadFile(logFilePath)
}
