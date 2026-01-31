#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const BUILD_DIR = join(__dirname, 'build');

console.log(`🚀 Starting server on ${HOST}:${PORT}...`);
console.log(`📁 Working directory: ${__dirname}`);

// Check if build directory exists
if (existsSync(BUILD_DIR)) {
  console.log(`✅ build directory exists`);
  const files = readdirSync(BUILD_DIR);
  console.log(`build contents: ${files.join(', ')}`);
} else {
  console.error(`❌ build directory NOT FOUND at ${BUILD_DIR}`);
  console.log(`Current directory contents:`, readdirSync(__dirname));
}

const mimeTypes = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

const server = createServer((req, res) => {
  // Health check endpoint for Coolify
  if (req.url === '/health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    return;
  }

  let filePath = join(BUILD_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Security check to prevent directory traversal
  if (!filePath.startsWith(BUILD_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = readFileSync(filePath);
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Try to serve index.html for SPA routing
      try {
        const indexContent = readFileSync(join(BUILD_DIR, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexContent);
      } catch (indexErr) {
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(500);
      res.end('Server Error');
    }
  }
});

// Add readiness check
server.on('listening', () => {
  console.log(`✅ Server ready and listening on port ${PORT}`);
  console.log('🌐 Health check available at /health and /healthz');
  console.log('📁 Serving static files from:', BUILD_DIR);
  
  // Log available files for debugging
  try {
    const files = readdirSync(BUILD_DIR);
    console.log('📋 Available files:', files.join(', '));
  } catch (err) {
    console.error('❌ Error reading build directory:', err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
  console.log(`📁 Serving static files from ${BUILD_DIR}`);
  console.log(`🌐 Health checks available at /health and /healthz`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});