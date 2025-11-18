'use client';

import { useEffect, useRef } from 'react';
import { renderAROverlay } from '@/lib/ar-renderer';

interface AROverlayProps {
  solution: any;
  imageData: string;
  gridSize?: number;
  cellSize?: number;
}

export default function AROverlay({ 
  solution, 
  imageData, 
  gridSize = 3,
  cellSize = 100 
}: AROverlayProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlayCanvasRef.current && solution) {
      // Calculate actual cell size based on image dimensions
      const img = new Image();
      img.onload = () => {
        const actualCellSize = img.width / gridSize;
        renderAROverlay(imageData, solution, overlayCanvasRef, gridSize, actualCellSize);
      };
      img.src = imageData;
    }
  }, [solution, imageData, gridSize]);

  return (
    <div ref={containerRef} className="border border-emerald-500/50 bg-gray-900/50 backdrop-blur rounded-lg overflow-hidden">
      <div className="flex flex-col">
        <div className="px-4 py-2 border-b border-emerald-500/20 bg-gray-950/50 flex items-center justify-between">
          <p className="text-emerald-400 font-mono text-xs">SOLUTION OVERLAY</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <p className="text-emerald-300/60 font-mono text-xs">ACTIVE</p>
          </div>
        </div>
        <div className="relative aspect-square bg-black overflow-hidden">
          <canvas 
            ref={overlayCanvasRef} 
            className="w-full h-full"
          />
          {/* Scanning line animation */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 136, 0.1) 2px, rgba(0, 255, 136, 0.1) 4px)'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
