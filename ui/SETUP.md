# Setup Guide - libultrahdr WASM Build

This guide provides step-by-step instructions for building libultrahdr to WebAssembly with XMP support enabled.

## Quick Start with Docker (Recommended)

If you have Docker installed, this is the easiest method:

```bash
cd ui
chmod +x build-wasm-docker.sh
./build-wasm-docker.sh
```

This will:
1. Build a Docker container with Emscripten
2. Compile libultrahdr to WASM with UHDR_WRITE_XMP=ON
3. Extract the WASM files to the ui directory

Then start the web server:
```bash
python3 -m http.server 8000
```

Open http://localhost:8000/index.html in your browser.

---

## Method 1: Local Build with Emscripten

### Step 1: Install Emscripten SDK

```bash
# Clone the Emscripten SDK
cd ~
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate the latest version
./emsdk install latest
./emsdk activate latest

# Add to your shell profile for persistence
echo 'source "~/emsdk/emsdk_env.sh"' >> ~/.zshrc  # or ~/.bashrc for bash
```

### Step 2: Activate Emscripten in Your Current Shell

```bash
source ~/emsdk/emsdk_env.sh
```

Verify installation:
```bash
emcc --version
```

You should see something like:
```
emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 3.x.x
```

### Step 3: Install CMake (if not already installed)

**macOS:**
```bash
brew install cmake
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install cmake build-essential
```

### Step 4: Build libultrahdr to WASM

```bash
cd ui
./build-wasm.sh
```

This script will:
1. Clone libultrahdr from GitHub
2. Configure with CMake using Emscripten toolchain
3. Enable UHDR_WRITE_XMP flag
4. Build the library and examples
5. Copy WASM files to the ui directory

### Step 5: Start Web Server

```bash
# Option 1: Python 3
python3 -m http.server 8000

# Option 2: Python 2
python -m SimpleHTTPServer 8000

# Option 3: Node.js
npx http-server -p 8000
```

### Step 6: Open in Browser

Navigate to: http://localhost:8000/index.html

---

## Method 2: Docker Build (Alternative)

If you prefer using Docker and have it installed:

### Build with Docker

```bash
cd ui
chmod +x build-wasm-docker.sh
./build-wasm-docker.sh
```

### What This Does

The Docker method:
1. Uses the official `emscripten/emsdk` image
2. Clones and builds libultrahdr inside the container
3. Extracts the compiled WASM files to your local directory
4. No need to install Emscripten locally

---

## Build Configuration

The WASM build uses these CMake flags:

```cmake
-DCMAKE_BUILD_TYPE=Release           # Optimized build
-DUHDR_BUILD_EXAMPLES=ON             # Build example apps
-DUHDR_BUILD_TESTS=OFF               # Skip tests
-DUHDR_BUILD_BENCHMARK=OFF           # Skip benchmarks
-DUHDR_BUILD_FUZZERS=OFF             # Skip fuzzers
-DUHDR_ENABLE_LOGS=ON                # Enable logging
-DUHDR_WRITE_XMP=ON                  # Enable XMP metadata (REQUIRED)
```

The `UHDR_WRITE_XMP=ON` flag is critical for Instagram HDR compatibility!

---

## Verifying the Build

After building, you should have these files in the `ui/` directory:

```
ui/
├── ultrahdr_app.wasm     # WASM binary
├── ultrahdr_app.js       # JS loader
├── index.html            # UI
├── app.js                # UI logic
└── README.md             # Documentation
```

Check the files:
```bash
ls -lh ui/*.wasm ui/*.js
```

---

## Testing the UI

1. **Start the server**
   ```bash
   cd ui
   python3 -m http.server 8000
   ```

2. **Open browser**
   Navigate to: http://localhost:8000/index.html

3. **Check the status**
   - The status indicator should show "Ready" (green)
   - The log should say "WASM module loaded successfully!"

4. **Test with an image**
   - Click the upload area or drag & drop an HDR image
   - Click "Process Image" to test WASM processing
   - Click "Decode HDR" to preview the image
   - Check the output log for detailed information

---

## Troubleshooting

### "emcc: command not found"

**Solution:** Activate Emscripten in your shell:
```bash
source ~/emsdk/emsdk_env.sh
```

### "WASM module not loaded"

**Possible causes:**
1. Build didn't complete successfully
2. WASM files not in the right directory
3. Not using a web server (file:// protocol won't work)

**Solution:**
```bash
# Check if WASM files exist
ls -la ui/*.wasm ui/*.js

# Make sure you're using a web server
cd ui
python3 -m http.server 8000
```

### "Cannot load WASM module" in browser

**Solution:** Always use a web server, not file:// protocol:
```bash
python3 -m http.server 8000
```

### Build fails with CMake errors

**Solution:** Make sure you have CMake installed and Emscripten activated:
```bash
cmake --version
emcc --version
```

### Docker build fails

**Solution:** Make sure Docker is running:
```bash
docker ps
```

---

## Next Steps

Once you have the WASM module running:

1. **Test with HDR images** - Upload images exported from Lightroom with HDR enabled
2. **Check XMP metadata** - Verify that UHDR_WRITE_XMP is working
3. **Integrate with your workflow** - Use this for Instagram HDR conversion
4. **Explore the API** - Check `ultrahdr_api.h` in libultrahdr for more functions

---

## Resources

- [libultrahdr Repository](https://github.com/google/libultrahdr)
- [libultrahdr Building Docs](https://github.com/google/libultrahdr/blob/main/docs/building.md)
- [Emscripten Documentation](https://emscripten.org/docs/getting_started/index.html)
- [Ultra HDR Format Guide](https://developer.android.com/guide/topics/media/platform/hdr-image-format)
- [Instagram HDR Converter Project](../README.md)

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the build logs carefully
3. Ensure all prerequisites are installed
4. Try the Docker method if local build fails

