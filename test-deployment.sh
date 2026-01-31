#!/bin/bash

# Test script to verify deployment setup
set -e

echo "🚀 Testing deployment setup..."

# Check if Node.js is available
echo "✅ Checking Node.js version..."
node --version

# Check if bun is available
echo "✅ Checking bun version..."
bun --version

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Build the static site
echo "🔨 Building static site..."
bun run build

# Test the serve script
echo "🌐 Testing serve script..."
# Start server in background
node serve.js &
SERVER_PID=$!

# Wait a bit for server to start
sleep 2

# Test if server is responding
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ Server is responding correctly"
    # Stop the server
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null || true
else
    echo "❌ Server failed to respond"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "🎉 Deployment setup test completed successfully!"

# Clean up
rm -rf build/