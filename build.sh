#!/bin/bash
# Build script for HDR ISO Converter Docker image

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Building HDR ISO Converter Docker image...${NC}"
docker build -t hdr-iso-converter .

echo -e "${GREEN}✓ Build complete!${NC}"
echo ""
echo "Test the image with:"
echo "  docker run --rm hdr-iso-converter --help"
echo ""
echo "Convert an image:"
echo "  docker run --rm -v \$(pwd):/data hdr-iso-converter input.jpg output.jpg"

