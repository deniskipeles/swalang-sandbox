# ==============================================================================
#  Stage 1: Build the Lightweight Sandbox Go Server
# ==============================================================================
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY go.mod ./
RUN go mod download

# Copy the server source code
COPY . .

# Build the playground server as a statically-linked, lightweight binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o swalang-sandbox cmd/server/main.go


# ==============================================================================
#  Stage 2: Final Runtime Image
# ==============================================================================
FROM debian:bookworm-slim

# Install standard runtime dependencies (gzip/tar to unpack, libffi8 for FFI routines)
RUN apt-get update && apt-get install -y \
    curl \
    gzip \
    tar \
    libffi8 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set up the runtime directory
WORKDIR /app

# Download the latest pre-compiled Swalang Linux binary directly from GitHub.
# We extract it to /opt/swalang to preserve the relative paths of lib/ and stdlib/,
# then create a symbolic link to make it globally accessible in /usr/local/bin.
RUN mkdir -p /opt/swalang && \
    curl -L -o swalang.tar.gz "https://github.com/deniskipeles/swalang-beta/releases/latest/download/swalang-linux-x86_64.tar.gz" && \
    tar -xzf swalang.tar.gz -C /opt/swalang --strip-components=1 && \
    ln -sf /opt/swalang/bin/swalang /usr/local/bin/swalang && \
    rm swalang.tar.gz

# Copy the compiled sandbox server from Stage 1
COPY --from=builder /app/swalang-sandbox /usr/local/bin/swalang-sandbox

# Copy the static frontend interface files
COPY static /app/static

# Configure default environment variables
ENV PORT=8080
ENV SWALANG_PATH=/usr/local/bin/swalang

# Expose port
EXPOSE 8080

# Start the sandbox server
CMD ["/usr/local/bin/swalang-sandbox"]