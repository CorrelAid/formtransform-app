#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;
const BUILD_DIR = join(__dirname, 'build');

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from ${BUILD_DIR}`);
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