FROM golang:1.23-alpine

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Install redis + unzip + base64 support
RUN apk add --no-cache redis unzip coreutils

# Build Go server
RUN go mod tidy && go build -o server ./cmd/server

# Copy prebuilt swalang binary
COPY ./swalang /usr/local/bin/swalang
RUN chmod +x /usr/local/bin/swalang

# Expose Redis port (optional)
EXPOSE 6379
EXPOSE 8080

# Start Redis + reconstruct bundle + run backend
ENTRYPOINT ["/bin/sh", "-c", "\
  echo '🚀 Starting Redis...'; \
  redis-server --daemonize yes; \
  sleep 1; \
  echo '🔐 Reconstructing Astra secure bundle...'; \
  CLEAN=$(printf \"%s\" \"$SECURE_BUNDLE_B64\" | tr -d '\\n\\r '); \
  printf \"%s\" \"$CLEAN\" | base64 -d > /app/secure-connect-swalang-codebase.zip || { echo '❌ Base64 decode failed'; exit 1; }; \
  echo '✅ Bundle restored to /app/secure-connect-swalang-codebase.zip'; \
  echo '🚀 Starting API server...'; \
  exec ./server \
"]
