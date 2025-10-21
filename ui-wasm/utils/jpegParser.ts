/**
 * JPEG Binary Parser
 * Parses JPEG structure to extract gain map from UltraHDR images
 *
 * UltraHDR uses Multi-Picture Format (MPF) to store:
 * - Primary Image: Base SDR JPEG
 * - Secondary Image: Gain Map JPEG (in MPF APP2 marker)
 */

/**
 * JPEG Marker Codes
 */
const JPEG_MARKERS = {
  SOI: 0xFFD8, // Start of Image
  EOI: 0xFFD9, // End of Image
  APP0: 0xFFE0, // JFIF
  APP1: 0xFFE1, // EXIF
  APP2: 0xFFE2, // MPF (Multi-Picture Format)
  SOS: 0xFFDA, // Start of Scan (image data follows)
} as const

/**
 * Parse JPEG markers and find specific marker type
 */
interface JpegMarker {
  type: number
  offset: number
  length: number
  dataOffset: number
}

/**
 * Find all markers in JPEG file
 */
function parseJpegMarkers(buffer: ArrayBuffer): JpegMarker[] {
  const view = new DataView(buffer)
  const markers: JpegMarker[] = []
  let offset = 0

  // Check for JPEG SOI marker (0xFFD8)
  if (view.getUint16(0, false) !== JPEG_MARKERS.SOI) {
    console.error('[JPEG Parser] Not a valid JPEG file')
    return []
  }

  offset = 2 // Skip SOI

  while (offset < buffer.byteLength - 1) {
    // Find next marker (0xFF)
    if (view.getUint8(offset) !== 0xFF) {
      offset++
      continue
    }

    // Skip padding bytes (0xFF can be repeated)
    while (offset < buffer.byteLength && view.getUint8(offset) === 0xFF) {
      offset++
    }

    if (offset >= buffer.byteLength)
      break

    const markerCode = view.getUint8(offset)
    const markerType = (0xFF << 8) | markerCode

    // Some markers don't have length field
    if (markerCode === 0x00 || markerCode === 0x01 || (markerCode >= 0xD0 && markerCode <= 0xD9)) {
      offset++
      continue
    }

    // SOS marker - image data follows, skip to end
    if (markerType === JPEG_MARKERS.SOS) {
      markers.push({
        type: markerType,
        offset: offset - 1,
        length: 0,
        dataOffset: offset + 1,
      })
      break // Stop parsing, image data follows
    }

    // Read length (big-endian, includes the 2 length bytes)
    if (offset + 2 < buffer.byteLength) {
      const length = view.getUint16(offset + 1, false)

      markers.push({
        type: markerType,
        offset: offset - 1,
        length,
        dataOffset: offset + 3, // After marker + length bytes
      })

      offset += 1 + length // Skip past this marker
    }
    else {
      break
    }
  }

  return markers
}

/**
 * Find MPF (Multi-Picture Format) APP2 marker
 */
function findMpfMarker(markers: JpegMarker[], buffer: ArrayBuffer): JpegMarker | null {
  const view = new DataView(buffer)

  for (const marker of markers) {
    if (marker.type === JPEG_MARKERS.APP2 && marker.length > 4) {
      // Check for "MPF\0" signature
      const signature = String.fromCharCode(
        view.getUint8(marker.dataOffset),
        view.getUint8(marker.dataOffset + 1),
        view.getUint8(marker.dataOffset + 2),
        view.getUint8(marker.dataOffset + 3),
      )

      if (signature === 'MPF\0') {
        console.log('[JPEG Parser] Found MPF marker at offset:', marker.offset)
        return marker
      }
    }
  }

  return null
}

/**
 * Parse MPF structure to get secondary image offset
 * MPF format reference: CIPA DC-007-2009 (Multi-Picture Format)
 */
interface MpfImageEntry {
  offset: number
  size: number
  type: number
}

function parseMpfData(buffer: ArrayBuffer, mpfMarker: JpegMarker): MpfImageEntry[] {
  const view = new DataView(buffer)
  const mpfDataStart = mpfMarker.dataOffset + 4 // Skip "MPF\0"

  // MPF structure (simplified):
  // Byte Order (2 bytes): 0x4D4D (big-endian) or 0x4949 (little-endian)
  const byteOrder = view.getUint16(mpfDataStart, false)
  const isBigEndian = byteOrder === 0x4D4D

  console.log('[MPF Parser] Byte order:', isBigEndian ? 'big-endian' : 'little-endian')

  // Skip to IFD (offset is at mpfDataStart + 4)
  const ifdOffset = view.getUint32(mpfDataStart + 4, !isBigEndian)
  const ifdStart = mpfDataStart + ifdOffset

  // Read number of directory entries
  const numEntries = view.getUint16(ifdStart, !isBigEndian)
  console.log('[MPF Parser] Number of IFD entries:', numEntries)

  let mpImageListOffset = 0
  let mpImageListCount = 0

  // Parse IFD entries to find MP Image List
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdStart + 2 + i * 12
    const tag = view.getUint16(entryOffset, !isBigEndian)
    const _type = view.getUint16(entryOffset + 2, !isBigEndian)
    const count = view.getUint32(entryOffset + 4, !isBigEndian)
    const valueOffset = view.getUint32(entryOffset + 8, !isBigEndian)

    // Tag 0xB002 = MP Image List
    if (tag === 0xB002) {
      mpImageListOffset = mpfDataStart + valueOffset
      mpImageListCount = count / 16 // Each entry is 16 bytes
      console.log('[MPF Parser] Found MP Image List: count=', mpImageListCount, 'offset=', mpImageListOffset)
      break
    }
  }

  if (!mpImageListOffset) {
    console.error('[MPF Parser] MP Image List not found')
    return []
  }

  // Parse MP Image List entries
  const images: MpfImageEntry[] = []

  for (let i = 0; i < mpImageListCount; i++) {
    const entryOffset = mpImageListOffset + i * 16

    const imageAttr = view.getUint32(entryOffset, !isBigEndian)
    const imageSize = view.getUint32(entryOffset + 4, !isBigEndian)
    const imageOffset = view.getUint32(entryOffset + 8, !isBigEndian)
    // Dependent images fields at +12, +14 (not needed for extraction)

    images.push({
      type: imageAttr,
      size: imageSize,
      offset: imageOffset,
    })

    console.log(`[MPF Parser] Image ${i}: offset=${imageOffset}, size=${imageSize}`)
  }

  return images
}

/**
 * Extract gain map JPEG from UltraHDR image
 * Returns the gain map as a separate JPEG file (Uint8Array)
 */
export function extractGainMapJpeg(jpegData: Uint8Array): Uint8Array | null {
  try {
    console.log('[JPEG Parser] Starting gain map extraction...')
    console.log('[JPEG Parser] Input size:', jpegData.length, 'bytes')

    // Create proper ArrayBuffer from Uint8Array
    const buffer = new Uint8Array(jpegData).buffer

    // Parse all JPEG markers
    const markers = parseJpegMarkers(buffer)
    console.log('[JPEG Parser] Found', markers.length, 'markers')

    // Find MPF marker
    const mpfMarker = findMpfMarker(markers, buffer)
    if (!mpfMarker) {
      console.log('[JPEG Parser] No MPF marker found - not an UltraHDR image')
      return null
    }

    // Parse MPF data to get image entries
    const images = parseMpfData(buffer, mpfMarker)

    if (images.length < 2) {
      console.log('[JPEG Parser] MPF found but no secondary image')
      return null
    }

    // Second image is the gain map
    const gainMapEntry = images[1]

    if (!gainMapEntry) {
      console.error('[JPEG Parser] Gain map entry is undefined')
      return null
    }

    console.log('[JPEG Parser] Gain map found at offset:', gainMapEntry.offset, 'size:', gainMapEntry.size)

    // Calculate absolute offset
    // MPF offsets are relative to the start of the file
    let absoluteOffset = gainMapEntry.offset

    // If offset is 0, it means "after the primary image"
    if (absoluteOffset === 0) {
      // Find end of primary image (find EOI marker or SOS marker end)
      const sosMarker = markers.find(m => m.type === JPEG_MARKERS.SOS)
      if (sosMarker) {
        // Scan from SOS to find EOI (0xFFD9)
        const view = new DataView(buffer)
        for (let i = sosMarker.dataOffset; i < buffer.byteLength - 1; i++) {
          if (view.getUint16(i, false) === JPEG_MARKERS.EOI) {
            absoluteOffset = i + 2 // After EOI
            console.log('[JPEG Parser] Gain map starts after EOI at:', absoluteOffset)
            break
          }
        }
      }
    }
    else {
      // Offset is relative to the start of the file
      // This is the correct interpretation according to MPF spec
      absoluteOffset = gainMapEntry.offset
      console.log('[JPEG Parser] Gain map absolute offset:', absoluteOffset)

      // Verify that this offset points to a JPEG SOI marker
      const view = new DataView(buffer)
      const soiAtOffset = view.getUint16(absoluteOffset, false)
      if (soiAtOffset !== JPEG_MARKERS.SOI) {
        console.log('[JPEG Parser] Offset does not point to JPEG SOI, trying to find next SOI...')

        // Look for the next JPEG SOI marker after this offset
        for (let i = absoluteOffset; i < buffer.byteLength - 1; i++) {
          if (view.getUint16(i, false) === JPEG_MARKERS.SOI) {
            absoluteOffset = i
            console.log('[JPEG Parser] Found JPEG SOI at offset:', absoluteOffset)
            break
          }
        }
      }
    }

    // Extract gain map JPEG
    const gainMapData = new Uint8Array(buffer, absoluteOffset, gainMapEntry.size)

    // Verify it's a valid JPEG (starts with 0xFFD8)
    const view = new DataView(gainMapData.buffer, gainMapData.byteOffset, gainMapData.byteLength)
    if (view.getUint16(0, false) !== JPEG_MARKERS.SOI) {
      console.error('[JPEG Parser] Extracted data is not a valid JPEG')
      return null
    }

    console.log('[JPEG Parser] ✓ Successfully extracted gain map:', gainMapData.length, 'bytes')
    return gainMapData
  }
  catch (error) {
    console.error('[JPEG Parser] Error extracting gain map:', error)
    return null
  }
}

/**
 * Extract gain map and create blob URL for display
 */
export function extractGainMapUrl(jpegData: Uint8Array): string | null {
  const gainMapData = extractGainMapJpeg(jpegData)

  if (!gainMapData) {
    return null
  }

  try {
    const blob = new Blob([gainMapData as BlobPart], { type: 'image/jpeg' })
    const url = URL.createObjectURL(blob)
    console.log('[JPEG Parser] ✓ Created gain map blob URL')
    return url
  }
  catch (error) {
    console.error('[JPEG Parser] Failed to create blob URL:', error)
    return null
  }
}

/**
 * Extract base SDR JPEG from UltraHDR image
 * Extracts the primary image without gain map
 */
export function extractBaseSdrJpeg(jpegData: Uint8Array): Uint8Array | null {
  try {
    console.log('[JPEG Parser] Extracting base SDR JPEG...')

    const buffer = new Uint8Array(jpegData).buffer

    // Parse all JPEG markers
    const markers = parseJpegMarkers(buffer)

    // Find MPF marker
    const mpfMarker = findMpfMarker(markers, buffer)
    if (!mpfMarker) {
      console.log('[JPEG Parser] No MPF marker - returning original as SDR')
      return jpegData
    }

    // Parse MPF to get images
    const images = parseMpfData(buffer, mpfMarker)

    if (images.length < 1) {
      return jpegData
    }

    // First image is the base SDR
    const baseSdrEntry = images[0]

    if (!baseSdrEntry) {
      return jpegData
    }

    // If offset is 0, it's the current image (from start to where gain map begins)
    if (baseSdrEntry.offset === 0) {
      // Extract from start to where gain map begins
      if (images.length >= 2 && images[1]) {
        const gainMapStart = images[1].offset

        // Find the actual start of gain map (JPEG SOI)
        let actualGainMapStart = gainMapStart
        const view = new DataView(buffer)
        const soiAtOffset = view.getUint16(gainMapStart, false)
        if (soiAtOffset !== JPEG_MARKERS.SOI) {
          // Look for the next JPEG SOI marker after this offset
          for (let i = gainMapStart; i < buffer.byteLength - 1; i++) {
            if (view.getUint16(i, false) === JPEG_MARKERS.SOI) {
              actualGainMapStart = i
              break
            }
          }
        }

        const baseSdrData = new Uint8Array(buffer, 0, actualGainMapStart)
        console.log('[JPEG Parser] ✓ Extracted base SDR JPEG:', baseSdrData.length, 'bytes')
        return baseSdrData
      }

      // Otherwise return original
      return jpegData
    }

    console.log('[JPEG Parser] Base SDR at offset:', baseSdrEntry.offset, 'size:', baseSdrEntry.size)
    const baseSdrData = new Uint8Array(buffer, baseSdrEntry.offset, baseSdrEntry.size)

    console.log('[JPEG Parser] ✓ Extracted base SDR JPEG:', baseSdrData.length, 'bytes')
    return baseSdrData
  }
  catch (error) {
    console.error('[JPEG Parser] Error extracting base SDR:', error)
    return null
  }
}
