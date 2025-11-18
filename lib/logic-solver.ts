// Universal Logic Engine for matrix reasoning puzzles

import type { CellData } from './vision-engine';

export interface SolutionResult {
  method: string;
  answer: string;
  targetIndex: number;
  confidence: number;
  explanation: string;
}

/**
 * Main puzzle solver - tries all strategies in priority order
 */
export function solvePuzzle(
  cellData: CellData[],
  gridSize: number
): SolutionResult {
  // Find target cell (question mark or empty)
  const target = cellData.find(c => c.isTarget);
  if (!target) {
    return {
      method: 'Error',
      answer: '?',
      targetIndex: -1,
      confidence: 0,
      explanation: 'No target cell found'
    };
  }

  // Strategy 1: Symmetry Rule (for 3x3 and 5x5 grids)
  if (gridSize === 3 || gridSize === 5) {
    const symmetryResult = trySymmetryRule(target, cellData, gridSize);
    if (symmetryResult && symmetryResult.confidence > 0.7) {
      return symmetryResult;
    }
  }

  // Strategy 2: Sudoku/Uniqueness Rule (for 4x4)
  if (gridSize === 4) {
    const sudokuResult = trySudokuRule(target, cellData, gridSize);
    if (sudokuResult && sudokuResult.confidence > 0.7) {
      return sudokuResult;
    }
  }

  // Strategy 3: Series/Progression Rule (for 3x3 and 4x4)
  if (gridSize === 3 || gridSize === 4) {
    const seriesResult = trySeriesRule(target, cellData, gridSize);
    if (seriesResult && seriesResult.confidence > 0.7) {
      return seriesResult;
    }
  }

  // Strategy 4: Inventory Rule (for 4x4 and 5x5)
  if (gridSize === 4 || gridSize === 5) {
    const inventoryResult = tryInventoryRule(target, cellData, gridSize);
    if (inventoryResult && inventoryResult.confidence > 0.5) {
      return inventoryResult;
    }
  }

  // Fallback: Best guess from any method
  return {
    method: 'Best Guess',
    answer: 'Unknown',
    targetIndex: target.index,
    confidence: 0.3,
    explanation: 'No pattern found with high confidence'
  };
}

/**
 * SYMMETRY RULE: The answer mirrors a cell opposite the center
 * Applies to: 3x3, 5x5
 */
function trySymmetryRule(target: CellData, cells: CellData[], gridSize: number): SolutionResult | null {
  const center = (gridSize - 1) / 2;
  const mirrorRow = Math.round(2 * center - target.row);
  const mirrorCol = Math.round(2 * center - target.col);

  const mirror = cells.find(c => c.row === mirrorRow && c.col === mirrorCol && !c.isTarget);

  if (!mirror) {
    return null;
  }

  // Check for rotational symmetry
  const targetRotation = target.rotation || 0;
  const mirrorRotation = mirror.rotation || 0;

  // In rotational symmetry, opposite cells often have 180° opposite rotations
  const rotationMatch = Math.abs((mirrorRotation - targetRotation) % 180) < 45;

  if (!rotationMatch && mirror.shape === mirror.shape) {
    return null; // Rotation mismatch suggests symmetry doesn't apply
  }

  return {
    method: 'Symmetry Rule',
    answer: mirror.shape || 'Unknown',
    targetIndex: target.index,
    confidence: rotationMatch ? 0.95 : 0.75,
    explanation: `Opposite cell at (${mirrorRow},${mirrorCol}) contains ${mirror.shape}`
  };
}

/**
 * SUDOKU RULE: Each row and column must have unique elements
 * Applies to: 4x4
 */
function trySudokuRule(target: CellData, cells: CellData[], gridSize: number): SolutionResult | null {
  // Get all shapes in target's row and column
  const rowShapes = new Set<string>();
  const colShapes = new Set<string>();

  cells.forEach(cell => {
    if (!cell.isTarget) {
      if (cell.row === target.row) rowShapes.add(cell.shape || 'Unknown');
      if (cell.col === target.col) colShapes.add(cell.shape || 'Unknown');
    }
  });

  // Find all possible shapes
  const allShapes = new Set<string>();
  cells.forEach(c => {
    if (c.shape) allShapes.add(c.shape);
  });

  // Find missing shape(s) in both row and column
  const missingInRow = [...allShapes].filter(s => !rowShapes.has(s));
  const missingInCol = [...allShapes].filter(s => !colShapes.has(s));

  // Find intersection - shape missing in both
  const candidates = missingInRow.filter(s => missingInCol.includes(s));

  if (candidates.length === 1) {
    return {
      method: 'Sudoku Rule',
      answer: candidates[0],
      targetIndex: target.index,
      confidence: 0.9,
      explanation: `${candidates[0]} is the only shape missing in row ${target.row} and column ${target.col}`
    };
  } else if (candidates.length > 1) {
    return {
      method: 'Sudoku Rule (Ambiguous)',
      answer: candidates[0],
      targetIndex: target.index,
      confidence: 0.6,
      explanation: `Multiple candidates: ${candidates.join(', ')}`
    };
  }

  return null;
}

/**
 * SERIES RULE: Look for mathematical progression in rows/columns
 * Applies to: 3x3, 4x4
 */
function trySeriesRule(target: CellData, cells: CellData[], gridSize: number): SolutionResult | null {
  // Check count progression in row
  const rowCells = cells
    .filter(c => c.row === target.row && !c.isTarget)
    .sort((a, b) => a.col - b.col);

  const rowCounts = rowCells.map(c => c.count || 0);

  // Try to find arithmetic progression
  if (rowCounts.length >= 2) {
    const diff = rowCounts[1] - rowCounts[0];
    let isArithmeticProgression = true;

    for (let i = 2; i < rowCounts.length; i++) {
      if (rowCounts[i] - rowCounts[i - 1] !== diff) {
        isArithmeticProgression = false;
        break;
      }
    }

    if (isArithmeticProgression) {
      const expectedCount = rowCounts[rowCounts.length - 1] + diff;

      // Find cell with this count
      const candidate = cells.find(
        c => !c.isTarget && c.count === expectedCount && c.row === target.row
      );

      if (candidate) {
        return {
          method: 'Series Rule',
          answer: candidate.shape || 'Unknown',
          targetIndex: target.index,
          confidence: 0.85,
          explanation: `Arithmetic progression: counts are ${rowCounts.join(', ')}, next should be ${expectedCount}`
        };
      }
    }
  }

  // Check column progression
  const colCells = cells
    .filter(c => c.col === target.col && !c.isTarget)
    .sort((a, b) => a.row - b.row);

  const colCounts = colCells.map(c => c.count || 0);

  if (colCounts.length >= 2) {
    const diff = colCounts[1] - colCounts[0];
    const expectedCount = colCounts[colCounts.length - 1] + diff;

    const candidate = cells.find(
      c => !c.isTarget && c.count === expectedCount && c.col === target.col
    );

    if (candidate) {
      return {
        method: 'Series Rule',
        answer: candidate.shape || 'Unknown',
        targetIndex: target.index,
        confidence: 0.85,
        explanation: `Column progression: counts are ${colCounts.join(', ')}, next should be ${expectedCount}`
      };
    }
  }

  return null;
}

/**
 * INVENTORY RULE: Count occurrences; odd one out is the answer
 * Applies to: 4x4, 5x5
 */
function tryInventoryRule(target: CellData, cells: CellData[], gridSize: number): SolutionResult | null {
  // Count shape/color pairs
  const inventory: Record<string, number> = {};

  cells.forEach(cell => {
    if (!cell.isTarget) {
      const key = `${cell.shape}-${cell.color}`;
      inventory[key] = (inventory[key] || 0) + 1;
    }
  });

  // Find items appearing odd number of times
  const oddItems = Object.entries(inventory).filter(([_, count]) => count % 2 === 1);

  if (oddItems.length === 1) {
    const [key] = oddItems[0];
    const [shape] = key.split('-');

    return {
      method: 'Inventory Rule',
      answer: shape,
      targetIndex: target.index,
      confidence: 0.88,
      explanation: `${key} appears an odd number of times (odd one out)`
    };
  } else if (oddItems.length > 1) {
    // Multiple odd items - try each one
    const [key] = oddItems[0];
    const [shape] = key.split('-');

    return {
      method: 'Inventory Rule (Multiple)',
      answer: shape,
      targetIndex: target.index,
      confidence: 0.6,
      explanation: `Multiple odd items found: ${oddItems.map(([k]) => k).join(', ')}`
    };
  }

  // Try color inventory
  const colorInventory: Record<string, number> = {};
  cells.forEach(cell => {
    if (!cell.isTarget && cell.color) {
      colorInventory[cell.color] = (colorInventory[cell.color] || 0) + 1;
    }
  });

  const oddColors = Object.entries(colorInventory).filter(([_, count]) => count % 2 === 1);

  if (oddColors.length === 1) {
    // Find a cell with this odd color
    const [oddColor] = oddColors[0];
    const candidate = cells.find(c => !c.isTarget && c.color === oddColor);

    if (candidate) {
      return {
        method: 'Inventory Rule (Color)',
        answer: candidate.shape || 'Unknown',
        targetIndex: target.index,
        confidence: 0.7,
        explanation: `Color ${oddColor} appears an odd number of times`
      };
    }
  }

  return null;
}

/**
 * Helper: Get all unique shapes in the grid
 */
export function getUniqueShapes(cells: CellData[]): string[] {
  const shapes = new Set<string>();
  cells.forEach(c => {
    if (c.shape) shapes.add(c.shape);
  });
  return Array.from(shapes);
}

/**
 * Helper: Get grid statistics
 */
export function getGridStatistics(cells: CellData[], gridSize: number) {
  const shapes = new Map<string, number>();
  const colors = new Map<string, number>();
  let totalCount = 0;

  cells.forEach(cell => {
    if (!cell.isTarget) {
      if (cell.shape) shapes.set(cell.shape, (shapes.get(cell.shape) || 0) + 1);
      if (cell.color) colors.set(cell.color, (colors.get(cell.color) || 0) + 1);
      totalCount += cell.count || 0;
    }
  });

  return {
    uniqueShapes: shapes.size,
    uniqueColors: colors.size,
    shapeDistribution: Object.fromEntries(shapes),
    colorDistribution: Object.fromEntries(colors),
    averageCount: totalCount / (cells.length - 1)
  };
}
