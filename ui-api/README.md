# Instagram HDR Converter - API Version

Convert Lightroom **HDR JPEG** files to Instagram-compatible **ISO 21496-1** HDR JPEG using a Nuxt 3 app with a Nitro API backend.

## Features

- **JPEG input (web)**: The UI accepts HDR JPEG only; files are processed server-side
- **Server-Side Processing**: Docker image / local `convert-to-iso-hdr.sh` and tools in `server/cmd/`
- **Instagram-Compatible Output**: HDR JPEG with gain map in ISO 21496-1 format
- **Batch Processing**: Convert multiple files in one session
- **Component Extraction**: SDR view and gain map in the UI when available
- **Real-time Logs**: Conversion output in the app
- **Modern UI**: Nuxt UI (Tailwind + Headless UI)

## Architecture

### Frontend
- **Framework**: Nuxt 3
- **UI Library**: Nuxt UI
- **State Management**: Pinia
- **Type Safety**: TypeScript

### Backend
- **API**: Nitro
- **Image processing**: `convert-to-iso-hdr.sh` + `ultrahdr_app`, `exiftool`, system `convert` / `cjpeg` (see [server/cmd/SETUP.md](server/cmd/SETUP.md))

## Prerequisites

- Node.js 18+ and pnpm
- For production parity: Docker image `karachungen/instagram-hdr-converter` or local binaries (see [server/cmd/SETUP.md](server/cmd/SETUP.md))

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Open `http://localhost:3000`

## Production

```bash
pnpm build
pnpm preview
```

## How It Works

1. **Upload**: User adds HDR **JPEG** files
2. **Validation**: `POST /api/validate-hdr` checks gain map / HDR using `ultrahdr_app`
3. **Conversion**: `POST /api/convert` runs `convert-to-iso-hdr.sh` on the saved JPEG
4. **Response**: Base64 `outputJpg`, optional `gainMap`, `metadata`, `logs`

### API

**POST** `/api/convert`  
- `multipart/form-data` with a `.jpg` / `.jpeg` file

**POST** `/api/validate-hdr`  
- Same, JPEG only

### Docker (reference)

```bash
docker run -v /path/to/files:/data karachungen/instagram-hdr-converter photo.jpg
```

## Project Structure

```
ui-api/
├── pages/index.vue
├── components/
├── composables/useFileProcessor.ts
├── server/api/convert.post.ts
├── server/api/validate-hdr.post.ts
├── types/index.ts
└── nuxt.config.ts
```

## License

See main project LICENSE.
