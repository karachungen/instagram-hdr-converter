# Quick Usage Examples

## 1. Build the Image

```bash
cd convert-to-iso-hdr-docker
docker build -t hdr-iso-converter .
```

## 2. Convert a Single Image

### Simple conversion (auto-generates output name):
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter my-photo.jpg
# Output: my-photo_iso.jpg
```

### Specify output filename:
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter input.jpg output.jpg
```

### With custom quality (1-100):
```bash
docker run --rm -v $(pwd):/data hdr-iso-converter -q 98 input.jpg output.jpg
```

## 3. Batch Convert Multiple Images

### Create a simple batch script:
```bash
#!/bin/bash
for img in *.jpg; do
    docker run --rm -v $(pwd):/data hdr-iso-converter "$img"
done
```

Or use the container interactively:
```bash
docker run -it --rm -v $(pwd):/data hdr-iso-converter bash

# Inside container:
for img in *.jpg; do
    convert-to-iso-hdr.sh "$img"
done
```


