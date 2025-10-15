# UI Project Structure

## 📁 File Organization

```
ui/
├── 📄 index.html                 # Main UI - Beautiful, modern interface
├── 📄 app.js                     # UI Logic - WASM integration & event handlers
├── 📄 build-wasm.sh              # Local build script (requires Emscripten)
├── 📄 build-wasm-docker.sh       # Docker build script (recommended)
├── 🐳 Dockerfile.wasm            # Docker configuration for WASM build
├── 📖 README.md                  # Technical documentation
├── 📖 SETUP.md                   # Detailed setup instructions
├── 📖 QUICKSTART.md              # 5-minute quick start guide
├── 📖 PROJECT_STRUCTURE.md       # This file
└── .gitignore                    # Git ignore patterns

After building:
├── libultrahdr/                  # Cloned source code (gitignored)
├── build/                        # Build directory (gitignored)
├── wasm-output/                  # Installation directory (gitignored)
├── ultrahdr_app.wasm             # Compiled WASM binary (gitignored)
└── ultrahdr_app.js               # WASM loader script (gitignored)
```

## 📝 File Descriptions

### Core Files

**index.html**
- Beautiful gradient UI with modern design
- Drag & drop file upload
- Real-time status indicators
- Live logging console
- Image preview functionality
- Responsive layout

**app.js**
- WASM module initialization
- File handling (upload, drag & drop)
- WASM filesystem operations
- Event handlers for all UI actions
- Logging system with timestamps
- Error handling and status updates

### Build Scripts

**build-wasm.sh**
- Local Emscripten build
- Requires Emscripten SDK installed
- Clones libultrahdr from GitHub
- Configures with CMake
- Enables UHDR_WRITE_XMP flag
- Copies output files

**build-wasm-docker.sh**
- Docker-based build (no local setup needed)
- Uses official emscripten/emsdk image
- Same configuration as local build
- Extracts files from container
- Easier for most users

**Dockerfile.wasm**
- Based on emscripten/emsdk:latest
- Installs dependencies
- Clones and builds libultrahdr
- Configures for WASM target
- Exports necessary files

### Documentation

**QUICKSTART.md**
- Fast 5-minute setup guide
- Docker-first approach
- Common issues & solutions
- Success indicators

**SETUP.md**
- Comprehensive setup guide
- Both Docker and local methods
- Detailed troubleshooting
- Build configuration details
- Testing procedures

**README.md**
- Technical overview
- API documentation
- Feature list
- References

## 🎯 Key Features

### UI Features
✨ **Modern Design**
- Gradient background
- Smooth animations
- Responsive layout
- Professional appearance

📤 **File Upload**
- Click to select
- Drag & drop
- File information display
- Format validation

📊 **Real-time Logging**
- Timestamped entries
- Color-coded by type (info/error/success)
- Auto-scroll
- Clear function

🎨 **Image Preview**
- Display uploaded images
- Native browser rendering
- HDR support (if browser supports)

### WASM Integration
🔧 **Module Loading**
- Emscripten runtime initialization
- Error handling
- Status reporting
- Filesystem API access

📁 **File Operations**
- Write files to WASM FS
- Read from WASM FS
- Directory creation
- Path management

🔄 **Processing**
- Call WASM functions
- Handle results
- Error recovery
- Output capture

## 🏗️ Build Configuration

### CMake Flags
```cmake
-DCMAKE_BUILD_TYPE=Release           # Optimized
-DUHDR_BUILD_EXAMPLES=ON             # Build examples
-DUHDR_BUILD_TESTS=OFF               # Skip tests
-DUHDR_BUILD_BENCHMARK=OFF           # Skip benchmarks
-DUHDR_BUILD_FUZZERS=OFF             # Skip fuzzers
-DUHDR_ENABLE_LOGS=ON                # Enable logging
-DUHDR_WRITE_XMP=ON                  # Enable XMP ✅
```

### Emscripten Flags (Optional)
```javascript
-s EXPORTED_FUNCTIONS='[_main]'
-s EXPORTED_RUNTIME_METHODS='[FS,callMain]'
-s ALLOW_MEMORY_GROWTH=1
-s MODULARIZE=1
-s EXPORT_NAME='UltraHDRModule'
```

## 🔄 Workflow

### Build Process
1. Clone libultrahdr → 
2. Configure with CMake → 
3. Build with Emscripten → 
4. Generate .wasm and .js files → 
5. Copy to ui directory

### Runtime Process
1. Load index.html in browser → 
2. Initialize WASM module → 
3. User uploads HDR image → 
4. Write to WASM filesystem → 
5. Process with libultrahdr → 
6. Display results

## 📦 Dependencies

### Build Time
- **Emscripten SDK** - WASM compiler toolchain
- **CMake** - Build system
- **Git** - Source code management
- **Docker** (optional) - Containerized builds

### Runtime
- **Modern Browser** - Chrome, Firefox, Safari, Edge
- **Web Server** - Python SimpleHTTPServer or similar
- **No external libraries** - Everything bundled in WASM

## 🎓 Learning Resources

### libultrahdr
- [GitHub Repository](https://github.com/google/libultrahdr)
- [Building Documentation](https://github.com/google/libultrahdr/blob/main/docs/building.md)
- [API Reference](https://github.com/google/libultrahdr/blob/main/ultrahdr_api.h)

### Ultra HDR Format
- [Android HDR Image Format Guide](https://developer.android.com/guide/topics/media/platform/hdr-image-format)
- [ISO 21496-1 Standard](https://www.iso.org/standard/71250.html)

### WebAssembly
- [Emscripten Documentation](https://emscripten.org/docs/getting_started/index.html)
- [WebAssembly.org](https://webassembly.org/)
- [MDN WebAssembly Guide](https://developer.mozilla.org/en-US/docs/WebAssembly)

### Related
- [Instagram HDR Converter](../README.md)
- [AVIF Format](https://en.wikipedia.org/wiki/AVIF)
- [HEIF Format](https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format)

## 🚀 Usage Patterns

### Basic Test
```javascript
1. Upload HDR image
2. Click "Process Image"
3. View logs
4. Check output
```

### Development
```javascript
1. Modify app.js
2. Refresh browser
3. Test changes
4. Check console
```

### Debugging
```javascript
1. Open DevTools (F12)
2. Check Console tab
3. Monitor Network tab
4. Review WASM logs
```

## 🤝 Contributing

To extend this UI:

1. **Add Features** - Edit app.js and index.html
2. **Improve Build** - Modify build scripts
3. **Add Tests** - Create test suite
4. **Update Docs** - Keep documentation current

## 📋 TODO / Future Enhancements

- [ ] Add support for batch processing
- [ ] Implement file download functionality
- [ ] Show detailed image metadata
- [ ] Add quality slider for encoding
- [ ] Support for different output formats
- [ ] Progress indicators for long operations
- [ ] Image comparison view (before/after)
- [ ] XMP metadata viewer
- [ ] Integration tests
- [ ] Performance benchmarks

## 📄 License

This UI is part of the Instagram HDR Converter project. libultrahdr is licensed under Apache 2.0.

---

**Built with ❤️ for HDR photography workflows**

