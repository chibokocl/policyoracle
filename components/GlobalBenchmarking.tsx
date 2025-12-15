import React from 'react';
import { SectorGlobalContext } from '../types';
import { Globe, Trophy, TrendingUp } from 'lucide-react';

interface GlobalBenchmarkingProps {
  country: string;
  contexts: SectorGlobalContext[];
}

export const GlobalBenchmarking: React.FC<GlobalBenchmarkingProps> = ({ country, contexts }) => {
  if (!contexts || contexts.length === 0) return null;

  return (
    <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 h-full flex flex-col">
      <h3 className="text-lg font-mono font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2 flex justify-between items-center">
        <span className="flex items-center space-x-2">
            <Globe size={18} className="text-terminal-accent" />
            <span>GLOBAL MATRIX</span>
        </span>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white font-mono uppercase">
            VS COMPETITORS
        </span>
      </h3>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {contexts.map((ctx, idx) => (
          <div key={idx} className="bg-black/40 border border-gray-800 p-4 rounded hover:border-terminal-accent transition-colors group">
            {/* Sector Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-bold text-white text-sm uppercase tracking-wider">{ctx.sectorName}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 group-hover:text-gray-400">
                        STATUS: <span className="text-terminal-accent">{ctx.localRank}</span>
                    </p>
                </div>
            </div>

            {/* Comparison Table */}
            <div className="space-y-2 mb-3">
                {ctx.topCompetitors.map((comp, cIdx) => (
                    <div key={cIdx} className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-600 w-4">#{comp.rank}</span>
                            <span className="text-gray-300">{comp.country}</span>
                        </div>
                        <span className="text-gray-500">{comp.metric}</span>
                    </div>
                ))}
                
                {/* Current Country (Simulated visual placement) */}
                <div className="flex items-center justify-between text-xs font-mono bg-terminal-accent/10 p-1.5 rounded border border-terminal-accent/30 mt-2">
                     <div className="flex items-center space-x-2">
                        <span className="text-terminal-accent w-4"><TrendingUp size={10} /></span>
                        <span className="text-white font-bold">{country}</span>
                    </div>
                    <span className="text-terminal-accent">Analyzing...</span>
                </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-gray-700 pl-2">
                "{ctx.analysis}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
