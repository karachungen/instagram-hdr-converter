# ============================================
# Stage 1: Build ImageMagick and libultrahdr
# ============================================
FROM debian:bookworm AS magick-builder

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libjpeg-dev \
    libpng-dev \
    autoconf \
    automake \
    libtool \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy and run unified build script
COPY build-docker.sh /tmp/build-docker.sh
RUN chmod +x /tmp/build-docker.sh && \
    INSTALL_PREFIX=/usr/local NUM_CORES=$(nproc) /tmp/build-docker.sh && \
    rm /tmp/build-docker.sh

# ============================================
# Stage 2: Build Nuxt App
# ============================================
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy package files
COPY ui-api/package.json ui-api/pnpm-lock.yaml* ui-api/.npmrc* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY ui-api/ .

# Build Nuxt app (includes static assets + server for API routes)
ENV NODE_ENV=production
RUN pnpm build

# ============================================
# Stage 3: Production Runtime with Static Site & API
# ============================================
FROM node:20-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y \
    exiftool \
    libjpeg-turbo-progs \
    libjpeg62-turbo \
    libpng16-16 \
    libgomp1 \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built Nuxt output (includes both static files and server)
COPY --from=builder /app/.output ./output

# Create symlink for static files (nginx will serve from /app/dist)
RUN ln -s /app/output/public /app/dist

# Copy ImageMagick binaries and libraries from magick-builder
COPY --from=magick-builder /usr/local/bin/magick /app/output/server/cmd/magick
COPY --from=magick-builder /usr/local/bin/ultrahdr_app /app/output/server/cmd/ultrahdr_app
COPY --from=magick-builder /usr/local/lib/libMagick*.so* /usr/local/lib/
COPY --from=magick-builder /usr/local/lib/libuhdr.so* /usr/local/lib/
COPY --from=magick-builder /usr/local/etc/ImageMagick-7 /usr/local/etc/ImageMagick-7

# Copy conversion scripts and config to server directory
COPY convert-to-iso-hdr.sh /app/output/server/cmd/convert-to-iso-hdr.sh
COPY hdr-config.cfg /app/output/server/cmd/hdr-config.cfg

# Update library cache and set permissions
RUN ldconfig && \
    chmod +x /app/output/server/cmd/convert-to-iso-hdr.sh /app/output/server/cmd/magick /app/output/server/cmd/ultrahdr_app

# Configure Nginx for static files with compression
RUN rm -f /etc/nginx/sites-enabled/default
COPY <<EOF /etc/nginx/sites-available/hdr-converter
server {
    listen 8080;
    server_name _;
    root /app/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

    # Cache static assets (serve directly from nginx)
    location /_nuxt/ {
        alias /app/dist/_nuxt/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve static files
    location ~* \.(ico|svg|txt|xml)$ {
        root /app/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to Nitro server
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Increase timeouts for file uploads
        client_max_body_size 50M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Proxy all other requests to Nitro (for SPA routing)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

RUN ln -s /etc/nginx/sites-available/hdr-converter /etc/nginx/sites-enabled/

# Configure Supervisor to run both Nginx and Nitro
COPY <<EOF /etc/supervisor/conf.d/hdr-converter.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=/usr/sbin/nginx -g 'daemon off;'
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nitro]
command=node /app/output/server/index.mjs
directory=/app/output
autostart=true
autorestart=true
environment=NODE_ENV=production,NITRO_PORT=3000,NITRO_HOST=0.0.0.0
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# Expose port (Nginx)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/hdr-converter.conf"]
