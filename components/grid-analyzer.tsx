'use client';

import { useEffect, useState, useRef } from 'react';
import { detectGrid, extractCells, recognizeSymbols, solvePuzzle } from '@/lib/vision-engine';
import AROverlay from '@/components/ar-overlay';

interface GridAnalyzerProps {
  imageData: string;
  onGridAnalysis: (data: any, steps: string[], gridSize: number) => void;
  onSolutionFound: (solution: any) => void;
}

export default function GridAnalyzer({ imageData, onGridAnalysis, onSolutionFound }: GridAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [steps, setSteps] = useState<string[]>([]);
  const [gridData, setGridData] = useState<any>(null);
  const [solution, setSolution] = useState<any>(null);
  const [gridSize, setGridSize] = useState(3);

  useEffect(() => {
    const analyze = async () => {
      const newSteps: string[] = [];
      
      try {
        // Step 1: Load image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          // Step 2: Detect grid
          newSteps.push('Grid Detection: Analyzing image...');
          setSteps([...newSteps]);

          const gridInfo = await detectGrid(img, canvasRef);
          newSteps.push(`✓ Grid Detected: ${gridInfo.size}x${gridInfo.size} matrix (${Math.round(gridInfo.confidence * 100)}% confidence)`);
          setGridSize(gridInfo.size);
          setSteps([...newSteps]);

          // Step 3: Extract cells
          newSteps.push('Cell Extraction: Isolating matrix cells...');
          setSteps([...newSteps]);

          const cells = await extractCells(img, gridInfo, canvasRef);
          newSteps.push(`✓ Cells Extracted: ${cells.length} cells identified`);
          setSteps([...newSteps]);

          // Step 4: Recognize symbols
          newSteps.push('Symbol Recognition: Analyzing shapes and colors...');
          setSteps([...newSteps]);

          const cellData = await recognizeSymbols(cells, canvasRef);
          const targetCell = cellData.find((c: any) => c.isTarget);
          newSteps.push(`✓ Symbols Recognized: ${cellData.length} cells processed (Target at index ${targetCell?.index})`);
          setSteps([...newSteps]);

          // Step 5: Solve puzzle
          newSteps.push('Logic Engine: Applying solver rules...');
          setSteps([...newSteps]);

          const result = solvePuzzle(cellData, gridInfo.size);
          newSteps.push(`✓ Puzzle Solved: ${result.method} rule applied`);
          setSteps([...newSteps]);

          // Set final state
          const finalGridData = {
            size: gridInfo.size,
            cells: cellData,
            targetIndex: result.targetIndex,
            gridInfo
          };

          setGridData(finalGridData);
          setSolution(result);
          onGridAnalysis(finalGridData, newSteps, gridInfo.size);
          onSolutionFound(result);
          setAnalyzing(false);
        };
        img.src = imageData;
      } catch (error) {
        console.error('Analysis failed:', error);
        newSteps.push(`ERROR: ${error instanceof Error ? error.message : 'Analysis failed'}`);
        setSteps([...newSteps]);
        setAnalyzing(false);
      }
    };

    analyze();
  }, [imageData, onGridAnalysis, onSolutionFound]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />
      
      {analyzing && (
        <div className="border border-emerald-500/30 bg-gray-900/50 backdrop-blur rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-emerald-300 font-mono text-sm">ANALYZING PUZZLE...</p>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
              <div className="bg-emerald-500 h-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}

      {solution && (
        <AROverlay 
          solution={solution} 
          imageData={imageData}
          gridSize={gridSize}
          cellSize={(200 / gridSize)}
        />
      )}
    </div>
  );
}
