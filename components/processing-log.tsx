'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ProcessingLogProps {
  steps: string[];
  solution: any;
}

export default function ProcessingLog({ steps, solution }: ProcessingLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  const isError = steps.some(s => s.includes('ERROR'));
  const isSolved = solution && !isError;

  return (
    <div className="border border-emerald-500/30 bg-gray-900/50 backdrop-blur rounded-lg overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-emerald-500/20 bg-gray-950/50">
        <p className="text-emerald-400 font-mono text-xs tracking-wider">PROCESSING LOG</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
        {steps.length === 0 ? (
          <p className="text-emerald-300/40">Waiting for image input...</p>
        ) : (
          steps.map((step, index) => (
            <div key={index} className="flex gap-2 text-emerald-300">
              {step.includes('ERROR') ? (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <span className={step.includes('ERROR') ? 'text-red-400' : ''}>
                {'> '}{step}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {isSolved && (
        <div className="px-4 py-3 border-t border-emerald-500/20 bg-emerald-950/30">
          <p className="text-emerald-400 font-mono text-xs font-bold">✓ PUZZLE SOLVED</p>
          {solution?.answer && (
            <div className="text-emerald-300 text-xs mt-2 space-y-1">
              <p>Method: {solution.method}</p>
              <p>Answer: {solution.answer}</p>
              <p className="text-emerald-400/70">Confidence: {Math.round(solution.confidence * 100)}%</p>
            </div>
          )}
          {solution?.explanation && (
            <p className="text-emerald-300/60 text-xs mt-2 italic">{solution.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
