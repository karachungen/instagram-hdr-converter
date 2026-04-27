## 📸 How to Upload HDR Photos to Instagram

Follow these steps to upload HDR photos to Instagram through the website:

### 1. Export and Convert HDR Image

Export from Lightroom as **HDR JPEG**, then convert with Docker or the web app.

1.1. Export from Lightroom with these settings:
- **Format:** JPEG
- **Enable HDR Output** ✅
- **Color Space:** sRGB (not HDR sRGB)

1.2. Convert to Instagram-compatible format:
```bash
docker run -v $(pwd):/data karachungen/instagram-hdr-converter image-hdr.jpg
```

This will create `image-hdr_iso.jpg` that Instagram can process.

### 2. Upload to Instagram Website
Upload the converted `image-hdr_iso.jpg` through Instagram's website with these important settings:
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
- **ImageMagick** - Provides `convert` for intermediate image steps in the conversion script
- **libultrahdr** - Google's Ultra HDR library (built from source with UHDR_WRITE_XMP enabled)
- **convert-to-iso-hdr.sh** - HDR JPEG to ISO 21496-1 conversion script
- **HDR JPEG input** - JPEG with Ultra HDR / gain map (e.g. Lightroom HDR export)


## Building the Image

```bash
docker build -t hdr-iso-converter .
```

## Quick Start - Convert HDR JPEG

### Convert HDR JPEG to ISO HDR:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter photo.jpg
```

### Convert with custom output name:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter -o instagram.jpg photo.jpg
```

### Convert with custom quality:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter -q 98 photo.jpg
```

### Convert HDR JPEG with custom metadata config:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter -f custom_metadata.cfg photo.jpg
```


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
