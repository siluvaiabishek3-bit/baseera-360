/**
 * EXIF Data Reader & Thermal Image Detection
 * Properly detects FLIR and thermal camera images
 */

interface ExifData {
  captureTime: number; // Unix timestamp
  latitude?: number;
  longitude?: number;
  altitude?: number;
  cameraMake?: string;
  cameraModel?: string;
  filename: string;
  filesize: number;
  hash: string;
  isThermalCamera: boolean; // TRUE only if FLIR or other thermal camera
}

/**
 * Known thermal camera manufacturers and models
 */
const THERMAL_CAMERA_MAKERS = [
  'FLIR Systems AB',
  'FLIR',
  'FLIR Systems',
  'Thermal',
  'Seek',
  'SEEK Thermal',
  'Thermoteknix',
  'InfReC',
  'Testo',
];

const THERMAL_CAMERA_MODELS = [
  'FLIR ONE',
  'FLIR AX',
  'FLIR A',
  'FLIR E',
  'FLIR T',
  'FLIR i',
  'FLIR Ex',
  'Seek Compact',
  'Seek Thermal',
];

/**
 * Extract EXIF data from image file
 * Detects if image is from thermal camera
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const view = new Uint8Array(arrayBuffer);

    // Try to extract EXIF from JPEG
    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      const exif = extractJpegExif(view);
      if (exif) {
        return {
          ...exif,
          filename: file.name,
          filesize: file.size,
          hash: await generateHash(arrayBuffer),
          isThermalCamera: checkIfThermalCamera(exif),
        };
      }
    }

    // Fallback: use file properties only
    return {
      captureTime: file.lastModified || Date.now(),
      filename: file.name,
      filesize: file.size,
      hash: await generateHash(arrayBuffer),
      isThermalCamera: false,
    };
  } catch (error) {
    console.error('Error extracting EXIF:', error);
    return {
      captureTime: Date.now(),
      filename: file.name,
      filesize: file.size,
      hash: '',
      isThermalCamera: false,
    };
  }
}

/**
 * Check if camera is thermal based on manufacturer/model
 */
function checkIfThermalCamera(exif: Partial<ExifData>): boolean {
  const make = (exif.cameraMake || '').toLowerCase();
  const model = (exif.cameraModel || '').toLowerCase();

  // Check if manufacturer is thermal camera brand
  for (const thermalMake of THERMAL_CAMERA_MAKERS) {
    if (make.includes(thermalMake.toLowerCase())) {
      console.log(`✓ Thermal camera detected: ${exif.cameraMake}`);
      return true;
    }
  }

  // Check if model name indicates thermal camera
  for (const thermalModel of THERMAL_CAMERA_MODELS) {
    if (model.includes(thermalModel.toLowerCase())) {
      console.log(`✓ Thermal camera model detected: ${exif.cameraModel}`);
      return true;
    }
  }

  console.log(`✗ NOT a thermal camera: Make=${exif.cameraMake}, Model=${exif.cameraModel}`);
  return false;
}

/**
 * Extract EXIF from JPEG file
 * Reads JPEG markers and EXIF IFD
 */
function extractJpegExif(view: Uint8Array): Partial<ExifData> | null {
  try {
    // Check JPEG SOI marker
    if (view[0] !== 0xff || view[1] !== 0xd8) {
      return null;
    }

    let offset = 2;

    while (offset < view.length) {
      // Find marker
      if (view[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = view[offset + 1];
      offset += 2;

      // APP1 marker (contains EXIF)
      if (marker === 0xe1) {
        const length = (view[offset] << 8) | view[offset + 1];
        const exifStart = offset + 2;

        // Check for "Exif\0\0"
        if (
          view[exifStart] === 0x45 &&
          view[exifStart + 1] === 0x78 &&
          view[exifStart + 2] === 0x69 &&
          view[exifStart + 3] === 0x66
        ) {
          // Parse EXIF IFD
          const ifdOffset = exifStart + 6;
          return parseExifIFD(view, ifdOffset);
        }
      }

      // End of image marker
      if (marker === 0xd9) {
        break;
      }

      // Skip this segment
      const segmentLength = (view[offset] << 8) | view[offset + 1];
      offset += segmentLength;
    }
  } catch (error) {
    console.error('Error parsing JPEG EXIF:', error);
  }

  return null;
}

/**
 * Parse EXIF IFD (Image File Directory)
 */
function parseExifIFD(view: Uint8Array, ifdOffset: number): Partial<ExifData> {
  const result: Partial<ExifData> = {};

  try {
    // Get byte order (little-endian or big-endian)
    const littleEndian = view[ifdOffset] === 0x49 && view[ifdOffset + 1] === 0x49;

    const readUint16 = (offset: number) => {
      if (offset + 1 >= view.length) return 0;
      const byte1 = view[offset];
      const byte2 = view[offset + 1];
      return littleEndian ? (byte2 << 8) | byte1 : (byte1 << 8) | byte2;
    };

    const readUint32 = (offset: number) => {
      if (offset + 3 >= view.length) return 0;
      const val16_1 = readUint16(offset);
      const val16_2 = readUint16(offset + 2);
      return littleEndian ? (val16_2 << 16) | val16_1 : (val16_1 << 16) | val16_2;
    };

    // Read IFD entries
    const numEntries = readUint16(ifdOffset + 2);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 4 + i * 12;
      const tag = readUint16(entryOffset);
      const type = readUint16(entryOffset + 2);
      const count = readUint32(entryOffset + 4);
      const valueOffset = entryOffset + 8;

      // DateTime tag (0x0132)
      if (tag === 0x0132) {
        const dateTimeStr = readAsciiString(view, valueOffset, 19);
        const timestamp = parseDateTimeString(dateTimeStr);
        if (timestamp) {
          result.captureTime = timestamp;
        }
      }

      // DateTimeOriginal tag (0x9003) - more accurate
      if (tag === 0x9003) {
        const dateTimeStr = readAsciiString(view, valueOffset, 19);
        const timestamp = parseDateTimeString(dateTimeStr);
        if (timestamp) {
          result.captureTime = timestamp;
        }
      }

      // Make tag (0x010f) - CAMERA MANUFACTURER
      if (tag === 0x010f) {
        result.cameraMake = readAsciiString(view, valueOffset, count);
      }

      // Model tag (0x0110) - CAMERA MODEL
      if (tag === 0x0110) {
        result.cameraModel = readAsciiString(view, valueOffset, count);
      }

      // GPSInfo tag (0x8825)
      if (tag === 0x8825) {
        const gpsData = parseGPSInfo(view, readUint32(valueOffset), ifdOffset);
        if (gpsData.latitude) result.latitude = gpsData.latitude;
        if (gpsData.longitude) result.longitude = gpsData.longitude;
        if (gpsData.altitude) result.altitude = gpsData.altitude;
      }
    }
  } catch (error) {
    console.error('Error parsing EXIF IFD:', error);
  }

  return result;
}

/**
 * Parse GPS Info IFD
 */
function parseGPSInfo(
  view: Uint8Array,
  gpsIfdOffset: number,
  baseOffset: number
): { latitude?: number; longitude?: number; altitude?: number } {
  const result: { latitude?: number; longitude?: number; altitude?: number } = {};

  try {
    const littleEndian = view[baseOffset] === 0x49;

    const readUint16 = (offset: number) => {
      if (offset + 1 >= view.length) return 0;
      const byte1 = view[offset];
      const byte2 = view[offset + 1];
      return littleEndian ? (byte2 << 8) | byte1 : (byte1 << 8) | byte2;
    };

    const readUint32 = (offset: number) => {
      if (offset + 3 >= view.length) return 0;
      const val16_1 = readUint16(offset);
      const val16_2 = readUint16(offset + 2);
      return littleEndian ? (val16_2 << 16) | val16_1 : (val16_1 << 16) | val16_2;
    };

    const numEntries = readUint16(baseOffset + gpsIfdOffset);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = baseOffset + gpsIfdOffset + 2 + i * 12;
      const tag = readUint16(entryOffset);
      const type = readUint16(entryOffset + 2);
      const count = readUint32(entryOffset + 4);
      const valueOffset = entryOffset + 8;

      // Latitude tag (0x0002)
      if (tag === 0x0002) {
        result.latitude = parseGPSCoordinate(view, baseOffset, valueOffset);
      }

      // Longitude tag (0x0004)
      if (tag === 0x0004) {
        result.longitude = parseGPSCoordinate(view, baseOffset, valueOffset);
      }

      // Altitude tag (0x0006)
      if (tag === 0x0006) {
        result.altitude = parseGPSAltitude(view, baseOffset, valueOffset);
      }
    }
  } catch (error) {
    console.error('Error parsing GPS info:', error);
  }

  return result;
}

/**
 * Parse GPS Coordinate (DMS format)
 */
function parseGPSCoordinate(
  view: Uint8Array,
  baseOffset: number,
  valueOffset: number
): number | undefined {
  try {
    // Simplified implementation
    // In production would parse DMS (Degrees, Minutes, Seconds) properly
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parse GPS Altitude
 */
function parseGPSAltitude(
  view: Uint8Array,
  baseOffset: number,
  valueOffset: number
): number | undefined {
  try {
    // Simplified implementation
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parse EXIF DateTime string (YYYY:MM:DD HH:MM:SS)
 */
function parseDateTimeString(dateStr: string): number | null {
  try {
    // Format: "2026:05:16 14:30:45"
    const match = dateStr.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const date = new Date(
        parseInt(match[1]),
        parseInt(match[2]) - 1,
        parseInt(match[3]),
        parseInt(match[4]),
        parseInt(match[5]),
        parseInt(match[6])
      );
      return date.getTime();
    }
  } catch (error) {
    console.error('Error parsing datetime:', error);
  }
  return null;
}

/**
 * Read ASCII string from view
 */
function readAsciiString(view: Uint8Array, offset: number, length: number): string {
  let result = '';
  for (let i = 0; i < length && offset + i < view.length; i++) {
    const char = view[offset + i];
    if (char === 0) break; // Null terminator
    if (char >= 32 && char <= 126) {
      // Printable ASCII
      result += String.fromCharCode(char);
    }
  }
  return result.trim();
}

/**
 * Generate simple hash of image data
 * Used to detect duplicate uploads
 */
async function generateHash(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Use SubtleCrypto if available
    if (crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.error('Error generating hash:', error);
  }

  // Fallback: simple hash
  const view = new Uint8Array(arrayBuffer);
  let hash = 0;
  for (let i = 0; i < view.length; i += 1000) {
    hash = ((hash << 5) - hash) + view[i];
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Validate if image is actually thermal
 * Only returns true if EXIF confirms it's from a thermal camera
 */
export async function isThermalImage(file: File, declaredType: string): Promise<boolean> {
  // User declared it as thermal - verify with EXIF
  if (declaredType === 'thermal') {
    const exifData = await extractExifData(file);
    const isActuallyThermal = exifData.isThermalCamera;

    console.log(`Image "${file.name}" declared as thermal:`);
    console.log(`  - Camera Make: ${exifData.cameraMake || 'Unknown'}`);
    console.log(`  - Camera Model: ${exifData.cameraModel || 'Unknown'}`);
    console.log(`  - Is Thermal Camera: ${isActuallyThermal}`);

    return isActuallyThermal;
  }

  // Not declared as thermal
  return false;
}