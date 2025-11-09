FROM golang:1.23-bookworm

WORKDIR /app
COPY . .
RUN go mod tidy
RUN go build -o server ./cmd/server

# Install libffi runtime
RUN apt-get update && apt-get install -y libffi7 || apt-get install -y libffi8

COPY ./swalang /usr/local/bin/swalang
RUN chmod +x /usr/local/bin/swalang

EXPOSE 8080
CMD ["./server"]
