# libultrahdr WASM UI

This is a simple web interface for testing Google's libultrahdr library compiled to WebAssembly.

## Prerequisites

1. **Emscripten SDK** - Required for building to WASM
   ```bash
   # Install Emscripten
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. **CMake** - Required for building
   ```bash
   # macOS
   brew install cmake
   
   # Linux
   sudo apt-get install cmake
   ```

## Building

1. Make sure Emscripten is activated in your shell:
   ```bash
   source /path/to/emsdk/emsdk_env.sh
   ```

2. Run the build script:
   ```bash
   cd ui
   chmod +x build-wasm.sh
   ./build-wasm.sh
   ```

   This will:
   - Clone libultrahdr from GitHub
   - Configure CMake with WASM target
   - Enable UHDR_WRITE_XMP flag
   - Build the library and examples
   - Copy WASM files to the ui directory

## Running the UI

1. Start a local web server (required for loading WASM):
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Or using Python 2
   python -m SimpleHTTPServer 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000/index.html
   ```

## Usage

1. **Upload Image**: Click the upload area or drag & drop an HDR image file
2. **Process Image**: Click "Process Image" to test WASM processing
3. **Decode HDR**: Click "Decode HDR" to preview the image in browser
4. **View Logs**: Check the output log for detailed information

## Features

- ✅ Beautiful, modern UI
- ✅ Drag & drop file upload
- ✅ File information display
- ✅ Real-time logging
- ✅ Image preview
- ✅ WASM module integration
- ✅ XMP metadata support (UHDR_WRITE_XMP enabled)

## Technical Details

### Build Configuration

The WASM build is configured with:
- `UHDR_BUILD_EXAMPLES=ON` - Builds example applications
- `UHDR_ENABLE_LOGS=ON` - Enables logging
- `UHDR_WRITE_XMP=ON` - **Enables XMP metadata writing**
- `CMAKE_BUILD_TYPE=Release` - Optimized release build

### WASM Module Interface

The compiled WASM module provides:
- Filesystem API (`Module.FS`) for file operations
- Standard I/O capture (`print`, `printErr`)
- ultrahdr_app binary for HDR processing

## Troubleshooting

### "emcc: command not found"
Make sure Emscripten is installed and activated:
```bash
source /path/to/emsdk/emsdk_env.sh
```

### WASM files not found
Check that the build completed successfully and WASM files are in the ui directory:
```bash
ls -la ui/*.wasm ui/*.js
```

### Cannot load WASM module
Make sure you're using a web server (not file:// protocol):
```bash
python3 -m http.server 8000
```

## References

- [libultrahdr GitHub](https://github.com/google/libultrahdr)
- [libultrahdr Building Docs](https://github.com/google/libultrahdr/blob/main/docs/building.md)
- [Emscripten Documentation](https://emscripten.org/docs/getting_started/index.html)
- [Ultra HDR Format Guide](https://developer.android.com/guide/topics/media/platform/hdr-image-format)

