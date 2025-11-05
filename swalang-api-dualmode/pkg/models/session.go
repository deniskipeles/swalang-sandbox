package models

import "time"

type Session struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	Files     []File    `json:"files"`
}

type File struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}
