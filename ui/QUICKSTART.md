# Quick Start Guide

Get the libultrahdr WASM UI up and running in 5 minutes!

## Prerequisites

- **Docker** (recommended) OR **Emscripten SDK** (advanced)
- **Python 3** (for web server)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Step-by-Step

### 1. Navigate to UI Directory

```bash
cd ui
```

### 2. Build WASM Module

**Option A: Using Docker (Easiest)**
```bash
./build-wasm-docker.sh
```

**Option B: Using Local Emscripten**
```bash
# First, install and activate Emscripten (see SETUP.md)
source ~/emsdk/emsdk_env.sh

# Then build
./build-wasm.sh
```

⏱️ **Build time:** ~5-10 minutes depending on your system

### 3. Start Web Server

```bash
python3 -m http.server 8000
```

You should see:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

### 4. Open in Browser

Open your browser and go to:
```
http://localhost:8000/index.html
```

### 5. Test It Out!

1. **Check Status**: Look for green "Ready" badge at the top
2. **Upload Image**: Click upload area or drag & drop an HDR image
3. **Process**: Click "Process Image" button
4. **View Logs**: Check the output log at the bottom

## Success Indicators

✅ Status shows "Ready" (green badge)  
✅ Log says "WASM module loaded successfully!"  
✅ File upload shows file information  
✅ Process button is enabled after upload  

## Common Issues

### Build Failed?
- **Docker not running**: Start Docker Desktop
- **Permission denied**: Run `chmod +x build-wasm-docker.sh`

### WASM Not Loading?
- **Using file:// protocol**: Must use http://localhost
- **CORS errors**: Make sure web server is running
- **Files missing**: Check `ls -la *.wasm *.js`

### Can't Access Localhost?
- **Port already in use**: Try port 8080 instead
  ```bash
  python3 -m http.server 8080
  ```

## What's Happening?

The UI demonstrates:
- ✨ Loading Google's libultrahdr compiled to WebAssembly
- 📦 File handling in WASM filesystem
- 🔄 Processing HDR images in the browser
- 📊 Real-time logging and debugging
- 🎨 XMP metadata support (UHDR_WRITE_XMP=ON)

## Next Steps

- Try different HDR image formats (AVIF, HEIF)
- Explore the WASM filesystem API
- Check browser console for additional debug info
- Integrate with your Instagram HDR workflow

## Need Help?

- 📖 See [SETUP.md](SETUP.md) for detailed instructions
- 🔧 See [README.md](README.md) for technical details
- 🐛 Check browser console for errors
- 💬 Review the output log in the UI

---

**Enjoy testing libultrahdr in your browser! 🚀**

