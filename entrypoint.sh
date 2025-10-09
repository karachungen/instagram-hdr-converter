#!/bin/bash
set -e

# Entrypoint script for HDR ISO conversion
# Usage: docker run hdr-iso-converter input.jpg output.jpg
#        docker run hdr-iso-converter convert input.jpg output.jpg

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_info() {
    echo -e "${YELLOW}$1${NC}"
}

# If no arguments, show usage
if [ $# -eq 0 ]; then
    cat << 'EOF'
HDR ISO Converter Docker Container

USAGE:
  # Convert single image
  docker run -v $(pwd):/data hdr-iso-converter input.jpg output.jpg
  
  # Convert with default output name (input_iso.jpg)
  docker run -v $(pwd):/data hdr-iso-converter input.jpg
  
  # Convert with quality setting
  docker run -v $(pwd):/data hdr-iso-converter -q 98 input.jpg output.jpg
  
  # Run other tools
  docker run -v $(pwd):/data hdr-iso-converter exiftool image.jpg
  docker run -v $(pwd):/data hdr-iso-converter ultrahdr_app -h
  
  # Interactive shell
  docker run -it -v $(pwd):/data hdr-iso-converter bash

AVAILABLE TOOLS:
  - ultrahdr_app    : Google's Ultra HDR tool
  - exiftool        : Image metadata tool
  - ffmpeg          : Media conversion tool
  - convert-to-iso-hdr.sh : Full conversion script
EOF
    exit 0
fi

# Handle special commands
case "$1" in
    bash|sh|/bin/bash|/bin/sh)
        exec "$@"
        ;;
    exiftool|ultrahdr_app|ffmpeg)
        exec "$@"
        ;;
    convert-to-iso-hdr.sh)
        shift
        exec /usr/local/bin/convert-to-iso-hdr.sh "$@"
        ;;
    -h|--help|help)
        /usr/local/bin/convert-to-iso-hdr.sh --help
        exit 0
        ;;
esac

# Parse conversion arguments
INPUT_FILE=""
OUTPUT_FILE=""
QUALITY=95
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -q|--quality)
            QUALITY="$2"
            EXTRA_ARGS+=("-q" "$2")
            shift 2
            ;;
        -f|--metadata)
            EXTRA_ARGS+=("-f" "$2")
            shift 2
            ;;
        convert)
            # Skip 'convert' keyword if present
            shift
            ;;
        *)
            if [ -z "$INPUT_FILE" ]; then
                INPUT_FILE="$1"
            elif [ -z "$OUTPUT_FILE" ]; then
                OUTPUT_FILE="$1"
            else
                print_error "Too many arguments"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate input
if [ -z "$INPUT_FILE" ]; then
    print_error "No input file specified"
    exit 1
fi

# Check if input file exists
if [ ! -f "/data/$INPUT_FILE" ]; then
    print_error "Input file not found: $INPUT_FILE"
    print_info "Make sure to mount your files: docker run -v \$(pwd):/data ..."
    exit 1
fi

# Build conversion command
cd /data

if [ -n "$OUTPUT_FILE" ]; then
    EXTRA_ARGS+=("-o" "$OUTPUT_FILE")
fi

print_info "Converting: $INPUT_FILE → ${OUTPUT_FILE:-${INPUT_FILE%.*}_iso.jpg}"
exec /usr/local/bin/convert-to-iso-hdr.sh "${EXTRA_ARGS[@]}" "$INPUT_FILE"

