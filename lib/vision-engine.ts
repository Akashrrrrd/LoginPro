// Vision processing engine for LogicLens Pro

import { detectGridFromImage, extractGridCells, type GridInfo } from './grid-detection';
import { analyzeCell } from './symbol-recognition';
import { solvePuzzle as solveWithLogicEngine, type SolutionResult } from './logic-solver';

export interface CellData {
  index: number;
  row: number;
  col: number;
  shape?: string;
  color?: string;
  count?: number;
  rotation?: number;
  isEmpty?: boolean;
  isTarget?: boolean;
}

// Grid Detection - identify matrix grid and determine size
export async function detectGrid(
  img: HTMLImageElement,
  canvasRef: React.RefObject<HTMLCanvasElement>
): Promise<GridInfo> {
  try {
    return await detectGridFromImage(img);
  } catch (error) {
    console.error('Grid detection failed:', error);
    return {
      size: 3,
      topLeft: { x: 50, y: 50 },
      bottomRight: { x: 350, y: 350 },
      cellSize: 100,
      confidence: 0.5
    };
  }
}

// Cell Extraction - isolate individual cells from grid
export async function extractCells(
  img: HTMLImageElement,
  gridInfo: GridInfo,
  canvasRef: React.RefObject<HTMLCanvasElement>
): Promise<HTMLCanvasElement[]> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const { cells } = extractGridCells(gridInfo, imageData);

  return cells.map(cellImageData => {
    const cellCanvas = document.createElement('canvas');
    cellCanvas.width = cellImageData.width;
    cellCanvas.height = cellImageData.height;
    const cellCtx = cellCanvas.getContext('2d')!;
    cellCtx.putImageData(cellImageData, 0, 0);
    return cellCanvas;
  });
}

// Symbol Recognition - classify shapes, colors, and counts
export async function recognizeSymbols(
  cells: HTMLCanvasElement[],
  canvasRef: React.RefObject<HTMLCanvasElement>
): Promise<CellData[]> {
  const analyses = await Promise.all(cells.map(cell => analyzeCell(cell)));

  const gridSize = Math.sqrt(cells.length);
  return analyses.map((analysis, index) => ({
    index,
    row: Math.floor(index / gridSize),
    col: index % gridSize,
    shape: analysis.shape,
    color: analysis.color,
    count: analysis.count,
    rotation: analysis.rotation,
    isEmpty: analysis.isEmpty,
    isTarget: analysis.isTarget
  }));
}

// Solve Puzzle - apply logic rules
export function solvePuzzle(
  cellData: CellData[],
  gridSize: number
): SolutionResult {
  return solveWithLogicEngine(cellData, gridSize);
}

// AR Overlay - render solution over original image
export function renderSolutionOverlay(
  imageData: string,
  solution: any,
  canvasRef: React.RefObject<HTMLCanvasElement>
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
    ctx.drawImage(img, 0, 0);

    // Draw solution overlay
    const size = Math.sqrt(solution.targetIndex + 1);
    const cellSize = img.width / size;
    const targetRow = Math.floor(solution.targetIndex / size);
    const targetCol = solution.targetIndex % size;

    const x = targetCol * cellSize + cellSize / 2;
    const y = targetRow * cellSize + cellSize / 2;

    // Draw glowing border around target cell
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20;
    ctx.strokeRect(
      targetCol * cellSize + 5,
      targetRow * cellSize + 5,
      cellSize - 10,
      cellSize - 10
    );
    ctx.shadowBlur = 0;

    // Draw solution text
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(solution.answer, x, y);
  };
  img.src = imageData;
}
