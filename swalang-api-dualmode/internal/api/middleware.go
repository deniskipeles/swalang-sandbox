package api

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var rdb *redis.Client

func init() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		// If REDIS_URL is not set, the rate limiter will be disabled.
		return
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("Could not parse REDIS_URL: %v. Rate limiting will be disabled.", err)
		return
	}

	rdb = redis.NewClient(opts)
	if _, err := rdb.Ping(context.Background()).Result(); err != nil {
		log.Printf("Could not connect to Redis: %v. Rate limiting will be disabled.", err)
		rdb = nil
	}
}

// RateLimiter is a middleware that limits requests on a per-IP basis.
func RateLimiter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if rdb == nil {
			next.ServeHTTP(w, r)
			return
		}

		ip := getIP(r)
		ctx := context.Background()
		key := "rate_limit:" + ip

		// We use a simple sliding window algorithm here.
		// Allow 100 requests per IP per minute.
		limit := 100
		window := 1 * time.Minute

		// Add the current request's timestamp to the sorted set.
		now := time.Now().UnixNano()
		rdb.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: float64(now)})

		// Remove timestamps that are older than our window.
		min := now - int64(window)
		rdb.ZRemRangeByScore(ctx, key, "-inf", "("+string(min))

		// Get the count of requests in the current window.
		count, err := rdb.ZCard(ctx, key).Result()
		if err != nil {
			log.Printf("Could not get rate limit count from Redis: %v", err)
			next.ServeHTTP(w, r)
			return
		}

		// Set an expiration on the key to clean up old data.
		rdb.Expire(ctx, key, window)

		if int(count) > limit {
			http.Error(w, "Too many requests", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func getIP(r *http.Request) string {
	// Get IP from the X-Forwarded-For header
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return strings.Split(forwarded, ",")[0]
	}
	// Fallback to RemoteAddr
	return r.RemoteAddr
}
