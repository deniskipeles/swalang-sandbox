FROM golang:1.23-alpine
WORKDIR /app
COPY . .
RUN apk add --no-cache redis
RUN go mod tidy
RUN go build -o server ./cmd/server
COPY ./swalang /usr/local/bin/swalang
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
