#!/bin/sh
# Start redis-server in the background
redis-server --daemonize yes

# Start the main application
./server
