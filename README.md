# HDR ISO Conversion Docker Container

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
