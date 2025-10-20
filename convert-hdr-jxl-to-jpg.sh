#!/bin/bash
# Convert HDR AVIF images to HDR JPEG using ImageMagick

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
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local magick_cmd=""
    
    # Check for local magick wrapper first
    if [ -f "$script_dir/magick-wrapper.sh" ]; then
        magick_cmd="$script_dir/magick-wrapper.sh"
        print_info "Using local magick binary with wrapper"
    elif [ -f "$script_dir/magick" ]; then
        magick_cmd="$script_dir/magick"
        # Set library path for local build
        export DYLD_LIBRARY_PATH="$script_dir/local/lib:$DYLD_LIBRARY_PATH"
        print_info "Using local magick binary: $magick_cmd"
    elif command -v magick &> /dev/null; then
        magick_cmd="magick"
        print_info "Using system magick binary"
    else
        print_error "ImageMagick (magick) not found"
        echo "Build it with: ./build-imagemagick-with-uhdr.sh"
        echo "Or install with: brew install imagemagick"
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
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS] <input_image.avif>

Convert HDR AVIF images to HDR JPEG format using ImageMagick with Ultra HDR support.

OPTIONS:
    -o, --output <file>           Output filename (default: input.jpg)
    -t, --transfer <type>         HDR color transfer (default: hlg)
                                  Options: hlg, pq, srgb
    -g, --hdr-gamut <gamut>      HDR color gamut (default: bt2100)
                                  Options: bt2100, p3, bt2020
    -s, --sdr-gamut <gamut>      SDR color gamut (default: bt2100)
                                  Options: bt2100, p3, srgb
    -b, --batch                   Batch process all AVIF files in directory
    -h, --help                    Show this help message

EXAMPLES:
    $0 photo.avif
    $0 -o instagram_ready.jpg photo.avif
    $0 -t pq -g bt2020 photo.avif
    $0 -b *.avif

REQUIREMENTS:
    - ImageMagick with libultrahdr support (brew install imagemagick)

NOTES:
    - HLG (Hybrid Log-Gamma) is commonly used for HDR photos
    - PQ (Perceptual Quantizer) is used for HDR10 video
    - BT.2100 is the ITU-R Recommendation for HDR TV
EOF
    exit 0
}

# Parse command line arguments
INPUT_FILES=()
OUTPUT_FILE=""
TRANSFER="pq"
HDR_GAMUT="bt709"
SDR_GAMUT="bt709"
BATCH_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -t|--transfer)
            TRANSFER="$2"
            shift 2
            ;;
        -g|--hdr-gamut)
            HDR_GAMUT="$2"
            shift 2
            ;;
        -s|--sdr-gamut)
            SDR_GAMUT="$2"
            shift 2
            ;;
        -b|--batch)
            BATCH_MODE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            INPUT_FILES+=("$1")
            shift
            ;;
    esac
done

# Validate input
if [ ${#INPUT_FILES[@]} -eq 0 ]; then
    print_error "No input file specified"
    usage
fi

check_dependencies

# Function to convert a single file
convert_file() {
    local file="$1"
    local output="$2"
    
    if [ ! -f "$file" ]; then
        print_error "Input file not found: $file"
        return 1
    fi
    
    # Set default output filename if not specified
    if [ -z "$output" ]; then
        output="${file%.*}.jpg"
    fi
    
    print_info "Converting: $file → $output"
    print_info "Settings: transfer=$TRANSFER, hdr-gamut=$HDR_GAMUT, sdr-gamut=$SDR_GAMUT"
    
    if $MAGICK_CMD "$file" \
        -define uhdr:hdr-color-transfer="$TRANSFER" \
        -define uhdr:hdr-color-gamut="$HDR_GAMUT" \
        -define uhdr:sdr-color-gamut="$SDR_GAMUT" \
        UHDR:"$output" 2>&1 | tee /tmp/magick_convert.log; then
        
        if [ -f "$output" ]; then
            local output_size=$(ls -lh "$output" | awk '{print $5}')
            print_success "Conversion complete: $output ($output_size)"
            return 0
        else
            print_error "Output file was not created"
            return 1
        fi
    else
        print_error "Conversion failed for $file"
        cat /tmp/magick_convert.log
        return 1
    fi
}

# Process files
if [ "$BATCH_MODE" = true ]; then
    print_info "Batch mode: processing ${#INPUT_FILES[@]} file(s)"
    
    success_count=0
    fail_count=0
    
    for file in "${INPUT_FILES[@]}"; do
        # In batch mode, always auto-generate output filename
        if convert_file "$file" ""; then
            ((success_count++))
        else
            ((fail_count++))
        fi
        echo ""
    done
    
    print_info "Batch complete: $success_count succeeded, $fail_count failed"
    
    if [ $fail_count -gt 0 ]; then
        exit 1
    fi
else
    # Single file mode
    if [ ${#INPUT_FILES[@]} -gt 1 ] && [ -n "$OUTPUT_FILE" ]; then
        print_error "Cannot specify output filename with multiple input files"
        echo "Use --batch mode or process files one at a time"
        exit 1
    fi
    
    for file in "${INPUT_FILES[@]}"; do
        convert_file "$file" "$OUTPUT_FILE"
    done
fi

print_success "All conversions complete!"

