## 📸 How to Upload HDR Photos to Instagram

Follow these steps to upload HDR photos to Instagram through the website:

### 1. Export and Convert HDR Image

Choose one of these methods:

#### Method 1: JXL or AVIF Export (Recommended) ⭐
**HDR version matches the original, SDR fallback may differ from Lightroom preview**

This method prioritizes accurate HDR representation. The HDR version will closely match your original image, but the SDR fallback (shown on non-HDR devices) may not match what you see in Lightroom's SDR preview.

1.1. Export from Lightroom with these settings:
- **Format:** JXL or AVIF
- **Enable HDR Output** ✅
- **Color Space:** HDR sRGB (Rec. 709)
- **Maximize Compatibility:** ❌ Uncheck this option

1.2. Convert to Instagram-compatible format:
```bash
docker run -v $(pwd):/data karachungen/instagram-hdr-converter image-hdr.jxl
```

This will create `image-hdr_iso.jpg` that Instagram can process.

#### Method 2: JPG Export
**SDR version matches Lightroom preview, HDR version may be overexposed**

This method prioritizes SDR compatibility. The SDR version will match what you see in Lightroom's preview, but the HDR version may appear overexposed on HDR-capable devices.

2.1. Export from Lightroom with these settings:
- **Format:** JPEG
- **Enable HDR Output** ✅
- **Color Space:** sRGB (not HDR sRGB)

2.2. Convert to Instagram-compatible format:
```bash
docker run -v $(pwd):/data karachungen/instagram-hdr-converter image-hdr.jpg
```

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
- **ImageMagick with UHDR support** - Image conversion with Ultra HDR capabilities
- **libultrahdr** - Google's Ultra HDR library (built from source with UHDR_WRITE_XMP enabled)
- **convert-to-iso-hdr.sh** - HDR to ISO 21496-1 conversion script
- **JXL, AVIF, and HDR JPEG support** - Automatic format detection and conversion


## Building the Image

```bash
docker build -t hdr-iso-converter .
```

## Quick Start - Convert HDR Images

### Convert JXL to ISO HDR (recommended):
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter photo.jxl
```

### Convert AVIF to ISO HDR:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter photo.avif
```

### Convert HDR JPEG to ISO HDR:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter photo.jpg
```

### Convert with custom output name:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter -o instagram.jpg photo.jxl
```

### Convert with custom quality:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter -q 98 photo.avif
```

### Convert HDR JPEG with custom metadata config:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter -f custom_metadata.cfg photo.jpg
```

**Note:** Custom metadata files only work with HDR JPEG input, not with JXL or AVIF.


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
