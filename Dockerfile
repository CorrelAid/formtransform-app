# Dockerfile for FormTransform static site deployment
# This provides a fallback if Nixpacks configuration fails

FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the static site
RUN pnpm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/serve.js ./serve.js
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN npm install --production

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Start the server
CMD ["node", "serve.js"]