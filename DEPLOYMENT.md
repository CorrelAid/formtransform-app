# Deployment Guide for FormTransform

This guide provides instructions for deploying the FormTransform static site using Coolify with Nixpacks.

## Deployment Options

### 1. Coolify with Nixpacks (Recommended)

This project is configured to deploy easily on Coolify using Nixpacks. The configuration automatically:
- Installs Node.js 20
- Sets up pnpm for dependency management
- Builds the static site
- Serves the site using a custom Node.js server

#### Coolify Setup

1. **Add a new application** in Coolify
2. **Select "Nixpacks"** as the build pack
3. **Configure the repository**:
   - Repository URL: Your Git repository URL
   - Branch: `main` (or your deployment branch)
4. **Environment variables**:
   - `PORT`: `3000` (or your preferred port)
5. **Build settings**:
   - Build command: `pnpm run build`
   - Start command: `node serve.js`
   - Build directory: `build`

### 2. Manual Deployment

#### Prerequisites
- Node.js 20+
- pnpm (or npm/yarn)

#### Build the Static Site

```bash
# Install dependencies
pnpm install

# Build the static site
pnpm run build
```

This will create a `build/` directory with all static assets.

#### Serve the Site

You can serve the site using the included serve script:

```bash
# Start the development server
node serve.js

# Or use the npm script
pnpm run serve
```

The site will be available at `http://localhost:3000` by default.

### 3. Docker Deployment

You can deploy using Docker with multiple approaches:

#### Using Nixpacks (Coolify default)
```bash
# Build the Docker image using Nixpacks
nixpacks build

# Run the container
nixpacks run
```

#### Using Dockerfile (Fallback)
A `Dockerfile` is provided as a fallback if Nixpacks configuration fails:

```bash
# Build the image using Dockerfile
docker build -t formtransform .

# Run the container
docker run -p 3000:3000 formtransform
```

#### Coolify Configuration
If Nixpacks fails, you can configure Coolify to use the Dockerfile:
1. In Coolify, select "Dockerfile" instead of "Nixpacks" as the build method
2. Set build context to `/`
3. Set Dockerfile path to `Dockerfile`
4. Use the same environment variables

## Configuration Files

### `nixpacks.toml`

The Nixpacks configuration file defines the build process:
- Node.js 20 installation
- pnpm dependency management
- Build process
- Start command using the custom server

### `Dockerfile`

A Dockerfile is provided as a fallback deployment method:
- Multi-stage build for optimized production image
- Uses Node.js 20-alpine for small image size
- Includes proper build and production stages

### `serve.js`

A custom Node.js HTTP server that:
- Serves static files from the `build/` directory
- Handles proper MIME types
- Supports SPA routing (falls back to index.html)
- Includes graceful shutdown
- Has security protections against directory traversal

### `.dockerignore`

Optimizes Docker builds by excluding unnecessary files:
- `node_modules/`
- `build/`
- Test files
- IDE files
- Environment files

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |

## Troubleshooting

### Server not starting
- Check that `build/` directory exists and contains files
- Verify Node.js version is 20+
- Ensure all dependencies are installed

### 404 errors
- The custom server automatically falls back to `index.html` for SPA routing
- Make sure your SvelteKit router is configured correctly

### Build failures
- Run `pnpm install` locally to verify dependencies
- Check Node.js and pnpm versions match the deployment environment

### Nixpacks configuration issues
If you encounter Nixpacks parsing errors:
1. Try using the Dockerfile method instead
2. Check that your Nixpacks version is up to date
3. Verify the TOML syntax is correct

## Testing Deployment Locally

Run the test script to verify everything works:

```bash
./test-deployment.sh
```

This will:
1. Check Node.js and pnpm versions
2. Install dependencies
3. Build the site
4. Start the server and test connectivity
5. Clean up

## Coolify-Specific Notes

- Coolify automatically sets the `PORT` environment variable
- The Nixpacks configuration is optimized for Coolify's build process
- The custom server handles graceful shutdown for container orchestration
- SPA routing is properly configured for single-page application behavior
- A Dockerfile is provided as a fallback if Nixpacks has issues