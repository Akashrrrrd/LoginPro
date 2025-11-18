// Advanced grid detection using canvas-based CV techniques

export interface GridInfo {
  size: number;
  topLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
  cellSize: number;
  confidence: number;
}

/**
 * Main grid detection function
 * Converts image to grayscale, applies thresholding, detects contours, and identifies grid
 */
export async function detectGridFromImage(img: HTMLImageElement): Promise<GridInfo> {
  // Create working canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  // Draw image
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Step 1: Convert to grayscale
  const grayscale = toGrayscale(imageData);

  // Step 2: Apply thresholding to find high-contrast areas (lines)
  const threshold = adaptiveThreshold(grayscale, canvas.width, canvas.height);

  // Step 3: Detect edges (lines) using Sobel filter
  const edges = sobelEdgeDetection(threshold, canvas.width, canvas.height);

  // Step 4: Find contours and identify the largest square
  const gridContour = findLargestSquareContour(edges, canvas.width, canvas.height);

  if (!gridContour) {
    throw new Error('No grid contour detected');
  }

  // Step 5: Determine grid size (3x3, 4x4, 5x5) by counting internal lines
  const gridSize = determineGridSize(edges, gridContour, canvas.width, canvas.height);

  const gridInfo: GridInfo = {
    size: gridSize,
    topLeft: gridContour.topLeft,
    bottomRight: gridContour.bottomRight,
    cellSize: (gridContour.bottomRight.x - gridContour.topLeft.x) / gridSize,
    confidence: gridContour.confidence
  };

  return gridInfo;
}

/**
 * Convert image data to grayscale
 */
function toGrayscale(imageData: ImageData): Uint8Array {
  const data = imageData.data;
  const grayscale = new Uint8Array(imageData.width * imageData.height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminosity method
    grayscale[i / 4] = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return grayscale;
}

/**
 * Adaptive threshold to find high-contrast lines
 */
function adaptiveThreshold(grayscale: Uint8Array, width: number, height: number): Uint8Array {
  const blockSize = 15;
  const threshold = new Uint8Array(grayscale.length);
  const halfBlock = Math.floor(blockSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Calculate mean in local block
      let sum = 0;
      let count = 0;

      for (let dy = -halfBlock; dy <= halfBlock; dy++) {
        for (let dx = -halfBlock; dx <= halfBlock; dx++) {
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          sum += grayscale[ny * width + nx];
          count++;
        }
      }

      const localMean = sum / count;
      threshold[idx] = grayscale[idx] > localMean ? 255 : 0;
    }
  }

  return threshold;
}

/**
 * Sobel edge detection filter
 */
function sobelEdgeDetection(threshold: Uint8Array, width: number, height: number): Uint8Array {
  const edges = new Uint8Array(threshold.length);

  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      // Apply Sobel kernels
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          gx += sobelX[ky + 1][kx + 1] * threshold[idx];
          gy += sobelY[ky + 1][kx + 1] * threshold[idx];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > 100 ? 255 : 0;
    }
  }

  return edges;
}

interface ContourInfo {
  topLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
  area: number;
  confidence: number;
}

/**
 * Find the largest square contour (the puzzle grid)
 */
function findLargestSquareContour(edges: Uint8Array, width: number, height: number): ContourInfo | null {
  let maxArea = 0;
  let bestContour: ContourInfo | null = null;

  // Scan for rectangular regions
  for (let y = 0; y < height - 50; y++) {
    for (let x = 0; x < width - 50; x++) {
      // Look for top-left corner
      if (edges[y * width + x] === 255) {
        // Trace the contour
        const contour = traceRectangle(edges, x, y, width, height);

        if (contour && contour.area > maxArea && Math.abs(contour.area - (contour.area * 1)) < 100) {
          maxArea = contour.area;
          bestContour = contour;
        }
      }
    }
  }

  return bestContour;
}

/**
 * Trace a rectangle contour from a starting point
 */
function traceRectangle(edges: Uint8Array, startX: number, startY: number, width: number, height: number): ContourInfo | null {
  const minSize = 50;
  const maxSize = Math.min(width, height) - 10;

  // Try different sizes to find a rectangle
  for (let size = minSize; size < maxSize; size += 10) {
    const topLeft = { x: startX, y: startY };
    const bottomRight = { x: startX + size, y: startY + size };

    if (bottomRight.x >= width || bottomRight.y >= height) continue;

    // Check if rectangle edges are mostly filled with edge pixels
    const topEdgeCount = countEdgesInLine(edges, topLeft.x, topLeft.y, bottomRight.x, topLeft.y, width);
    const bottomEdgeCount = countEdgesInLine(edges, topLeft.x, bottomRight.y, bottomRight.x, bottomRight.y, width);
    const leftEdgeCount = countEdgesInLine(edges, topLeft.x, topLeft.y, topLeft.x, bottomRight.y, width);
    const rightEdgeCount = countEdgesInLine(edges, bottomRight.x, topLeft.y, bottomRight.x, bottomRight.y, width);

    const totalEdges = topEdgeCount + bottomEdgeCount + leftEdgeCount + rightEdgeCount;
    const expectedEdges = (size * 4) * 0.6; // 60% threshold

    if (totalEdges > expectedEdges) {
      return {
        topLeft,
        bottomRight,
        area: size * size,
        confidence: Math.min(1, totalEdges / (size * 4))
      };
    }
  }

  return null;
}

/**
 * Count edge pixels in a line
 */
function countEdgesInLine(edges: Uint8Array, x1: number, y1: number, x2: number, y2: number, width: number): number {
  let count = 0;
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));

  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x1 + (x2 - x1) * (i / steps));
    const y = Math.round(y1 + (y2 - y1) * (i / steps));
    if (edges[y * width + x] === 255) count++;
  }

  return count;
}

/**
 * Determine grid size (3x3, 4x4, or 5x5) by counting internal lines
 */
function determineGridSize(edges: Uint8Array, contour: ContourInfo, width: number, height: number): number {
  const { topLeft, bottomRight } = contour;
  const gridWidth = bottomRight.x - topLeft.x;
  const gridHeight = bottomRight.y - topLeft.y;

  // Count vertical lines
  let verticalLines = 0;
  for (let x = topLeft.x + gridWidth / 5; x < bottomRight.x; x += gridWidth / 5) {
    let edgeCount = 0;
    for (let y = topLeft.y; y < bottomRight.y; y++) {
      if (edges[Math.floor(y * width + x)] === 255) edgeCount++;
    }
    if (edgeCount > gridHeight * 0.4) verticalLines++;
  }

  // Map line count to grid size
  if (verticalLines >= 3) return 5;
  if (verticalLines >= 2) return 4;
  return 3;
}

/**
 * Extract individual cells from the grid
 */
export function extractGridCells(
  gridInfo: GridInfo,
  imageData: ImageData
): { cells: ImageData[]; cellPositions: Array<{ x: number; y: number }> } {
  const { topLeft, cellSize, size } = gridInfo;
  const cells: ImageData[] = [];
  const cellPositions: Array<{ x: number; y: number }> = [];

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  const sourceCtx = sourceCanvas.getContext('2d')!;
  sourceCtx.putImageData(imageData, 0, 0);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cellX = topLeft.x + col * cellSize;
      const cellY = topLeft.y + row * cellSize;

      const cellCanvas = document.createElement('canvas');
      cellCanvas.width = cellSize;
      cellCanvas.height = cellSize;
      const cellCtx = cellCanvas.getContext('2d')!;

      cellCtx.drawImage(
        sourceCanvas,
        cellX,
        cellY,
        cellSize,
        cellSize,
        0,
        0,
        cellSize,
        cellSize
      );

      cells.push(cellCtx.getImageData(0, 0, cellSize, cellSize));
      cellPositions.push({ x: cellX, y: cellY });
    }
  }

  return { cells, cellPositions };
}
