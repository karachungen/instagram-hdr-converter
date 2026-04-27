# Server Command Setup

This directory requires the following binaries for HDR processing:

## Required Binaries

### 1. `ultrahdr_app` (Required)
The libultrahdr command-line tool is required for:
- Validating JPEG HDR files
- Extracting and re-encoding HDR gain maps

**Build Instructions:**
```bash
# Clone libultrahdr
git clone https://github.com/google/libultrahdr.git
cd libultrahdr

# Build with XMP support
cmake -S. -Bbuild -DUHDR_BUILD_EXAMPLES=1 -DUHDR_WRITE_XMP=1
cmake --build build --config Release

# Copy the binary to this directory
cp build/ultrahdr_app /path/to/ui-api/server/cmd/
```

### 2. ImageMagick `convert` and `cjpeg` (Required)
`convert-to-iso-hdr.sh` uses system **ImageMagick** (`convert`) and **cjpeg** (from libjpeg-turbo) for RAW → JPEG steps. Install via your OS package manager (e.g. `apt install imagemagick libjpeg-turbo-progs` or `brew install imagemagick jpeg-turbo`).

### 3. `exiftool` (Required)
ExifTool is used for extracting gain map metadata.

**Install via Homebrew:**
```bash
brew install exiftool
```

## Validation

To verify your setup:

1. **Check ultrahdr_app:**
   ```bash
   ./ultrahdr_app -h
   ```

2. **Check convert and cjpeg:**
   ```bash
   convert -version
   cjpeg -version
   ```

3. **Check exiftool:**
   ```bash
   exiftool -ver
   ```

## HDR Validation

The validation API endpoint uses `ultrahdr_app -P <image.jpg>` to check if JPEG files contain HDR gain maps:

- **HDR JPEG**: Will output information about the gain map and HDR metadata
- **Non-HDR JPEG**: Will fail or return no HDR information
