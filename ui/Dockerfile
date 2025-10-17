# ============================================
# Stage 1: Build WASM with Emscripten
# ============================================
FROM emscripten/emsdk:3.1.51 AS wasm-builder

WORKDIR /build

# Clone and build libultrahdr for WASM
RUN git clone https://github.com/google/libultrahdr.git && \
    cd libultrahdr && \
    emcmake cmake -S. -Bbuild \
        -DCMAKE_BUILD_TYPE=Release \
        -DUHDR_BUILD_EXAMPLES=ON \
        -DUHDR_BUILD_TESTS=OFF \
        -DUHDR_BUILD_BENCHMARK=OFF \
        -DUHDR_BUILD_FUZZERS=OFF \
        -DUHDR_ENABLE_LOGS=ON \
        -DUHDR_WRITE_XMP=ON \
        -DUHDR_BUILD_DEPS=ON \
        -DCMAKE_CXX_FLAGS="-s EXPORTED_FUNCTIONS='[_main]' -s EXPORTED_RUNTIME_METHODS='[FS,callMain]' -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_NAME='UltraHDRModule'" && \
    cd build && \
    emmake make VERBOSE=1

# ============================================
# Stage 2: Build Nuxt UI
# ============================================
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy all source code
COPY . .

# Copy WASM files from wasm-builder stage
COPY --from=wasm-builder /build/libultrahdr/build/ultrahdr_app.js ./public/
COPY --from=wasm-builder /build/libultrahdr/build/ultrahdr_app.wasm ./public/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Disable typecheck during Docker build for faster builds
RUN sed -i 's/typeCheck: true/typeCheck: false/' nuxt.config.ts

# Generate static site
ENV NODE_ENV=production
RUN pnpm generate

# ============================================
# Stage 3: Production image with static file server
# ============================================
FROM node:20-slim

# Install http-server for static file serving
RUN npm install -g http-server

WORKDIR /app

# Copy built static files from builder
COPY --from=builder /app/.output/public ./dist

# Expose port
EXPOSE 3000

# Start server with gzip and brotli compression enabled
# -g: Enable gzip compression
# -b: Enable brotli compression
# -p 3000: Port
# -c-1: Disable caching
CMD ["http-server", "dist", "-p", "3000", "-g", "-b", "-c-1"]
