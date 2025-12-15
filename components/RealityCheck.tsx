import React from 'react';
import { Eye, AlertTriangle, FileCheck } from 'lucide-react';

interface RealityCheckProps {
  text: string;
}

export const RealityCheck: React.FC<RealityCheckProps> = ({ text }) => {
  return (
    <div className="bg-terminal-dark border border-terminal-border rounded-lg relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-terminal-border bg-black/20 flex items-center justify-between">
        <h3 className="text-lg font-mono font-bold text-gray-200 flex items-center space-x-2">
            <FileCheck size={18} className="text-terminal-accent" />
            <span>FINAL REPORT // REALITY CHECK</span>
        </h3>
        <div className="text-[10px] font-mono text-gray-500 border border-gray-700 px-2 py-1 rounded uppercase tracking-wider">
            Gemini-3-Pro Verified
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 relative bg-gradient-to-b from-terminal-dark to-black/50">
        <div className="font-mono text-sm text-gray-300 leading-7 whitespace-pre-line border-l-4 border-terminal-accent pl-4">
            {text}
        </div>
        
        {/* Background Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[100px] font-bold text-white/[0.02] pointer-events-none rotate-[-15deg] whitespace-nowrap select-none">
            CLASSIFIED
        </div>
      </div>

      {/* Footer / Context */}
      <div className="bg-red-950/10 border-t border-red-900/20 p-4 flex items-start space-x-3">
        <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 font-mono leading-relaxed">
            <span className="text-red-400 font-bold">ANALYST NOTE:</span> Historical feasibility analysis suggests a standard deviation of ±15% in projected timelines. 
            This summary is generated based on pattern recognition of similar legislative frameworks.
        </p>
      </div>
    </div>
  );
};
