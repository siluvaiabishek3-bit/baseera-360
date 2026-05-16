/**
 * EXIF Metadata Extractor - Uses piexifjs
 * Extracts real capture time from image EXIF data
 */

// @ts-ignore
import piexif from 'piexifjs';

export interface ImageMetadata {
  captureTime: number;
  captureDateString: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  cameraMake?: string;
  cameraModel?: string;
  isThermalCamera: boolean;
  hasCaptureTime: boolean; // Flag to know if real EXIF time was found
}

/**
 * Extract EXIF metadata from JPEG image
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  try {
    console.log(`\n📸 Reading EXIF from: ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const binaryStr = String.fromCharCode.apply(null, Array.from(new Uint8Array(arrayBuffer)));

    const exifData = piexif.load(binaryStr);

    let captureTime = file.lastModified || Date.now();
    let captureDateString = new Date(captureTime).toLocaleString();
    let hasCaptureTime = false;
    let cameraMake = '';
    let cameraModel = '';
    let isThermalCamera = false;

    // ✅ Try DateTimeOriginal (tag 0x9003)
    if (exifData.Exif && exifData.Exif[piexif.ExifIFD.DateTimeOriginal]) {
      const dateStr = exifData.Exif[piexif.ExifIFD.DateTimeOriginal];
      const dateValue = typeof dateStr === 'string' ? dateStr : String.fromCharCode.apply(null, Array.from(new Uint8Array(dateStr)));
      const parsed = parseDateTimeString(dateValue);
      if (parsed > 0) {
        captureTime = parsed;
        captureDateString = new Date(parsed).toLocaleString();
        hasCaptureTime = true;
        console.log(`  ✓ Found DateTimeOriginal: ${captureDateString}`);
      }
    }

    // ✅ Fallback to DateTime (tag 0x0132)
    if (!hasCaptureTime && exifData['0th'] && exifData['0th'][piexif.ImageIFD.DateTime]) {
      const dateStr = exifData['0th'][piexif.ImageIFD.DateTime];
      const dateValue = typeof dateStr === 'string' ? dateStr : String.fromCharCode.apply(null, Array.from(new Uint8Array(dateStr)));
      const parsed = parseDateTimeString(dateValue);
      if (parsed > 0) {
        captureTime = parsed;
        captureDateString = new Date(parsed).toLocaleString();
        hasCaptureTime = true;
        console.log(`  ✓ Found DateTime: ${captureDateString}`);
      }
    }

    if (!hasCaptureTime) {
      console.log(`  ⚠️  No EXIF capture time found, using file modified date`);
    }

    // Extract camera info
    if (exifData['0th'] && exifData['0th'][piexif.ImageIFD.Make]) {
      cameraMake = exifData['0th'][piexif.ImageIFD.Make];
      if (typeof cameraMake !== 'string') {
        cameraMake = String.fromCharCode.apply(null, Array.from(new Uint8Array(cameraMake)));
      }
      cameraMake = cameraMake.trim();
      console.log(`  ✓ Camera Make: ${cameraMake}`);
    }

    if (exifData['0th'] && exifData['0th'][piexif.ImageIFD.Model]) {
      cameraModel = exifData['0th'][piexif.ImageIFD.Model];
      if (typeof cameraModel !== 'string') {
        cameraModel = String.fromCharCode.apply(null, Array.from(new Uint8Array(cameraModel)));
      }
      cameraModel = cameraModel.trim();
      console.log(`  ✓ Camera Model: ${cameraModel}`);
    }

    // Check if thermal
    isThermalCamera =
      cameraMake.toLowerCase().includes('flir') ||
      cameraModel.toLowerCase().includes('flir') ||
      cameraMake.toLowerCase().includes('thermal') ||
      cameraModel.toLowerCase().includes('thermal');

    if (isThermalCamera) {
      console.log(`  🌡️  THERMAL CAMERA DETECTED!`);
    }

    return {
      captureTime,
      captureDateString,
      cameraMake,
      cameraModel,
      isThermalCamera,
      hasCaptureTime,
    };
  } catch (error) {
    console.error(`❌ Error reading EXIF from ${file.name}:`, error);
    return {
      captureTime: file.lastModified || Date.now(),
      captureDateString: new Date(file.lastModified || Date.now()).toLocaleString(),
      isThermalCamera: false,
      hasCaptureTime: false,
    };
  }
}

/**
 * Parse DateTime string (YYYY:MM:DD HH:MM:SS)
 */
function parseDateTimeString(dateStr: string): number {
  try {
    // Handle both string and Uint8Array inputs
    let str = dateStr;
    if (typeof dateStr !== 'string') {
      str = String.fromCharCode.apply(null, Array.from(dateStr as any));
    }

    const match = str.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
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
  return 0;
}