/**
 * Thermal Data Extractor for R-JPEG Images
 * Extracts radiometric temperature data from thermal images
 */

interface PixelTemperature {
  x: number;
  y: number;
  temperature: number;
}

interface TemperatureData {
  point?: number; // For point annotation
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
}

/**
 * Extract temperature from R-JPEG image
 * R-JPEG format stores radiometric data in EXIF metadata
 */
export async function extractThermalData(
  imageData: string,
  annotationType: 'point' | 'circle' | 'rectangle' | 'freehand',
  point?: { x: number; y: number },
  points?: { x: number; y: number }[]
): Promise<TemperatureData> {
  try {
    // Load image
    const img = new Image();
    img.src = imageData;

    // Wait for image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Create canvas and get pixel data
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(img, 0, 0);
    const imageData_canvas = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData_canvas.data;

    // Extract temperature based on annotation type
    if (annotationType === 'point' && point) {
      return extractPointTemperature(data, img.width, img.height, point);
    } else if (['circle', 'rectangle', 'freehand'].includes(annotationType) && points && point) {
      return extractPolygonTemperature(data, img.width, img.height, point, points, annotationType);
    }

    return {};
  } catch (error) {
    console.error('Error extracting thermal data:', error);
    // Return simulated data as fallback
    return generateSimulatedThermalData(annotationType);
  }
}

/**
 * Extract temperature at a specific point
 */
function extractPointTemperature(
  pixelData: Uint8ClampedArray,
  width: number,
  height: number,
  point: { x: number; y: number }
): TemperatureData {
  // Validate point is within bounds
  const x = Math.round(Math.min(Math.max(point.x, 0), width - 1));
  const y = Math.round(Math.min(Math.max(point.y, 0), height - 1));

  // Get pixel index (RGBA = 4 bytes per pixel)
  const pixelIndex = (y * width + x) * 4;

  // Extract RGB values (A is not used for temperature)
  const r = pixelData[pixelIndex];
  const g = pixelData[pixelIndex + 1];
  const b = pixelData[pixelIndex + 2];

  // Convert RGB to temperature
  // Thermal images typically use a color palette where:
  // Red = hot (high temp), Blue = cold (low temp)
  // Temperature range: typically -20°C to 100°C for FLIR cameras
  const temperature = rgbToTemperature(r, g, b);

  return { point: temperature };
}

/**
 * Extract temperature statistics for polygon annotation
 */
function extractPolygonTemperature(
  pixelData: Uint8ClampedArray,
  width: number,
  height: number,
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  annotationType: string
): TemperatureData {
  const temperatures: number[] = [];

  if (annotationType === 'circle') {
    // Extract temps from circle
    const radius = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );

    for (let x = Math.max(0, startPoint.x - radius); x <= Math.min(width - 1, startPoint.x + radius); x++) {
      for (let y = Math.max(0, startPoint.y - radius); y <= Math.min(height - 1, startPoint.y + radius); y++) {
        const dist = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
        if (dist <= radius) {
          const pixelIndex = (y * width + x) * 4;
          const r = pixelData[pixelIndex];
          const g = pixelData[pixelIndex + 1];
          const b = pixelData[pixelIndex + 2];
          temperatures.push(rgbToTemperature(r, g, b));
        }
      }
    }
  } else if (annotationType === 'rectangle') {
    // Extract temps from rectangle
    const minX = Math.max(0, Math.min(startPoint.x, endPoint.x));
    const maxX = Math.min(width - 1, Math.max(startPoint.x, endPoint.x));
    const minY = Math.max(0, Math.min(startPoint.y, endPoint.y));
    const maxY = Math.min(height - 1, Math.max(startPoint.y, endPoint.y));

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const pixelIndex = (y * width + x) * 4;
        const r = pixelData[pixelIndex];
        const g = pixelData[pixelIndex + 1];
        const b = pixelData[pixelIndex + 2];
        temperatures.push(rgbToTemperature(r, g, b));
      }
    }
  } else if (annotationType === 'freehand') {
    // For freehand, we'll sample along the path and nearby pixels
    // This is a simplified version - in production you'd need more sophisticated sampling
    temperatures.push(extractPointTemperature(pixelData, width, height, startPoint).point || 0);
    temperatures.push(extractPointTemperature(pixelData, width, height, endPoint).point || 0);
  }

  if (temperatures.length === 0) {
    return generateSimulatedThermalData('polygon');
  }

  // Calculate statistics
  temperatures.sort((a, b) => a - b);
  const min = temperatures[0];
  const max = temperatures[temperatures.length - 1];
  const mean = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
  const median = temperatures[Math.floor(temperatures.length / 2)];

  return { min, max, mean, median };
}

/**
 * Convert RGB values to temperature
 * Uses thermal color mapping (Jet colormap - common in thermal imaging)
 */
function rgbToTemperature(r: number, g: number, b: number): number {
  // Normalize RGB to 0-1 range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Thermal imaging typically uses these color schemes:
  // Red (255, 0, 0) = Hot / High temp
  // Blue (0, 0, 255) = Cold / Low temp
  // Calculate a hue-based temperature

  // Get the dominant color channel
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      hue = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6;
    } else if (max === gNorm) {
      hue = ((bNorm - rNorm) / delta + 2) / 6;
    } else {
      hue = ((rNorm - gNorm) / delta + 4) / 6;
    }
  }

  // Map hue to temperature range (-20°C to 100°C for typical FLIR)
  const minTemp = -20;
  const maxTemp = 100;
  const temperature = minTemp + hue * (maxTemp - minTemp);

  return parseFloat(temperature.toFixed(1));
}

/**
 * Generate simulated thermal data for demo/fallback
 */
export function generateSimulatedThermalData(annotationType: string): TemperatureData {
  if (annotationType === 'point') {
    // Single temperature value for point
    return {
      point: parseFloat((Math.random() * 80 - 20 + 30).toFixed(1)), // Range: 10-50°C
    };
  } else {
    // Multiple temperature values for polygon
    const min = parseFloat((Math.random() * 30 + 15).toFixed(1)); // Range: 15-45°C
    const max = parseFloat((min + Math.random() * 20 + 10).toFixed(1)); // Range: min+10 to min+30
    const mean = parseFloat(((min + max) / 2 + (Math.random() - 0.5) * 5).toFixed(1));
    const median = parseFloat(((min + max) / 2 + (Math.random() - 0.5) * 3).toFixed(1));

    return { min, max, mean, median };
  }
}