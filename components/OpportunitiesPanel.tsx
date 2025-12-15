import React from 'react';
import { Opportunity } from '../types';
import { Briefcase, FileText, Percent, ArrowUpRight } from 'lucide-react';

interface OpportunitiesPanelProps {
  opportunities: Opportunity[];
}

export const OpportunitiesPanel: React.FC<OpportunitiesPanelProps> = ({ opportunities }) => {
  const getIcon = (type: string) => {
    switch (type) {
        case 'TENDER': return <FileText size={14} className="text-blue-400" />;
        case 'TAX_INCENTIVE': return <Percent size={14} className="text-terminal-green" />;
        case 'INVESTMENT': return <Briefcase size={14} className="text-purple-400" />;
        default: return <ArrowUpRight size={14} />;
    }
  };

  const getLabel = (type: string) => {
     switch (type) {
        case 'TENDER': return 'PROCUREMENT';
        case 'TAX_INCENTIVE': return 'TAX BREAK';
        case 'INVESTMENT': return 'CAPITAL OPENING';
        default: return 'OPPORTUNITY';
     }
  };

  return (
    <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 h-full flex flex-col">
      <h3 className="text-lg font-mono font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2 flex justify-between">
        ECONOMIC INTEL
        <span className="text-xs text-gray-500 self-center">OPPORTUNITIES</span>
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {opportunities.length === 0 ? (
             <div className="text-center py-10 text-gray-600 font-mono text-xs">
                NO COMMERCIAL SIGNALS DETECTED
            </div>
        ) : (
            opportunities.map((opp, idx) => (
                <div key={idx} className="bg-black/20 border border-gray-800 p-3 rounded hover:bg-white/5 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center space-x-2">
                            {getIcon(opp.type)}
                            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                                {getLabel(opp.type)}
                            </span>
                        </div>
                        {opp.estimatedValue && (
                            <span className="text-[10px] font-mono text-terminal-accent border border-terminal-accent/30 px-1.5 rounded">
                                {opp.estimatedValue}
                            </span>
                        )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-200 mb-1 group-hover:text-white transition-colors">
                        {opp.title}
                    </h4>
                    <p className="text-xs text-gray-500 font-mono leading-relaxed">
                        {opp.description}
                    </p>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
