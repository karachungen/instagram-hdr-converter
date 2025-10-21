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

# Copy scripts and configuration files
COPY convert-to-iso-hdr.sh /usr/local/bin/convert-to-iso-hdr.sh
COPY hdr-config.cfg /usr/local/bin/hdr-config.cfg
COPY entrypoint.sh /usr/local/bin/entrypoint.sh


# Make scripts executable
RUN chmod +x /usr/local/bin/convert-to-iso-hdr.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

# Update convert-to-iso-hdr.sh to use correct paths in container
RUN sed -i 's|"$SCRIPT_DIR_PATH/hdr-config.cfg"|"/usr/local/bin/hdr-config.cfg"|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|local magick_cmd="./magick"|local magick_cmd="magick"|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|if \[ -f "$script_dir/magick" \]; then|if command -v magick \&> /dev/null; then|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i '/export DYLD_LIBRARY_PATH/d' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|Using local magick binary:|Using system magick binary:|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|Local ImageMagick (magick) not found at: $script_dir/magick|System ImageMagick (magick) not found in PATH|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|ULTRAHDR_APP="./ultrahdr_app"|ULTRAHDR_APP="ultrahdr_app"|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|if \[ ! -f "$SCRIPT_DIR_PATH/ultrahdr_app" \]; then|if ! command -v ultrahdr_app \&> /dev/null; then|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|print_error "libultrahdr (ultrahdr_app) not found at: $SCRIPT_DIR_PATH/ultrahdr_app"|print_error "System ultrahdr_app not found in PATH"|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|Using local ultrahdr_app binary:|Using system ultrahdr_app binary:|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|command -v \./ultrahdr_app|command -v ultrahdr_app|g' /usr/local/bin/convert-to-iso-hdr.sh

# Set the working directory for file operations
WORKDIR /data

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command (shows help)
CMD []

