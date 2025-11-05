# Swalang Cloud Sandbox API

This is the backend API for the Swalang Cloud Sandbox. It is a dual-mode API that supports both JSON and WebSocket-based communication for executing Swalang code in isolated sandbox environments.

## Features

- **Dual-Mode API**: Choose between a simple JSON API for synchronous execution or a WebSocket API for real-time streaming.
- **Session-Based Execution**: Each user session runs in its own isolated sandbox.
- **File Uploads**: Support for uploading multiple files and creating nested directories.
- **Configurable**: Most settings can be configured via environment variables.

## Getting Started

### Prerequisites

- [Go](https://golang.org/) (version 1.18 or higher)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Local Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/swalang-api-dualmode.git
    cd swalang-api-dualmode
    ```

2.  **Set up environment variables**:
    -   Copy the `.env.example` file to a new file named `.env`:
        ```bash
        cp .env.example .env
        ```
    -   Modify the `.env` file to match your local setup.

3.  **Run the server**:
    ```bash
    go run ./cmd/server/main.go
    ```
    The server will start on the port specified in your `.env` file (default is `8080`).

## Docker Deployment

This project includes a `Dockerfile` for easy containerization.

1.  **Build the Docker image**:
    ```bash
    docker build -t swalang-api .
    ```

2.  **Run the Docker container**:
    ```bash
    docker run -p 8080:8080 --env-file .env swalang-api
    ```

## API Documentation

For detailed information on how to use the API, please see the [API Guide](./docs/API_GUIDE.md).

## Configuration

The application is configured using environment variables. See the `.env.example` file for a list of all available options.
