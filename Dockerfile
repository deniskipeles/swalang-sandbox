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

# Environment variable setup (these will come from Render/Koyeb)

# Decode Astra bundle at runtime
ENTRYPOINT ["/bin/sh", "-c", "\
  echo '🔐 Reconstructing Astra secure bundle...'; \
  echo $SECURE_BUNDLE_B64 | base64 -d > /app/secure-connect-swalang-codebase.zip; \
  exec ./server \
"]