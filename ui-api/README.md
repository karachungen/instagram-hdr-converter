# Instagram HDR Converter - API Version

Convert AVIF HDR images to Instagram-compatible ISO 21496-1 HDR JPEG format using a Nuxt 3 application with Nitro API backend.

## Features

- **AVIF Input Only**: Supports only AVIF HDR images for conversion
- **Server-Side Processing**: Uses Docker container for conversion via Nitro API
- **Instagram-Compatible Output**: Generates HDR JPEG with gain map in ISO 21496-1 format
- **Batch Processing**: Convert multiple files simultaneously
- **Component Extraction**: Displays SDR image and gain map separately
- **Real-time Logs**: View conversion progress and details
- **Modern UI**: Beautiful, responsive interface built with Nuxt UI

## Architecture

### Frontend
- **Framework**: Nuxt 3
- **UI Library**: Nuxt UI (Tailwind CSS + Headless UI)
- **State Management**: Pinia
- **Type Safety**: TypeScript

### Backend
- **API**: Nitro (integrated with Nuxt)
- **Image Processing**: Docker container `karachungen/instagram-hdr-converter`
- **Tools**: libultrahdr (via Docker)

## Prerequisites

- Node.js 18+ and pnpm
- Docker (for image conversion)
- Docker image: `karachungen/instagram-hdr-converter`

## Installation

```bash
# Install dependencies
pnpm install

# Pull Docker image
docker pull karachungen/instagram-hdr-converter
```

## Development

```bash
# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## Production

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## How It Works

### Conversion Pipeline

1. **Upload**: User uploads AVIF HDR images via the web interface
2. **Validation**: Frontend validates that only AVIF files are accepted
3. **API Processing**: 
   - File is sent to `/api/convert` endpoint
   - Nitro server saves file to temporary directory
   - Executes Docker command: `docker run -v $(pwd):/data karachungen/instagram-hdr-converter input.avif`
   - Docker container converts AVIF to Instagram-compatible HDR JPEG
   - Extracts SDR image and gain map using `ultrahdr_app`
4. **Response**: API returns:
   - Converted JPG (Base64)
   - SDR Image (Base64)
   - Gain Map (Base64)
   - HDR Metadata
5. **Display**: Frontend displays comparison and extracted components

### API Endpoint

**POST** `/api/convert`
- Accepts: `multipart/form-data` with AVIF file
- Returns: JSON with `outputJpg`, `sdrImage`, `gainMap`, `metadata`, and `logs`

## Docker Command

The conversion uses this Docker command internally:

```bash
docker run -v /path/to/files:/data karachungen/instagram-hdr-converter input.avif
```

This generates `input_iso.jpg` which contains:
- SDR base image
- Gain map (embedded)
- HDR metadata

To extract components:

```bash
docker run -v /path/to/files:/data karachungen/instagram-hdr-converter ultrahdr_app -m 1 -j input_iso.jpg -z temp.raw -f metadata.cfg
```

## Project Structure

```
ui-api/
├── app.vue                    # Root component
├── pages/
│   └── index.vue              # Main page
├── components/
│   ├── FileUploadSection.vue  # File upload with drag & drop
│   ├── FileListSection.vue    # List of uploaded files
│   ├── ComparisonSection.vue  # Image comparison display
│   ├── ImageComparison.vue    # Individual comparison card
│   ├── ProcessingLogs.vue     # Real-time processing logs
│   ├── ActionsBar.vue         # Process button & controls
│   ├── StatsBar.vue           # File statistics
│   └── ...
├── composables/
│   ├── useFileProcessor.ts    # File handling & API calls
│   └── useKeyboardShortcuts.ts
├── stores/
│   ├── files.ts               # File state management
│   ├── logs.ts                # Logging state
│   └── ui.ts                  # UI state
├── server/
│   └── api/
│       └── convert.post.ts    # Image conversion endpoint
├── types/
│   └── index.ts               # TypeScript definitions
└── nuxt.config.ts             # Nuxt configuration
```

## Configuration

### Runtime Config

Edit `nuxt.config.ts` to configure:

```typescript
runtimeConfig: {
  dockerImage: 'karachungen/instagram-hdr-converter', // Docker image name
  public: {
    apiBase: '/api',
  },
},
```

## Troubleshooting

### Docker Issues

If conversion fails, check:
1. Docker is running: `docker ps`
2. Image is pulled: `docker images | grep instagram-hdr-converter`
3. Container has necessary permissions

### API Errors

Check server logs in the terminal where `pnpm dev` is running.

## Removed Features

This version has removed:
- ❌ WASM support (now uses server-side processing)
- ❌ Client-side HDR processing
- ❌ Custom HDR configuration editor
- ❌ Support for JPG/JXL input (AVIF only)

## License

See main project LICENSE file.
