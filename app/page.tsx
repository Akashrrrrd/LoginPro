'use client';

import { useState } from 'react';
import CameraCapture from '@/components/camera-capture';
import GridAnalyzer from '@/components/grid-analyzer';
import ProcessingLog from '@/components/processing-log';
import StatsPanel from '@/components/stats-panel';

export default function Home() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gridData, setGridData] = useState<any>(null);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [solution, setSolution] = useState<any>(null);
  const [gridSize, setGridSize] = useState(3);

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setGridData(null);
    setSolution(null);
    setProcessingSteps([]);
  };

  const handleGridAnalysis = (data: any, steps: string[], size: number) => {
    setGridData(data);
    setProcessingSteps(steps);
    setGridSize(size);
  };

  const handleSolutionFound = (sol: any) => {
    setSolution(sol);
  };

  const resetAnalysis = () => {
    setCapturedImage(null);
    setGridData(null);
    setSolution(null);
    setProcessingSteps([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black overflow-hidden">
      {/* Animated scanning lines overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-repeat animate-pulse" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 136, 0.03) 2px, rgba(0, 255, 136, 0.03) 4px)'
        }} />
      </div>

      {/* Starfield background effect - removed to fix hydration */}

      <div className="relative z-10">
        {/* Header with logo and status */}
        <header className="border-b border-emerald-500/20 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <div>
                  <h1 className="text-3xl font-bold text-emerald-400 font-mono tracking-wider">LOGIC LENS PRO</h1>
                  <p className="text-xs text-emerald-300/60 font-mono mt-1">Camera-Based Matrix Reasoning Solver v1.0</p>
                </div>
              </div>
              {solution && (
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-300 font-mono text-sm">SOLVED</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left column - Camera and analysis */}
            <div className="lg:col-span-3 space-y-6">
              <CameraCapture onImageCapture={handleImageCapture} />
              
              {capturedImage && (
                <>
                  <GridAnalyzer 
                    imageData={capturedImage}
                    onGridAnalysis={handleGridAnalysis}
                    onSolutionFound={handleSolutionFound}
                  />
                  <button
                    onClick={resetAnalysis}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 font-mono text-sm rounded-lg transition-colors border border-gray-600"
                  >
                    ↻ NEW ANALYSIS
                  </button>
                </>
              )}
            </div>

            {/* Right column - Logs and stats */}
            <div className="space-y-6">
              <ProcessingLog steps={processingSteps} solution={solution} />
              {gridData && <StatsPanel gridData={gridData} solution={solution} gridSize={gridSize} />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-emerald-500/20 bg-gray-950/50 mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center space-y-2">
              <p className="text-emerald-300/40 font-mono text-xs">
                LogicLens Pro • Camera-Based Matrix Reasoning Solver • v1.0
              </p>
              <p className="text-emerald-300/30 font-mono text-xs">
                Supports 3x3, 4x4, and 5x5 system-generated puzzles only
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
