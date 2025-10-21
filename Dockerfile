FROM debian:latest

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies (including JXL and HEIF support)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    exiftool \
    imagemagick \
    libjpeg-dev \
    libpng-dev \
    libjpeg-turbo-progs \
    libjxl-dev \
    libheif-dev \
    autoconf \
    automake \
    libtool \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and run unified build script
COPY build-docker.sh /tmp/build-docker.sh
RUN chmod +x /tmp/build-docker.sh && \
    INSTALL_PREFIX=/usr/local NUM_CORES=$(nproc) /tmp/build-docker.sh && \
    rm /tmp/build-docker.sh

# Copy scripts and configuration files to /app
COPY convert-to-iso-hdr.sh /app/convert-to-iso-hdr.sh
COPY hdr-config.cfg /app/hdr-config.cfg
COPY entrypoint.sh /app/entrypoint.sh

# Make scripts executable and symlink binaries to /app for relative path access
RUN chmod +x /app/convert-to-iso-hdr.sh /app/entrypoint.sh && \
    ln -s /usr/local/bin/magick /app/magick && \
    ln -s /usr/local/bin/ultrahdr_app /app/ultrahdr_app && \
    sed -i 's|local magick_cmd="./magick"|local magick_cmd="$script_dir/magick"|g' /app/convert-to-iso-hdr.sh && \
    sed -i 's|ULTRAHDR_APP="./ultrahdr_app"|ULTRAHDR_APP="$SCRIPT_DIR_PATH/ultrahdr_app"|g' /app/convert-to-iso-hdr.sh

# Set the working directory for file operations
WORKDIR /data

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command (shows help)
CMD []

