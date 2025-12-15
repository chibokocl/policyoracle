import React from 'react';
import { SectorAnalysis } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FortuneMapProps {
  sectors: SectorAnalysis[];
}

export const FortuneMap: React.FC<FortuneMapProps> = ({ sectors }) => {
  return (
    <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 h-full flex flex-col">
      <h3 className="text-lg font-mono font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2 flex justify-between">
        FORTUNE MAP
        <span className="text-xs text-gray-500 self-center">SECTOR SENTIMENT</span>
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-4">
          {sectors.map((sector, idx) => (
            <div key={idx} className="bg-black/40 border border-gray-800 p-3 rounded hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider">{sector.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    {sector.sentiment === 'BULLISH' && <TrendingUp size={14} className="text-terminal-green" />}
                    {sector.sentiment === 'BEARISH' && <TrendingDown size={14} className="text-terminal-red" />}
                    {sector.sentiment === 'NEUTRAL' && <Minus size={14} className="text-gray-400" />}
                    
                    <span 
                      className={`text-xs font-mono font-bold ${
                        sector.sentiment === 'BULLISH' ? 'text-terminal-green' : 
                        sector.sentiment === 'BEARISH' ? 'text-terminal-red' : 'text-gray-400'
                      }`}
                    >
                      {sector.sentiment} ({sector.score})
                    </span>
                  </div>
                </div>
                
                {/* Visual bar for score */}
                <div className="w-16 h-8 flex items-end space-x-1">
                  {[...Array(5)].map((_, barIdx) => (
                    <div 
                        key={barIdx} 
                        className={`w-2 rounded-sm ${barIdx < (sector.score / 20) ? (sector.sentiment === 'BULLISH' ? 'bg-terminal-green' : sector.sentiment === 'BEARISH' ? 'bg-terminal-red' : 'bg-gray-500') : 'bg-gray-800'}`}
                        style={{ height: `${20 + Math.random() * 80}%` }} // Random height for visual "chart" effect
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                {sector.reasoning}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
