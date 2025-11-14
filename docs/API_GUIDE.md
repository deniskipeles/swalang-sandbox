# Swalang Cloud Sandbox API Guide

This guide provides instructions for frontend developers on how to interact with the Swalang Cloud Sandbox API. The API supports two modes of code execution: a standard JSON-based REST API for synchronous execution and a WebSocket-based API for real-time streaming of `stdout` and `stderr`.

## 1. Session Lifecycle

The API is session-based. A typical interaction cycle is as follows:

1.  **Create a Session**: A new session is created, providing a unique `session_id`.
2.  **Upload Files**: The source code and any other necessary files are uploaded to the session.
3.  **Execute Code**: The code is executed either in JSON or WebSocket mode.
4.  **Retrieve Logs**: The logs of a past execution can be retrieved.

---

## 2. API Endpoints

### Create a New Session

Creates a new execution sandbox and returns a `session_id`.

- **Method**: `POST`
- **Endpoint**: `/api/session/new`
- **Response**:
  ```json
  {
    "session_id": "your-unique-session-id",
    "ws_url": "ws://your-server-address/api/session/your-unique-session-id/ws"
  }
  ```

### Upload a File

Uploads a file to the session's sandbox.

- **Method**: `POST`
- **Endpoint**: `/api/session/{id}/files`
- **Request Body**:
  ```json
  {
    "path": "main.sw",
    "content": "your swalang code here"
  }
  ```
- **Notes**:
  - The `path` can include subdirectories (e.g., `src/main.sw`), which will be created automatically.

### Run Code (JSON Mode)

Executes the code and returns the full `stdout` and `stderr` after the process has finished.

- **Method**: `POST`
- **Endpoint**: `/api/session/{id}/run`
- **Response**:
  ```json
  {
    "stdout": "...",
    "stderr": "..."
  }
  ```
- **Notes**:
  - This endpoint is best for short-running scripts where real-time output is not required.

### Get Session Logs

Retrieves the logs from the last execution for a given session.

- **Method**: `GET`
- **Endpoint**: `/api/session/{id}/logs`
- **Response**: Plain text (`text/plain`) containing the logs.

---

## 3. Real-time Execution (WebSocket)

For real-time feedback, a WebSocket connection can be established.

- **Endpoint**: `/api/session/{id}/ws` (The full URL is provided when a new session is created).

### Sending Messages

To run the code, send a JSON message with an `action`:

```json
{
  "action": "run"
}
```

### Receiving Messages

The server will stream `stdout` and `stderr` as JSON messages.

- **Stdout Message**:
  ```json
  {
    "type": "stdout",
    "content": "line of output"
  }
  ```
- **Stderr Message**:
  ```json
  {
    "type": "stderr",
    "content": "line of error output"
  }
  ```
- **Error Message**:
  ```json
  {
    "type": "error",
    "content": "error message"
  }
  ```
---
