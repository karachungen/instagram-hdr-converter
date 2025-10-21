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

    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo "Install with: brew install ${missing_deps[*]}"
        exit 1
    fi
}

check_magick_for_conversion() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local magick_cmd="./magick"

    # Check for local built magick only
    if [ -f "$script_dir/magick" ]; then
        # Set library path for local build
        export DYLD_LIBRARY_PATH="$script_dir/local/lib:$DYLD_LIBRARY_PATH"
        print_info "Using local magick binary: $magick_cmd"
    else
        print_error "Local ImageMagick (magick) not found at: $script_dir/magick"
        echo "Build it with: ./build-imagemagick-with-uhdr.sh"
        exit 1
    fi

    # Export for use in other functions
    export MAGICK_CMD="$magick_cmd"

    # Check if ImageMagick has UHDR support
    if ! $magick_cmd -list configure 2>&1 | grep -q "DELEGATES.*uhdr"; then
        print_error "ImageMagick does not have UHDR support enabled"
        echo "Build it with: ./build-imagemagick-with-uhdr.sh"
        exit 1
    fi

    print_success "ImageMagick with UHDR support found"
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS] <input_image.jpg|input_image.jxl|input_image.avif>

Convert HDR images to Instagram-compatible ISO 21496-1 format.
Supports HDR JPEG (with gain map), JXL, and AVIF input formats.

OPTIONS:
    -o, --output <file>     Output filename (default: input_iso.jpg)
    -q, --quality <1-100>   JPEG quality (default: 95)
    -f, --metadata <file>   Custom gain map metadata.cfg (default: hdr-config.cfg)
    -h, --help              Show this help message

EXAMPLES:
    $0 photo.jpg                              # Convert HDR JPG to ISO HDR
    $0 photo.jxl                              # Convert JXL to ISO HDR
    $0 photo.avif                             # Convert AVIF to ISO HDR
    $0 -o instagram_ready.jpg -q 98 photo.jpg
    $0 -f custom_metadata.cfg photo.jxl

REQUIREMENTS:
    - exiftool (brew install exiftool)
    - libultrahdr with XMP support UHDR_WRITE_XMP=1
    - ImageMagick with UHDR support (for JXL/AVIF conversion)
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
    # Always output as .jpg, even for .jxl inputs
    OUTPUT_FILE="${filename}_iso.jpg"
fi

check_dependencies

# Detect file type and handle JXL conversion if needed
FILE_EXT="${INPUT_FILE##*.}"
FILE_EXT_LOWER=$(echo "$FILE_EXT" | tr '[:upper:]' '[:lower:]')
SCRIPT_DIR_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create base temp directory
INPUT_BASENAME=$(basename "$INPUT_FILE" ".$FILE_EXT")
TEMP_DIR="$SCRIPT_DIR_PATH/temp/$INPUT_BASENAME"
mkdir -p "$TEMP_DIR"
trap "rm -rf $TEMP_DIR" EXIT

print_info "Using temp directory: $TEMP_DIR"

# If input is JXL or AVIF, convert to intermediate HDR JPG first
PROCESSING_FILE="$INPUT_FILE"
if [ "$FILE_EXT_LOWER" = "jxl" ] || [ "$FILE_EXT_LOWER" = "avif" ]; then
    print_info "Detected $FILE_EXT_LOWER input, converting to intermediate HDR JPG..."
    check_magick_for_conversion

    INTERMEDIATE_HDR="$TEMP_DIR/intermediate_hdr.jpg"
    TRANSFER="pq"
    HDR_GAMUT="bt709"
    SDR_GAMUT="bt709"

    print_info "Settings: transfer=$TRANSFER, hdr-gamut=$HDR_GAMUT, sdr-gamut=$SDR_GAMUT"

    if $MAGICK_CMD "$INPUT_FILE" \
        -define uhdr:hdr-color-transfer="$TRANSFER" \
        -define uhdr:hdr-color-gamut="$HDR_GAMUT" \
        -define uhdr:sdr-color-gamut="$SDR_GAMUT" \
        UHDR:"$INTERMEDIATE_HDR" 2>&1 | tee "$TEMP_DIR/format_convert.log"; then

        if [ -f "$INTERMEDIATE_HDR" ]; then
            print_success "$FILE_EXT_LOWER converted to intermediate HDR JPG"
            PROCESSING_FILE="$INTERMEDIATE_HDR"
        else
            print_error "Intermediate HDR JPG was not created"
            cat "$TEMP_DIR/format_convert.log"
            exit 1
        fi
    else
        print_error "$FILE_EXT_LOWER to HDR JPG conversion failed"
        cat "$TEMP_DIR/format_convert.log"
        exit 1
    fi
elif [ "$FILE_EXT_LOWER" != "jpg" ] && [ "$FILE_EXT_LOWER" != "jpeg" ]; then
    print_error "Unsupported file format: .$FILE_EXT"
    echo "Supported formats: .jpg, .jpeg, .jxl, .avif"
    exit 1
fi

print_info "Processing: $INPUT_FILE → $OUTPUT_FILE"

# Check for local ultrahdr_app binary
ULTRAHDR_APP="./ultrahdr_app"
if [ ! -f "$SCRIPT_DIR_PATH/ultrahdr_app" ]; then
    print_error "libultrahdr (ultrahdr_app) not found at: $SCRIPT_DIR_PATH/ultrahdr_app"
    echo "Compile with: cmake -S. -Bbuild -DUHDR_WRITE_XMP=1 and place near script"
    exit 1
fi
print_info "Using local ultrahdr_app binary: $ULTRAHDR_APP"

IMAGE_WIDTH=$(exiftool -ImageWidth "$PROCESSING_FILE" 2>/dev/null | grep -oE '[0-9]+$')
IMAGE_HEIGHT=$(exiftool -ImageHeight "$PROCESSING_FILE" 2>/dev/null | grep -oE '[0-9]+$')

if [ -z "$IMAGE_WIDTH" ] || [ -z "$IMAGE_HEIGHT" ]; then
    print_error "Could not determine image dimensions"
    exit 1
fi

print_info "Image dimensions: ${IMAGE_WIDTH}x${IMAGE_HEIGHT}"

# Decode HDR image to raw and extract metadata
TEMP_HDR_RAW="$TEMP_DIR/hdr_decoded.raw"
INPUT_METADATA="$TEMP_DIR/input_metadata.cfg"

print_info "Decoding HDR and extracting metadata..."

if $ULTRAHDR_APP -m 1 -j "$PROCESSING_FILE" -z "$TEMP_HDR_RAW" -o 1 -O 5 -f "$INPUT_METADATA" &> "$TEMP_DIR/decode.log"; then
    print_success "Successfully decoded HDR image"

    print_info "Generating SDR version..."
    TEMP_SDR_RAW="$TEMP_DIR/sdr_decoded.raw"

    if $ULTRAHDR_APP -m 1 -j "$PROCESSING_FILE" -z "$TEMP_SDR_RAW" -o 3 -O 3 &> "$TEMP_DIR/sdr_decode.log"; then
        print_success "Decoded to SDR format"


        # Step 3: Create 4:2:0 compressed SDR JPEG using cjpeg
            print_info "Compressing SDR with YCbCr 4:2:0 subsampling (Instagram format)..."

            TEMP_SDR_420="$TEMP_DIR/sdr_420.jpg"

            # Convert RAW to PPM first, then compress with cjpeg
            # RGBA8888 format: 4 bytes per pixel
            if command -v convert &> /dev/null; then
                # Use ImageMagick to convert raw to temp format, then cjpeg for 4:2:0
                convert -size ${IMAGE_WIDTH}x${IMAGE_HEIGHT} -depth 8 rgba:"$TEMP_SDR_RAW" \
                    -colorspace sRGB \
                    -quality 100 \
                    ppm:- 2>/dev/null | \
                cjpeg -quality 100 -sample 2x2 -progressive -optimize > "$TEMP_SDR_420" 2>/dev/null

                if [ $? -eq 0 ] && [ -s "$TEMP_SDR_420" ]; then
                    print_success "Created 4:2:0 SDR base image"
                else
                    print_error "Failed to create 4:2:0 SDR image"
                    exit 1
                fi
            else
                print_error "ImageMagick not found, cannot convert RAW format"
            exit 1
        fi
    else
        print_error "Failed to decode to SDR"
        exit 1
    fi

    print_info "Extracting original gain map..."
    TEMP_GAINMAP="$TEMP_DIR/original_gainmap.jpg"

    if exiftool -b -MPImage2 "$PROCESSING_FILE" > "$TEMP_GAINMAP" 2>/dev/null && [ -s "$TEMP_GAINMAP" ]; then
        print_success "Extracted original gain map"

        if exiftool -xmp:all= "$TEMP_GAINMAP" -overwrite_original &> "$TEMP_DIR/gainmap_clean.log"; then
            print_success "Cleaned gain map metadata"
        else
            print_error "Failed to clean gain map metadata"
            exit 1
        fi

        # Re-compress gain map with 4:2:0 YCbCr subsampling
        print_info "Re-compressing gain map with YCbCr 4:2:0 subsampling..."

        GAINMAP_WIDTH=$(exiftool -ImageWidth "$TEMP_GAINMAP" 2>/dev/null | grep -oE '[0-9]+$')
        GAINMAP_HEIGHT=$(exiftool -ImageHeight "$TEMP_GAINMAP" 2>/dev/null | grep -oE '[0-9]+$')

        if [ -z "$GAINMAP_WIDTH" ] || [ -z "$GAINMAP_HEIGHT" ]; then
            print_error "Could not determine gain map dimensions"
            exit 1
        fi

        print_info "Gain map dimensions: ${GAINMAP_WIDTH}x${GAINMAP_HEIGHT}"

        TEMP_GAINMAP_420="$TEMP_DIR/gainmap_420.jpg"

        if command -v convert &> /dev/null; then
            # Convert JPEG gain map to PPM, then compress with 4:2:0 subsampling
            convert "$TEMP_GAINMAP" ppm:- 2>/dev/null | \
            cjpeg -quality 100 -sample 2x2 -progressive -optimize > "$TEMP_GAINMAP_420" 2>/dev/null

            if [ $? -eq 0 ] && [ -s "$TEMP_GAINMAP_420" ]; then
                print_success "Created 4:2:0 gain map"
            else
                print_error "Failed to create 4:2:0 gain map"
                exit 1
            fi
        else
            print_error "ImageMagick not found, cannot convert gain map"
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

        if $ULTRAHDR_APP -m 0 \
            -i "$TEMP_SDR_420" \
            -g "$TEMP_GAINMAP_420" \
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
        $ULTRAHDR_APP -m 1 -j "$OUTPUT_FILE" -z "$TEMP_OUTPUT_RAW" -o 1 -O 5 -f "$OUTPUT_METADATA" &> "$TEMP_DIR/output_decode.log"

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

