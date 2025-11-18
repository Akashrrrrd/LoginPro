'use client';

import { BarChart3, Activity } from 'lucide-react';

interface StatsPanelProps {
  gridData: any;
  solution: any;
  gridSize: number;
}

export default function StatsPanel({ gridData, solution, gridSize }: StatsPanelProps) {
  const cells = gridData?.cells || [];
  const shapeFreq: Record<string, number> = {};
  const colorFreq: Record<string, number> = {};

  cells.forEach((cell: any) => {
    if (!cell.isTarget) {
      if (cell.shape) shapeFreq[cell.shape] = (shapeFreq[cell.shape] || 0) + 1;
      if (cell.color) colorFreq[cell.color] = (colorFreq[cell.color] || 0) + 1;
    }
  });

  return (
    <div className="border border-emerald-500/30 bg-gray-900/50 backdrop-blur rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-emerald-500/20 bg-gray-950/50 flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-400" />
        <p className="text-emerald-400 font-mono text-xs tracking-wider">GRID ANALYSIS</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Grid info */}
        <div className="space-y-2">
          <p className="text-emerald-300/60 font-mono text-xs">Matrix Size</p>
          <p className="text-emerald-400 font-mono text-lg font-bold">{gridSize}x{gridSize}</p>
        </div>

        {/* Shape distribution */}
        <div className="space-y-2 border-t border-emerald-500/10 pt-3">
          <p className="text-emerald-300/60 font-mono text-xs flex items-center gap-2">
            <BarChart3 className="w-3 h-3" />
            SHAPES
          </p>
          <div className="space-y-1">
            {Object.entries(shapeFreq).map(([shape, count]) => (
              <div key={shape} className="flex justify-between items-center text-xs">
                <span className="text-emerald-300/70">{shape}</span>
                <span className="text-emerald-400 font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Color distribution */}
        <div className="space-y-2 border-t border-emerald-500/10 pt-3">
          <p className="text-emerald-300/60 font-mono text-xs">COLORS</p>
          <div className="space-y-1">
            {Object.entries(colorFreq).map(([color, count]) => (
              <div key={color} className="flex justify-between items-center text-xs">
                <span className="text-emerald-300/70">{color}</span>
                <span className="text-emerald-400 font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Solution confidence */}
        {solution && (
          <div className="space-y-2 border-t border-emerald-500/10 pt-3 bg-emerald-950/30 p-3 rounded">
            <p className="text-emerald-300/60 font-mono text-xs">CONFIDENCE</p>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${Math.round(solution.confidence * 100)}%` }}
              />
            </div>
            <p className="text-emerald-400 font-mono text-sm text-center">
              {Math.round(solution.confidence * 100)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
