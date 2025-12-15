
import React from 'react';
import { PolicyAnalysis } from '../types';
import { DynamicVizPanel } from './MoneyFlow';
import { ShieldAlert, Globe, Scale, Coins, FileText } from 'lucide-react';

interface ReportViewProps {
  data: PolicyAnalysis;
}

export const ReportView: React.FC<ReportViewProps> = ({ data }) => {
  const getSectionIcon = (iconType: string) => {
      switch(iconType) {
          case 'RISK': return <ShieldAlert size={16} className="text-red-500 mr-2" />;
          case 'MONEY': return <Coins size={16} className="text-green-500 mr-2" />;
          case 'GLOBE': return <Globe size={16} className="text-blue-500 mr-2" />;
          case 'LAW': return <Scale size={16} className="text-gray-500 mr-2" />;
          default: return <FileText size={16} className="text-gray-500 mr-2" />;
      }
  };

  return (
    <div 
        id="swiss-report" 
        className="bg-white text-black p-10 min-w-[800px] max-w-[1000px] mx-auto font-sans"
        style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="border-b-4 border-black pb-6 mb-10 flex justify-between items-end">
        <div>
            <h1 className="text-6xl font-bold tracking-tighter leading-none mb-2 break-words max-w-lg uppercase">
                {data.policyTitle || "POLICY REPORT"}
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest mt-4 text-gray-500">
                Official Analysis Report // {data.country}
            </p>
        </div>
        <div className="text-right">
            <div className="text-sm font-bold mb-1">DOC REF: {data.documentName.substring(0, 20)}...</div>
            <div className="text-sm text-gray-500">{new Date(data.timestamp).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Grid Layout for Print */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Metric 1: Corruption */}
        <div className="col-span-4 border-t-2 border-black pt-2">
            <h3 className="text-sm font-bold uppercase mb-4">Integrity Index</h3>
            <div className="text-5xl font-bold mb-2 text-[#FF4E4E]">
                {data.corruptionScore}<span className="text-2xl text-black">/100</span>
            </div>
            <p className="text-xs leading-tight text-gray-600">
                Calculated risk score based on vague clauses, discretionary powers, and historical precedents.
            </p>
        </div>

        {/* Dynamic Sections (First 2 usually summary/major point) */}
        {data.reportSections && data.reportSections.slice(0, 2).map((section, idx) => (
             <div key={idx} className="col-span-8 border-t-2 border-black pt-2">
                <h3 className="text-sm font-bold uppercase mb-4 flex items-center">
                    {getSectionIcon(section.icon)} {section.header}
                </h3>
                <p className="text-lg font-medium leading-relaxed">
                    {section.body}
                </p>
            </div>
        ))}

        {/* Spacer */}
        <div className="col-span-12 h-8"></div>

        {/* Visual Intelligence Section */}
        {data.visualData && (
            <div className="col-span-12 border-t-2 border-black pt-2 min-h-[300px]">
                <h3 className="text-sm font-bold uppercase mb-4">{data.visualData.headline} (Visual Analysis)</h3>
                <div className="h-64 bg-gray-50 rounded p-4 border border-gray-200">
                     {/* Invert filter for print friendliness since Chart is designed for dark mode */}
                     <div className="filter invert contrast-125 h-full">
                        <DynamicVizPanel data={data.visualData} />
                     </div>
                </div>
            </div>
        )}

        {/* Remaining Dynamic Sections */}
         {data.reportSections && data.reportSections.slice(2).map((section, idx) => (
             <div key={idx} className="col-span-6 border-t-2 border-black pt-2 mt-4">
                <h3 className="text-sm font-bold uppercase mb-2 flex items-center">
                    {getSectionIcon(section.icon)} {section.header}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                    {section.body}
                </p>
            </div>
        ))}

        {/* Risk List (Fixed at bottom) */}
        <div className="col-span-12 border-t-2 border-black pt-2 mt-8">
            <h3 className="text-sm font-bold uppercase mb-6">Critical Risk Factors</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {data.risks.slice(0, 6).map((risk, i) => (
                    <div key={i} className="mb-4">
                        <div className="flex items-center mb-1">
                            <span className={`w-3 h-3 rounded-full mr-2 ${risk.riskLevel === 'HIGH' ? 'bg-[#FF4E4E]' : 'bg-yellow-400'}`}></span>
                            <span className="text-xs font-bold">{risk.riskLevel} PRIORITY</span>
                        </div>
                        <p className="font-medium text-sm border-l-2 border-gray-200 pl-3 italic">
                            "{risk.clause}"
                        </p>
                        <p className="text-xs mt-1 text-gray-500">
                            {risk.explanation}
                        </p>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-16 pt-6 border-t border-gray-200 flex justify-between text-xs text-gray-400 font-bold uppercase">
        <div>Generated by Google Gemini 3 Pro</div>
        <div>PolicyOracle v2.5 // Confidential</div>
      </div>
    </div>
  );
};
