#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Convert to ISO HDR using Docker 🐳
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 🖼️
# @raycast.packageName Utils
# @raycast.description Convert selected Finder files to Instagram-compatible ISO 21496-1 HDR format



set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}➜ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Get current directory from Finder
CURRENT_DIRECTORY="$(osascript -e 'tell application "Finder" to POSIX path of (insertion location as alias)' 2>/dev/null)"

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

DOCKER_IMAGE="karachungen/instagram-hdr-converter"

# Get selected files from Finder using AppleScript
print_info "Getting selected files from Finder..."

SELECTED_FILES=$(osascript -e '
tell application "Finder"
    set selectedItems to selection
    if (count of selectedItems) is 0 then
        return ""
    end if
    set filePaths to {}
    repeat with anItem in selectedItems
        set end of filePaths to POSIX path of (anItem as alias)
    end repeat
    set AppleScript'"'"'s text item delimiters to linefeed
    return filePaths as text
end tell
' 2>/dev/null)

if [ -z "$SELECTED_FILES" ]; then
    print_error "No files selected in Finder"
    echo "Please select one or more image files in Finder and try again."
    exit 1
fi

# Convert to array
IFS=$'\n' read -d '' -r -a FILES_ARRAY <<< "$SELECTED_FILES" || true

FILE_COUNT=${#FILES_ARRAY[@]}
print_success "Found $FILE_COUNT file(s) selected"
echo ""

# Get current date for filename
DATE_SUFFIX=$(date +"%Y%m%d")

# Process each file
SUCCESS_COUNT=0
FAILED_COUNT=0
FAILED_FILES=()

for i in "${!FILES_ARRAY[@]}"; do
    FILE="${FILES_ARRAY[$i]}"
    FILE_NUM=$((i + 1))
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "Processing file $FILE_NUM/$FILE_COUNT"
    echo "Input: $(basename "$FILE")"
    
    # Check if file exists and is a valid image
    if [ ! -f "$FILE" ]; then
        print_warning "File not found, skipping: $FILE"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_FILES+=("$FILE")
        continue
    fi
    
    # Check file extension
    EXT="${FILE##*.}"
    if [[ ! "$EXT" =~ ^(jpg|jpeg|JPG|JPEG)$ ]]; then
        print_warning "Not a JPEG file, skipping: $(basename "$FILE")"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_FILES+=("$FILE")
        continue
    fi
    
    # Check if file is in the current directory or subdirectory
    if [[ "$FILE" != "$CURRENT_DIRECTORY"* ]]; then
        print_warning "File is not in current Finder directory, skipping: $(basename "$FILE")"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_FILES+=("$FILE")
        continue
    fi

    # Convert to relative path from current directory
    RELATIVE_FILE="${FILE#$CURRENT_DIRECTORY}"
    RELATIVE_FILE="${RELATIVE_FILE#/}"  # Remove leading slash if present

    # Generate output filename with date
    FILE_DIR=$(dirname "$FILE")
    FILE_BASE=$(basename "$FILE" .${EXT})
    OUTPUT_FILE="${FILE_DIR}/${FILE_BASE}_${DATE_SUFFIX}_iso.${EXT}"

    # Get relative directory for output
    RELATIVE_DIR=$(dirname "$RELATIVE_FILE")
    if [ "$RELATIVE_DIR" = "." ]; then
        RELATIVE_OUTPUT="${FILE_BASE}_${DATE_SUFFIX}_iso.${EXT}"
    else
        RELATIVE_OUTPUT="${RELATIVE_DIR}/${FILE_BASE}_${DATE_SUFFIX}_iso.${EXT}"
    fi

    print_info "Output: $(basename "$OUTPUT_FILE")"

    # Run converter with docker
    # Mount current directory to /data, pass relative paths
    print_info "Docker: ${RELATIVE_FILE} -> ${RELATIVE_OUTPUT}"

    echo "current directory: ${CURRENT_DIRECTORY}"
    if docker run -v "${CURRENT_DIRECTORY}:/data" "$DOCKER_IMAGE"  "${RELATIVE_FILE}" "${RELATIVE_OUTPUT}"; then
        print_success "Successfully converted!"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        print_error "Conversion failed"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_FILES+=("$FILE")
    fi
    
    echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "SUMMARY"
print_success "Successfully converted: $SUCCESS_COUNT file(s)"

if [ $FAILED_COUNT -gt 0 ]; then
    print_error "Failed: $FAILED_COUNT file(s)"
    echo ""
    print_info "Failed files:"
    for failed_file in "${FAILED_FILES[@]}"; do
        echo "  - $(basename "$failed_file")"
    done
    exit 1
fi

echo ""
print_success "All files processed successfully! 🎉"

