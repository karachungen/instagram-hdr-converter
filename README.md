## 📸 How to Upload HDR Photos to Instagram

Follow these steps to upload HDR photos to Instagram through the website:

### 1. Export HDR Image from Lightroom
Export your image in HDR format from Lightroom with these settings:
- **Enable HDR Output** ✅
- **Color Space:** HDR sRGB (Rec. 709)

### 2. Convert HDR to Instagram-Compatible Format
Run the conversion command using the Docker image for quick setup:
```bash
docker run -v $(pwd):/data karachungen/instagram-hdr-converter image-hdr.jpg
```

This will create `image-hdr-iso.jpg` that Instagram can process.

### 3. Upload to Instagram Website
Upload the converted `image-hdr-iso.jpg` through Instagram's website with these important settings:
- **Select Original Ratio** - don't crop the photo
- **Keep photo size within Instagram's supported format** to avoid compression:
  - Square (1:1): 1080 x 1080 pixels
  - Landscape (1.91:1): 1080 x 566 pixels  
  - Portrait (4:5): 1080 x 1350 pixels 
- **Don't apply filters or corrections**
- **Note:** The preview will show as SDR, but after upload completion, it will display as HDR

---

## About This Container

This Docker container includes:
- **exiftool** - For reading and writing image metadata
- **ffmpeg** - Media conversion tool
- **libultrahdr** - Google's Ultra HDR library (built from source with UHDR_WRITE_XMP enabled)
- **convert-to-iso-hdr.sh** - HDR to ISO 21496-1 conversion script


## Building the Image

```bash
docker build -t hdr-iso-converter .
```

## Quick Start - Convert HDR Images

### Convert single image (simplest method):
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter input.jpg output.jpg
```

### Convert with default output name (input_iso.jpg):
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter photo.jpg
```

### Convert with custom quality:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter -q 98 photo.jpg instagram.jpg
```

## Web UI (WASM)

Want to test libultrahdr in your browser? Check out the **[ui/](ui/)** folder!

The UI folder contains a WebAssembly build of libultrahdr with a simple web interface for testing HDR image processing directly in your browser.

**Quick Start:**
```bash
cd ui
./build-wasm-docker.sh
python3 -m http.server 8000
# Open http://localhost:8000/index.html
```

See [ui/QUICKSTART.md](ui/QUICKSTART.md) for details.

---

## Other Tools


### Using ultrahdr_app directly:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter ultrahdr_app -h
```

### Using exiftool:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter exiftool image.jpg
```

### Interactive mode:
```bash
docker run -it --rm -v $(pwd):/data hdr-iso-converter bash
```
