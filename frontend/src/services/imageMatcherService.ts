/**
 * Image Matcher Service
 * Detects duplicate/similar images and groups them into pairs
 * Uses multiple matching strategies:
 * 1. Perceptual hashing (pHash) - matches same scene in different formats
 * 2. EXIF data matching - same timestamp
 * 3. Filename similarity
 * 4. Geo-location matching
 */

interface ImageFingerprint {
  mediaId: string;
  hash: string;
  dhash: string; // Difference hash - more robust for different formats
  width: number;
  height: number;
  timestamp: number;
  filename: string;
  type: 'rgb' | 'thermal' | 'zoom';
  geoX: number;
  geoY: number;
  geoZ: number;
}

/**
 * Calculate perceptual hash (pHash) of image
 * Uses DCT (Discrete Cosine Transform) concept
 * Returns hash that's similar for same image in different formats
 */
export async function calculateImageHash(imageData: string): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Resize to small size (8x8) for hashing
    canvas.width = 8;
    canvas.height = 8;

    const img = new Image();
    img.src = imageData;

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 8, 8);
        const imageData_pixels = ctx.getImageData(0, 0, 8, 8);
        const data = imageData_pixels.data;

        // Convert to grayscale and calculate average
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          sum += gray;
        }
        const avg = sum / 16;

        // Create hash (1 = above avg, 0 = below avg)
        let hash = '';
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          hash += gray > avg ? '1' : '0';
        }

        // Convert binary to hex
        let hex = '';
        for (let i = 0; i < hash.length; i += 4) {
          const chunk = hash.substring(i, i + 4);
          hex += parseInt(chunk, 2).toString(16);
        }

        resolve(hex);
      };

      img.onerror = () => resolve('');
    });
  } catch (error) {
    console.error('Error calculating image hash:', error);
    return '';
  }
}

/**
 * Calculate difference hash (dHash)
 * More robust than pHash for different image formats
 */
export async function calculateDifferenceHash(imageData: string): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 8x9 for difference calculation
    canvas.width = 9;
    canvas.height = 8;

    const img = new Image();
    img.src = imageData;

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 9, 8);
        const imageData_pixels = ctx.getImageData(0, 0, 9, 8);
        const data = imageData_pixels.data;

        let hash = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const idx1 = (row * 9 + col) * 4;
            const idx2 = (row * 9 + col + 1) * 4;

            const gray1 = data[idx1] * 0.299 + data[idx1 + 1] * 0.587 + data[idx1 + 2] * 0.114;
            const gray2 = data[idx2] * 0.299 + data[idx2 + 1] * 0.587 + data[idx2 + 2] * 0.114;

            hash += gray1 > gray2 ? '1' : '0';
          }
        }

        // Convert binary to hex
        let hex = '';
        for (let i = 0; i < hash.length; i += 4) {
          const chunk = hash.substring(i, i + 4);
          hex += parseInt(chunk, 2).toString(16);
        }

        resolve(hex);
      };

      img.onerror = () => resolve('');
    });
  } catch (error) {
    console.error('Error calculating difference hash:', error);
    return '';
  }
}

/**
 * Calculate Hamming distance between two hashes
 * Lower distance = more similar
 */
function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  const minLen = Math.min(hash1.length, hash2.length);

  for (let i = 0; i < minLen; i++) {
    const bin1 = parseInt(hash1[i], 16).toString(2).padStart(4, '0');
    const bin2 = parseInt(hash2[i], 16).toString(2).padStart(4, '0');

    for (let j = 0; j < 4; j++) {
      if (bin1[j] !== bin2[j]) distance++;
    }
  }

  return distance;
}

/**
 * Check if two hashes are similar (within threshold)
 * Threshold = 5 means up to 5 bits difference out of 64
 */
export function areSimilarHashes(hash1: string, hash2: string, threshold: number = 5): boolean {
  const distance = hammingDistance(hash1, hash2);
  return distance <= threshold;
}

/**
 * Calculate filename similarity
 * Removes extensions and common prefixes
 */
export function calculateFilenameSimilarity(filename1: string, filename2: string): number {
  // Remove extensions
  const base1 = filename1.replace(/\.[^.]+$/, '').toLowerCase();
  const base2 = filename2.replace(/\.[^.]+$/, '').toLowerCase();

  // Exact match
  if (base1 === base2) return 1.0;

  // Remove common drone naming patterns
  const clean1 = base1.replace(/[_-]?(rgb|thermal|zoom|ir|visible)/i, '');
  const clean2 = base2.replace(/[_-]?(rgb|thermal|zoom|ir|visible)/i, '');

  if (clean1 === clean2) return 0.9;

  // Levenshtein distance
  const distance = levenshteinDistance(base1, base2);
  const maxLen = Math.max(base1.length, base2.length);

  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Levenshtein distance - string similarity
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate geo-location similarity (within X meters)
 */
export function areGeoLocationsSimilar(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  thresholdMeters: number = 100
): boolean {
  // Simple distance approximation (good enough for building facades)
  const latDiff = Math.abs(lat1 - lat2) * 111000; // ~111km per degree
  const lonDiff = Math.abs(lon1 - lon2) * 111000 * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

  return distance <= thresholdMeters;
}

/**
 * Match images into pairs based on multiple criteria
 * Returns pairs where RGB, Thermal, and Zoom are grouped together
 */
export async function matchImagesIntoPairs(
  media: any[],
  projectId: string,
  phase: string,
  floor: string
): Promise<any[]> {
  try {
    // Filter media for this phase/floor
    const mediaItems = media.filter(
      (m) => m.projectId === projectId && m.phase === phase && m.floor === floor
    );

    console.log(`\n=== IMAGE MATCHING FOR ${phase} - ${floor} ===`);
    console.log(`Total media items: ${mediaItems.length}`);

    // Calculate fingerprints for all images
    const fingerprints: ImageFingerprint[] = [];

    for (const item of mediaItems) {
      const dhash = await calculateDifferenceHash(item.imageData);
      const hash = await calculateImageHash(item.imageData);

      fingerprints.push({
        mediaId: item.id,
        hash,
        dhash,
        width: item.width || 0,
        height: item.height || 0,
        timestamp: item.timestamp,
        filename: item.filename || item.id,
        type: item.type,
        geoX: item.geoTag?.x || 0,
        geoY: item.geoTag?.y || 0,
        geoZ: item.geoTag?.z || 0,
      });

      console.log(`📷 ${item.filename || item.id} (${item.type}): dhash=${dhash.substring(0, 8)}...`);
    }

    // Group similar images
    const groups: Map<number, ImageFingerprint[]> = new Map();
    const processed = new Set<string>();

    for (let i = 0; i < fingerprints.length; i++) {
      if (processed.has(fingerprints[i].mediaId)) continue;

      const group: ImageFingerprint[] = [fingerprints[i]];
      processed.add(fingerprints[i].mediaId);

      // Find similar images
      for (let j = i + 1; j < fingerprints.length; j++) {
        if (processed.has(fingerprints[j].mediaId)) continue;

        const fp1 = fingerprints[i];
        const fp2 = fingerprints[j];

        // Matching criteria (any one being true = same pair)
        const dHashSimilar = areSimilarHashes(fp1.dhash, fp2.dhash, 5);
        const pHashSimilar = areSimilarHashes(fp1.hash, fp2.hash, 5);
        const filenameSimilar = calculateFilenameSimilarity(fp1.filename, fp2.filename) > 0.7;
        const geoSimilar = areGeoLocationsSimilar(fp1.geoX, fp1.geoY, fp2.geoX, fp2.geoY, 100);
        const timeSimilar = Math.abs(fp1.timestamp - fp2.timestamp) < 5000; // Within 5 seconds

        const isMatch = dHashSimilar || pHashSimilar || filenameSimilar || geoSimilar || timeSimilar;

        if (isMatch) {
          group.push(fp2);
          processed.add(fp2.mediaId);
          console.log(
            `  ✓ Matched: ${fp2.filename} (dhash=${dHashSimilar}, phash=${pHashSimilar}, filename=${filenameSimilar}, geo=${geoSimilar}, time=${timeSimilar})`
          );
        }
      }

      groups.set(i, group);
    }

    // Convert groups to pairs with type mapping
    const pairs: any[] = [];

    for (const group of groups.values()) {
      // Group by type
      const typeMap = new Map<string, any>();

      for (const fp of group) {
        const mediaItem = mediaItems.find((m) => m.id === fp.mediaId);
        if (mediaItem) {
          typeMap.set(fp.type, mediaItem);
        }
      }

      // Create pair object
      const pair = {
        id: `pair-${Date.now()}-${Math.random()}`,
        timestamp: group[0].timestamp,
        rgb: typeMap.get('rgb') || null,
        thermal: typeMap.get('thermal') || null,
        zoom: typeMap.get('zoom') || null,
      };

      pairs.push(pair);

      console.log(
        `\n📦 Pair created: RGB=${!!pair.rgb} Thermal=${!!pair.thermal} Zoom=${!!pair.zoom}`
      );
      if (pair.rgb) console.log(`   📷 RGB: ${pair.rgb.filename}`);
      if (pair.thermal) console.log(`   🌡️  Thermal: ${pair.thermal.filename}`);
      if (pair.zoom) console.log(`   🔍 Zoom: ${pair.zoom.filename}`);
    }

    // Sort pairs by timestamp
    pairs.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`\n✓ Total pairs created: ${pairs.length}\n`);

    return pairs;
  } catch (error) {
    console.error('Error matching images:', error);
    return [];
  }
}