# Swalang Cloud Sandbox API

## 🧩 Overview

This project provides a secure and scalable Go backend for the Swalang Cloud Sandbox. It's designed to run Swalang code from multiple users simultaneously in isolated environments, offering both a synchronous JSON API for batch execution and a WebSocket for real-time streaming of console output.

## ✨ Features

- **Isolated Execution:** Each user session runs in its own temporary directory (`/tmp/swalang_sessions/<sessionID>`).
- **Multi-File Support:** Easily upload multiple files and create nested directory structures for complex projects.
- **Dual-Mode API:**
    - **JSON Mode:** A standard HTTP endpoint for synchronous code execution.
    - **Realtime Mode:** A WebSocket for streaming `stdout` and `stderr` in real-time.
- **Persistent Logging:** All session output is saved to log files, which can be retrieved via the API.
- **Automated Cleanup:** A background worker automatically cleans up old and inactive sessions.
- **Rate Limiting:** Per-IP rate limiting to prevent abuse.
- **Secure WebSockets:** Configurable origin checking for WebSocket connections.
- **Containerized:** A `Dockerfile` is included for easy deployment.

## 🚀 Getting Started

### Prerequisites

- [Go](https://golang.org/doc/install) (version 1.22 or later)
- [Docker](https://docs.docker.com/get-docker/) (optional, for containerized deployment)
- [Redis](https://redis.io/topics/quickstart) (for rate limiting)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd swalang-api-dualmode
    ```

2.  **Create a configuration file:**
    Copy the example environment file and customize it as needed.
    ```bash
    cp .env.example .env
    ```

3.  **Install dependencies:**
    ```bash
    go mod tidy
    ```

### Running the Server

#### With Go

You can run the server directly using `go run`:

```bash
go run ./cmd/server/main.go
```

The server will start on the port specified in your `.env` file (default: `8080`).

#### With Docker

Build and run the Docker container:

```bash
# Build the image
docker build -t swalang-api .

# Run the container
docker run -p 8080:8080 --env-file .env swalang-api
```

## 🌐 API Endpoints

| Method | Endpoint                    | Purpose                                  |
|--------|-----------------------------|------------------------------------------|
| `POST` | `/api/session/new`          | Create a new session.                    |
| `POST` | `/api/session/:id/files`    | Upload a file to a session.              |
| `POST` | `/api/session/:id/run`      | Run code in JSON mode (synchronous).     |
| `GET`  | `/api/session/:id/logs`     | Get the logs for a past session run.     |
| `WS`   | `/api/session/:id/ws`       | Connect for Realtime mode (asynchronous).|

## ⚙️ Configuration

The server is configured using the following environment variables (defined in your `.env` file):

- `SWALANG_PATH`: The path to the `swalang` executable.
- `SESSION_DIR`: The directory to store user session files.
- `CACHE_DIR`: The directory for caching Swalang packages.
- `PORT`: The port for the HTTP server.
- `MAX_EXECUTION_TIME`: The maximum time a process is allowed to run.
- `REDIS_URL`: The connection string for Redis.
- `ALLOWED_ORIGINS`: A comma-separated list of allowed origins for WebSocket connections.

## 📚 API Documentation

For detailed information on how to integrate with this API, including code examples for frontend frameworks like Next.js and SvelteKit, please see the [**API Documentation for Frontend Developers**](./docs/api.md).
