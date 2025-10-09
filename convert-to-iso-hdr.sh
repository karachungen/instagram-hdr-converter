#!/bin/bash
# Convert HDR gain map images to Instagram-compatible ISO 21496-1 format

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}Success: $1${NC}"
}

print_info() {
    echo -e "${YELLOW}Info: $1${NC}"
}

check_dependencies() {
    local missing_deps=()
    ! command -v exiftool &> /dev/null && missing_deps+=("exiftool")
    ! command -v ffmpeg &> /dev/null && missing_deps+=("ffmpeg")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo "Install with: brew install ${missing_deps[*]}"
        exit 1
    fi
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS] <input_image.jpg>

Convert HDR gain map images to Instagram-compatible ISO 21496-1 format.

OPTIONS:
    -o, --output <file>     Output filename (default: input_iso.jpg)
    -q, --quality <1-100>   JPEG quality (default: 95)
    -f, --metadata <file>   Custom gain map metadata.cfg (default: hdr-config.cfg)
    -h, --help              Show this help message

EXAMPLES:
    $0 photo.jpg
    $0 -o instagram_ready.jpg -q 98 photo.jpg
    $0 -f custom_metadata.cfg photo.jpg

REQUIREMENTS:
    - exiftool (brew install exiftool)
    - libultrahdr with XMP support UHDR_WRITE_XMP=1
EOF
    exit 0
}

# Parse command line arguments
INPUT_FILE=""
OUTPUT_FILE=""
QUALITY=95
CUSTOM_METADATA=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -q|--quality)
            QUALITY="$2"
            shift 2
            ;;
        -f|--metadata)
            CUSTOM_METADATA="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            if [ -z "$INPUT_FILE" ]; then
                INPUT_FILE="$1"
            else
                print_error "Unknown argument: $1"
                usage
            fi
            shift
            ;;
    esac
done

# Validate input
if [ -z "$INPUT_FILE" ]; then
    print_error "No input file specified"
    usage
fi

if [ ! -f "$INPUT_FILE" ]; then
    print_error "Input file not found: $INPUT_FILE"
    exit 1
fi

# Set default output filename
if [ -z "$OUTPUT_FILE" ]; then
    filename="${INPUT_FILE%.*}"
    extension="${INPUT_FILE##*.}"
    OUTPUT_FILE="${filename}_iso.${extension}"
fi

check_dependencies

print_info "Processing: $INPUT_FILE → $OUTPUT_FILE"

# Create temp directory
INPUT_BASENAME=$(basename "$INPUT_FILE" .jpg)
INPUT_BASENAME=$(basename "$INPUT_BASENAME" .jpeg)
SCRIPT_DIR_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="$SCRIPT_DIR_PATH/temp/$INPUT_BASENAME"
mkdir -p "$TEMP_DIR"
trap "rm -rf $TEMP_DIR" EXIT

print_info "Using temp directory: $TEMP_DIR"

if ! command -v ./ultrahdr_app &> /dev/null; then
    print_error "libultrahdr (ultrahdr_app) not found!"
    echo "Compile with: cmake  -S. -Bbuild -DUHDR_WRITE_XMP=1 and place near script"
    exit 1
fi

IMAGE_WIDTH=$(exiftool -ImageWidth "$INPUT_FILE" 2>/dev/null | grep -oE '[0-9]+$')
IMAGE_HEIGHT=$(exiftool -ImageHeight "$INPUT_FILE" 2>/dev/null | grep -oE '[0-9]+$')

if [ -z "$IMAGE_WIDTH" ] || [ -z "$IMAGE_HEIGHT" ]; then
    print_error "Could not determine image dimensions"
    exit 1
fi

print_info "Image dimensions: ${IMAGE_WIDTH}x${IMAGE_HEIGHT}"

# Decode HDR image to raw and extract metadata
TEMP_HDR_RAW="$TEMP_DIR/hdr_decoded.raw"
INPUT_METADATA="$TEMP_DIR/input_metadata.cfg"

print_info "Decoding HDR and extracting metadata..."

if ./ultrahdr_app -m 1 -j "$INPUT_FILE" -z "$TEMP_HDR_RAW" -o 1 -O 5 -f "$INPUT_METADATA" &> "$TEMP_DIR/decode.log"; then
    print_success "Successfully decoded HDR image"
    
    print_info "Generating SDR version..."
    TEMP_SDR_RAW="$TEMP_DIR/sdr_decoded.raw"
    
    if ./ultrahdr_app -m 1 -j "$INPUT_FILE" -z "$TEMP_SDR_RAW" -o 3 -O 3 &> "$TEMP_DIR/sdr_decode.log"; then
        print_success "Decoded to SDR format"
        
        print_info "Creating 4:2:0 SDR JPEG..."
        TEMP_SDR_420="$TEMP_DIR/sdr_420.jpg"
        FFMPEG_QUALITY=$((31 - (QUALITY * 31 / 100)))
        
        if ffmpeg -f rawvideo -pix_fmt rgba -s "${IMAGE_WIDTH}x${IMAGE_HEIGHT}" -i "$TEMP_SDR_RAW" \
            -pix_fmt yuvj420p -q:v $FFMPEG_QUALITY "$TEMP_SDR_420" -y &> "$TEMP_DIR/sdr_encode.log"; then
            print_success "Created 4:2:0 SDR JPEG"
        else
            print_error "Failed to create 4:2:0 SDR JPEG"
            exit 1
        fi
    else
        print_error "Failed to decode to SDR"
        exit 1
    fi
    
    print_info "Extracting original gain map..."
    TEMP_GAINMAP="$TEMP_DIR/original_gainmap.jpg"
    
    if exiftool -b -MPImage2 "$INPUT_FILE" > "$TEMP_GAINMAP" 2>/dev/null && [ -s "$TEMP_GAINMAP" ]; then
        print_success "Extracted original gain map"
        
        if exiftool -xmp:all= "$TEMP_GAINMAP" -overwrite_original &> "$TEMP_DIR/gainmap_clean.log"; then
            print_success "Cleaned gain map metadata"
        else
            print_error "Failed to clean gain map metadata"
            exit 1
        fi
        
        TEMP_ULTRAHDR_OUTPUT="$TEMP_DIR/ultrahdr_output.jpg"
        
        # Determine which metadata to use
        METADATA_FILE=""
        if [ -n "$CUSTOM_METADATA" ] && [ -f "$CUSTOM_METADATA" ]; then
            METADATA_FILE="$CUSTOM_METADATA"
            print_info "Using custom metadata: $CUSTOM_METADATA"
        else
            INSTAGRAM_METADATA="$SCRIPT_DIR_PATH/hdr-config.cfg"
            if [ -f "$INSTAGRAM_METADATA" ]; then
                METADATA_FILE="$INSTAGRAM_METADATA"
                print_info "Using Instagram metadata: hdr-config.cfg"
            else
                METADATA_FILE="$INPUT_METADATA"
                print_info "Using original metadata"
            fi
        fi
        
        print_info "Re-encoding with API-4 (SDR + gain map + metadata)..."
        
        if ./ultrahdr_app -m 0 \
            -i "$TEMP_SDR_420" \
            -g "$TEMP_GAINMAP" \
            -f "$METADATA_FILE" \
            -z "$TEMP_ULTRAHDR_OUTPUT" &> "$TEMP_DIR/encode.log"; then
            print_success "Successfully re-encoded to Instagram HDR format"
        else
            print_error "Encoding failed"
            print_info "$(cat "$TEMP_DIR/encode.log")"
            exit 1
        fi
        
        if [ ! -f "$TEMP_ULTRAHDR_OUTPUT" ]; then
            print_error "Output file was not created"
            exit 1
        fi
        
        cp "$TEMP_ULTRAHDR_OUTPUT" "$OUTPUT_FILE"
        
        OUTPUT_METADATA="$TEMP_DIR/output_metadata.cfg"
        TEMP_OUTPUT_RAW="$TEMP_DIR/output_decoded.raw"
        
        print_info "Verifying output..."
        ./ultrahdr_app -m 1 -j "$OUTPUT_FILE" -z "$TEMP_OUTPUT_RAW" -o 1 -O 5 -f "$OUTPUT_METADATA" &> "$TEMP_DIR/output_decode.log"
        
        if [ -f "$INPUT_METADATA" ] && [ -f "$OUTPUT_METADATA" ]; then
            IN_MAX=$(grep "maxContentBoost" "$INPUT_METADATA" 2>/dev/null | sed 's/--maxContentBoost //' || echo "N/A")
            OUT_MAX=$(grep "maxContentBoost" "$OUTPUT_METADATA" 2>/dev/null | sed 's/--maxContentBoost //' || echo "N/A")
            IN_HDR_MAX=$(grep "hdrCapacityMax" "$INPUT_METADATA" 2>/dev/null | sed 's/--hdrCapacityMax //' || echo "N/A")
            OUT_HDR_MAX=$(grep "hdrCapacityMax" "$OUTPUT_METADATA" 2>/dev/null | sed 's/--hdrCapacityMax //' || echo "N/A")
            
            if [ "$IN_MAX" != "$OUT_MAX" ] || [ "$IN_HDR_MAX" != "$OUT_HDR_MAX" ]; then
                print_info "Metadata changed: maxContentBoost $IN_MAX → $OUT_MAX, hdrCapacityMax $IN_HDR_MAX → $OUT_HDR_MAX"
            fi
        fi
    fi
else
    print_error "Failed to decode HDR image"
    cat "$TEMP_DIR/decode.log"
    exit 1
fi

OUTPUT_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
print_success "HDR conversion complete!"
echo "Output: $OUTPUT_FILE ($OUTPUT_SIZE)"

