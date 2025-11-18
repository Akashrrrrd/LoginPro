// AR Overlay Renderer - Generates visual representations of solutions

export interface OverlayConfig {
  targetCellX: number;
  targetCellY: number;
  cellSize: number;
  shape: string;
  color: string;
  count: number;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Render an SVG shape based on the solution
 */
export function generateShapeSVG(shape: string, color: string, count: number, cellSize: number): string {
  const padding = cellSize * 0.15;
  const availableSize = cellSize - padding * 2;
  const shapeSize = availableSize / Math.ceil(Math.sqrt(count));

  let shapes = '';

  // Generate the required number of shapes
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / Math.ceil(Math.sqrt(count)));
    const col = i % Math.ceil(Math.sqrt(count));
    const x = padding + col * shapeSize + shapeSize / 2;
    const y = padding + row * shapeSize + shapeSize / 2;

    shapes += generateSingleShape(shape, x, y, shapeSize * 0.7, color);
  }

  return `
    <svg width="${cellSize}" height="${cellSize}" viewBox="0 0 ${cellSize} ${cellSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      ${shapes}
    </svg>
  `;
}

/**
 * Generate a single shape element
 */
function generateSingleShape(shape: string, x: number, y: number, size: number, color: string): string {
  const rgbColor = colorNameToRGB(color);
  const strokeColor = adjustColorBrightness(rgbColor, 1.3);

  switch (shape) {
    case 'Circle':
      return `<circle cx="${x}" cy="${y}" r="${size / 2}" fill="${rgbColor}" stroke="${strokeColor}" stroke-width="2" filter="url(#glow)"/>`;

    case 'Square':
      return `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${rgbColor}" stroke="${strokeColor}" stroke-width="2" filter="url(#glow)"/>`;

    case 'Triangle':
      const points = [
        [x, y - size / 2],
        [x + size / 2, y + size / 2],
        [x - size / 2, y + size / 2]
      ];
      return `<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${rgbColor}" stroke="${strokeColor}" stroke-width="2" filter="url(#glow)"/>`;

    case 'Cross':
      const crossSize = size / 3;
      return `
        <rect x="${x - crossSize}" y="${y - size / 2}" width="${crossSize * 2}" height="${size}" fill="${rgbColor}" filter="url(#glow)"/>
        <rect x="${x - size / 2}" y="${y - crossSize}" width="${size}" height="${crossSize * 2}" fill="${rgbColor}" filter="url(#glow)"/>
      `;

    case 'Line':
      return `<line x1="${x - size / 2}" y1="${y}" x2="${x + size / 2}" y2="${y}" stroke="${rgbColor}" stroke-width="3" filter="url(#glow)"/>`;

    default:
      return `<circle cx="${x}" cy="${y}" r="${size / 2}" fill="${rgbColor}" stroke="${strokeColor}" stroke-width="2" filter="url(#glow)"/>`;
  }
}

/**
 * Convert color name to RGB hex
 */
function colorNameToRGB(color: string): string {
  const colors: Record<string, string> = {
    Red: '#ff4444',
    Blue: '#4488ff',
    Green: '#44ff44',
    Yellow: '#ffff44',
    Black: '#333333',
    White: '#eeeeee',
    Unknown: '#888888'
  };
  return colors[color] || '#888888';
}

/**
 * Adjust color brightness for stroke
 */
function adjustColorBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const nr = Math.min(255, Math.round(r * factor));
  const ng = Math.min(255, Math.round(g * factor));
  const nb = Math.min(255, Math.round(b * factor));

  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

/**
 * Render complete AR overlay on canvas
 */
export function renderAROverlay(
  imageData: string,
  solution: any,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  gridSize: number,
  cellSize: number
): void {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Calculate target cell position
    const targetRow = Math.floor(solution.targetIndex / gridSize);
    const targetCol = solution.targetIndex % gridSize;

    // Calculate grid offset (assuming centered grid)
    const gridStartX = (img.width - gridSize * cellSize) / 2;
    const gridStartY = (img.height - gridSize * cellSize) / 2;

    const cellX = gridStartX + targetCol * cellSize;
    const cellY = gridStartY + targetRow * cellSize;

    // Draw glowing border around target cell
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Outer glow
    ctx.strokeRect(cellX - 5, cellY - 5, cellSize + 10, cellSize + 10);

    // Inner border
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.strokeRect(cellX + 3, cellY + 3, cellSize - 6, cellSize - 6);

    // Draw corner accents
    const cornerSize = 15;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(cellX, cellY + cornerSize);
    ctx.lineTo(cellX, cellY);
    ctx.lineTo(cellX + cornerSize, cellY);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(cellX + cellSize - cornerSize, cellY);
    ctx.lineTo(cellX + cellSize, cellY);
    ctx.lineTo(cellX + cellSize, cellY + cornerSize);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(cellX, cellY + cellSize - cornerSize);
    ctx.lineTo(cellX, cellY + cellSize);
    ctx.lineTo(cellX + cornerSize, cellY + cellSize);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(cellX + cellSize - cornerSize, cellY + cellSize);
    ctx.lineTo(cellX + cellSize, cellY + cellSize);
    ctx.lineTo(cellX + cellSize, cellY + cellSize - cornerSize);
    ctx.stroke();

    // Draw solution shape
    drawSolutionShape(
      ctx,
      solution.shape || 'Circle',
      solution.color || 'Unknown',
      solution.count || 1,
      cellX,
      cellY,
      cellSize
    );

    // Draw solution label
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillText(`${solution.answer}`, cellX + cellSize / 2, cellY - 10);
    ctx.shadowBlur = 0;
  };

  img.src = imageData;
}

/**
 * Draw the solution shape inside the target cell
 */
function drawSolutionShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  color: string,
  count: number,
  cellX: number,
  cellY: number,
  cellSize: number
): void {
  const padding = cellSize * 0.1;
  const shapeSize = (cellSize - padding * 2) / Math.ceil(Math.sqrt(count));

  const shapeColor = colorNameToRGB(color);
  const strokeColor = adjustColorBrightness(shapeColor, 1.2);

  ctx.fillStyle = shapeColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / Math.ceil(Math.sqrt(count)));
    const col = i % Math.ceil(Math.sqrt(count));
    const x = cellX + padding + col * shapeSize + shapeSize / 2;
    const y = cellY + padding + row * shapeSize + shapeSize / 2;

    drawShape(ctx, shape, x, y, shapeSize * 0.6);
  }
}

/**
 * Helper to draw individual shape
 */
function drawShape(ctx: CanvasRenderingContext2D, shape: string, x: number, y: number, size: number): void {
  switch (shape) {
    case 'Circle':
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;

    case 'Square':
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);
      break;

    case 'Triangle':
      ctx.beginPath();
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'Cross':
      const crossSize = size / 3;
      // Vertical bar
      ctx.fillRect(x - crossSize, y - size / 2, crossSize * 2, size);
      // Horizontal bar
      ctx.fillRect(x - size / 2, y - crossSize, size, crossSize * 2);
      break;

    case 'Line':
      ctx.beginPath();
      ctx.moveTo(x - size / 2, y);
      ctx.lineTo(x + size / 2, y);
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
  }
}
