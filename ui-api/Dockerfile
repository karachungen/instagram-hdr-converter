# ============================================
# Stage 1: Build Nuxt App
# ============================================
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Nuxt app
ENV NODE_ENV=production
RUN pnpm build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:20-slim

# Install Docker CLI for running conversion container
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/.output ./

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Start the Nitro server
CMD ["node", "server/index.mjs"]
