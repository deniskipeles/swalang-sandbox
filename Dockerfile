FROM golang:1.23-alpine

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Install unzip & coreutils (for base64 decoding)
RUN apk add --no-cache unzip coreutils

# Build Go server
RUN go mod tidy && go build -o server ./cmd/server

# Copy prebuilt swalang binary
COPY ./swalang /usr/local/bin/swalang
RUN chmod +x /usr/local/bin/swalang

# Reconstruct the Astra bundle *safely* at runtime
ENTRYPOINT ["/bin/sh", "-c", "\
  echo '🔐 Exporting environment variables from .env...'; \
  if [ -f .env ]; then export $(grep -v '^#' .env | xargs); fi; \
  echo '🔐 Reconstructing Astra secure bundle...'; \
  CLEAN=$(printf \"%s\" \"$SECURE_BUNDLE_B64\" | tr -d '\\n\\r '); \
  printf \"%s\" \"$CLEAN\" | base64 -d > /app/secure-connect-swalang-codebase.zip || { echo '❌ Base64 decode failed'; exit 1; }; \
  exec ./server \
"]

