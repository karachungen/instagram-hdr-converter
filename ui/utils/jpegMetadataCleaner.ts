/**
 * JPEG Marker constants
 */
const JPEG_MARKERS = {
  SOI: 0xFFD8, // Start of Image
  EOI: 0xFFD9, // End of Image
  SOS: 0xFFDA, // Start of Scan
  APP1: 0xFFE1, // Application Segment 1 (EXIF, XMP)
}

/**
 * Remove XMP metadata from JPEG
 * Strips APP1 segments containing XMP data
 */
export function removeXmpMetadata(jpegData: Uint8Array): Uint8Array {
  const buffer = new Uint8Array(jpegData).buffer
  const view = new DataView(buffer)

  // Check for JPEG SOI marker
  if (view.getUint16(0, false) !== JPEG_MARKERS.SOI) {
    throw new Error('Not a valid JPEG file')
  }

  const segments: Uint8Array[] = []
  let offset = 0

  // Add SOI marker
  segments.push(new Uint8Array([0xFF, 0xD8]))
  offset = 2

  // Parse and filter segments
  while (offset < buffer.byteLength - 1) {
    // Find next marker
    if (view.getUint8(offset) !== 0xFF) {
      offset++
      continue
    }

    // Skip padding bytes
    while (offset < buffer.byteLength && view.getUint8(offset) === 0xFF) {
      offset++
    }

    if (offset >= buffer.byteLength)
      break

    const markerCode = view.getUint8(offset)
    const markerType = (0xFF << 8) | markerCode

    // Handle markers without length
    if (markerCode === 0x00 || markerCode === 0x01
      || (markerCode >= 0xD0 && markerCode <= 0xD9)) {
      offset++
      continue
    }

    // SOS marker - rest is image data, copy everything
    if (markerType === JPEG_MARKERS.SOS) {
      segments.push(new Uint8Array(buffer, offset - 1))
      break
    }

    // Read segment length
    if (offset + 2 >= buffer.byteLength)
      break

    const length = view.getUint16(offset + 1, false)
    const segmentStart = offset - 1 // Include 0xFF
    const segmentEnd = offset + 1 + length

    // Check if this is an APP1 segment with XMP
    let isXmp = false
    if (markerType === JPEG_MARKERS.APP1 && offset + 3 + 28 < buffer.byteLength) {
      // Check for XMP identifier: "http://ns.adobe.com/xap/1.0/\0"
      const identifier = new Uint8Array(buffer, offset + 3, 28)
      const xmpSignature = 'http://ns.adobe.com/xap/1.0/'
      let matches = true
      for (let i = 0; i < 28; i++) {
        if (i < xmpSignature.length) {
          if (identifier[i] !== xmpSignature.charCodeAt(i)) {
            matches = false
            break
          }
        }
        else if (identifier[i] !== 0) {
          matches = false
          break
        }
      }
      isXmp = matches
    }

    // Copy segment if it's not XMP
    if (!isXmp) {
      segments.push(new Uint8Array(buffer, segmentStart, segmentEnd - segmentStart))
    }
    else {
      console.log('[Metadata Cleaner] Removed XMP segment at offset:', segmentStart)
    }

    offset = segmentEnd
  }

  // Combine all segments
  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0)
  const result = new Uint8Array(totalLength)
  let resultOffset = 0

  for (const segment of segments) {
    result.set(segment, resultOffset)
    resultOffset += segment.length
  }

  return result
}
