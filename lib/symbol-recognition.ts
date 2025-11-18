// Advanced symbol recognition for matrix reasoning puzzles

export interface SymbolAnalysis {
  shape: 'Triangle' | 'Circle' | 'Square' | 'Cross' | 'Line' | 'Unknown';
  color: 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Black' | 'White' | 'Unknown';
  count: number;
  rotation: 0 | 45 | 90 | 135;
  confidence: number;
  isTarget: boolean;
  isEmpty: boolean;
}

/**
 * Analyze a cell image and extract symbol properties
 */
export async function analyzeCell(cellCanvas: HTMLCanvasElement): Promise<SymbolAnalysis> {
  const ctx = cellCanvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, cellCanvas.width, cellCanvas.height);

  // Extract color information
  const colorInfo = analyzeColor(imageData);

  // Detect shapes and count
  const shapeInfo = detectShapes(imageData, cellCanvas.width, cellCanvas.height);

  // Determine if target cell (has question mark or is empty)
  const isTarget = detectTarget(imageData, cellCanvas.width, cellCanvas.height);

  // Calculate overall confidence
  const confidence = (shapeInfo.confidence + colorInfo.confidence) / 2;

  return {
    shape: shapeInfo.shape,
    color: colorInfo.color,
    count: shapeInfo.count,
    rotation: shapeInfo.rotation,
    confidence,
    isTarget,
    isEmpty: shapeInfo.count === 0
  };
}

/**
 * Analyze dominant color in cell
 */
function analyzeColor(imageData: ImageData): { color: string; confidence: number } {
  const { width, height, data } = imageData;
  const colorBuckets = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
    black: 0,
    white: 0
  };

  // Sample pixels to avoid white/black borders
  const margin = Math.floor(Math.min(width, height) * 0.1);
  const sampleSize = width * height / 16;

  for (let i = 0; i < data.length && i < sampleSize * 4; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent and very light pixels
    if (a < 128 || (r > 240 && g > 240 && b > 240)) continue;

    // Classify color
    const maxRGB = Math.max(r, g, b);
    const minRGB = Math.min(r, g, b);
    const luminance = (r * 299 + g * 587 + b * 114) / 1000;

    if (luminance < 50) {
      colorBuckets.black++;
    } else if (luminance > 200) {
      colorBuckets.white++;
    } else if (r > g + 20 && r > b + 20) {
      colorBuckets.red++;
    } else if (b > r + 20 && b > g + 20) {
      colorBuckets.blue++;
    } else if (g > r + 20 && g > b + 20) {
      colorBuckets.green++;
    } else if (r > 150 && g > 150 && b < 100) {
      colorBuckets.yellow++;
    }
  }

  // Find dominant color
  let dominantColor = 'Unknown';
  let maxCount = 0;

  for (const [color, count] of Object.entries(colorBuckets)) {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color.charAt(0).toUpperCase() + color.slice(1);
    }
  }

  const confidence = maxCount > 0 ? Math.min(1, maxCount / (sampleSize * 0.5)) : 0;
  return { color: dominantColor, confidence };
}

/**
 * Detect shapes and count instances
 */
function detectShapes(
  imageData: ImageData,
  width: number,
  height: number
): { shape: string; count: number; rotation: number; confidence: number } {
  // Binary threshold to get foreground
  const binary = binaryThreshold(imageData);

  // Find connected components (individual shapes)
  const components = findConnectedComponents(binary, width, height);

  if (components.length === 0) {
    return { shape: 'Unknown', count: 0, rotation: 0, confidence: 0 };
  }

  // Analyze each component
  const shapeAnalyses = components.map(component => analyzeComponentShape(component, width, height));

  // Find most common shape
  const shapeFreq: Record<string, number> = {};
  shapeAnalyses.forEach(s => {
    shapeFreq[s.shape] = (shapeFreq[s.shape] || 0) + 1;
  });

  const dominantShape = Object.entries(shapeFreq).sort((a, b) => b[1] - a[1])[0];
  const shape = dominantShape?.[0] || 'Unknown';
  const count = components.length;

  // Get rotation from first component
  const rotation = shapeAnalyses[0]?.rotation || 0;

  // Calculate confidence based on consistency
  const shapeConfidence = (dominantShape?.[1] || 0) / components.length;

  return { shape, count, rotation, confidence: shapeConfidence };
}

/**
 * Convert to binary image (foreground vs background)
 */
function binaryThreshold(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const binary = new Uint8Array(width * height);

  // Calculate Otsu threshold
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    histogram[Math.floor(gray)]++;
  }

  let threshold = 127;
  let maxVariance = 0;
  let w0 = 0,
    w1 = 0,
    mu0 = 0,
    mu1 = 0;

  for (let t = 0; t < 256; t++) {
    w0 += histogram[t];
    if (w0 === 0) continue;
    w1 = width * height - w0;
    if (w1 === 0) break;

    mu0 = (mu0 * (w0 - histogram[t]) + t * histogram[t]) / w0;
    mu1 = (mu1 * w1 + t * histogram[t]) / w1;

    const variance = w0 * w1 * Math.pow(mu0 - mu1, 2);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  // Apply threshold
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    binary[Math.floor(i / 4)] = gray > threshold ? 255 : 0;
  }

  return binary;
}

interface ComponentPixel {
  x: number;
  y: number;
}

/**
 * Find connected components using flood fill
 */
function findConnectedComponents(binary: Uint8Array, width: number, height: number): ComponentPixel[][] {
  const visited = new Uint8Array(binary.length);
  const components: ComponentPixel[][] = [];

  for (let i = 0; i < binary.length; i++) {
    if (binary[i] > 128 && !visited[i]) {
      const component = floodFill(binary, visited, i, width, height);
      if (component.length > 10) {
        // Filter out noise
        components.push(component);
      }
    }
  }

  return components;
}

/**
 * Flood fill algorithm to find connected pixels
 */
function floodFill(
  binary: Uint8Array,
  visited: Uint8Array,
  startIdx: number,
  width: number,
  height: number
): ComponentPixel[] {
  const component: ComponentPixel[] = [];
  const queue: number[] = [startIdx];
  visited[startIdx] = 1;

  while (queue.length > 0) {
    const idx = queue.shift()!;
    const y = Math.floor(idx / width);
    const x = idx % width;
    component.push({ x, y });

    // Check 4-connected neighbors
    const neighbors = [
      idx - width, // top
      idx + width, // bottom
      idx - 1, // left
      idx + 1 // right
    ];

    for (const nIdx of neighbors) {
      if (nIdx >= 0 && nIdx < binary.length && !visited[nIdx] && binary[nIdx] > 128) {
        visited[nIdx] = 1;
        queue.push(nIdx);
      }
    }
  }

  return component;
}

/**
 * Analyze shape of connected component
 */
function analyzeComponentShape(
  component: ComponentPixel[],
  width: number,
  height: number
): { shape: string; rotation: number } {
  const centroid = { x: 0, y: 0 };
  component.forEach(p => {
    centroid.x += p.x;
    centroid.y += p.y;
  });
  centroid.x /= component.length;
  centroid.y /= component.length;

  // Calculate moments to determine shape
  const moments = calculateMoments(component, centroid);

  // Classify shape based on moments
  const shapeType = classifyShapeByMoments(moments, component.length);

  // Calculate rotation using principal axis
  const rotation = calculateRotation(moments);

  return { shape: shapeType, rotation };
}

interface Moments {
  m00: number;
  m10: number;
  m01: number;
  m20: number;
  m02: number;
  m11: number;
  mu20: number;
  mu02: number;
  mu11: number;
}

/**
 * Calculate image moments for shape analysis
 */
function calculateMoments(component: ComponentPixel[], centroid: { x: number; y: number }): Moments {
  let m00 = 0,
    m10 = 0,
    m01 = 0,
    m20 = 0,
    m02 = 0,
    m11 = 0;
  let mu20 = 0,
    mu02 = 0,
    mu11 = 0;

  component.forEach(p => {
    m00++;
    m10 += p.x;
    m01 += p.y;
    m20 += p.x * p.x;
    m02 += p.y * p.y;
    m11 += p.x * p.y;

    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    mu20 += dx * dx;
    mu02 += dy * dy;
    mu11 += dx * dy;
  });

  return { m00, m10, m01, m20, m02, m11, mu20, mu02, mu11 };
}

/**
 * Classify shape based on moments
 */
function classifyShapeByMoments(moments: Moments, pixelCount: number): string {
  if (pixelCount === 0) return 'Unknown';

  // Calculate eccentricity and other shape descriptors
  const lambda1 = (moments.mu20 + moments.mu02 + Math.sqrt((moments.mu20 - moments.mu02) ** 2 + 4 * moments.mu11 ** 2)) / 2;
  const lambda2 = (moments.mu20 + moments.mu02 - Math.sqrt((moments.mu20 - moments.mu02) ** 2 + 4 * moments.mu11 ** 2)) / 2;

  const eccentricity = Math.sqrt(1 - Math.min(lambda1, lambda2) / Math.max(lambda1, lambda2));

  // Shape heuristics
  if (eccentricity > 0.85) {
    return 'Line';
  } else if (eccentricity > 0.6) {
    return 'Triangle';
  } else if (eccentricity > 0.3) {
    return 'Square';
  } else {
    return 'Circle';
  }
}

/**
 * Calculate rotation angle of the component
 */
function calculateRotation(moments: Moments): number {
  const angle = 0.5 * Math.atan2(2 * moments.mu11, moments.mu20 - moments.mu02);
  const degrees = (angle * 180) / Math.PI;

  // Quantize to 0, 45, 90, 135 degrees
  const rounded = Math.round(degrees / 45) * 45;
  return (rounded % 180) as 0 | 45 | 90 | 135;
}

/**
 * Detect if cell contains target marker (question mark or empty)
 */
function detectTarget(imageData: ImageData, width: number, height: number): boolean {
  const { data } = imageData;

  // Count very dark pixels (likely text/marks)
  let darkPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    if (gray < 100) darkPixels++;
  }

  const darkRatio = darkPixels / (width * height);

  // If center area is mostly empty or has text pattern, it's likely the target
  return darkRatio > 0.3 && darkRatio < 0.6;
}
