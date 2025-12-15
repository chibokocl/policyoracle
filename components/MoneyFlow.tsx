
import React, { useState } from 'react';
import { Sankey, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { VisualIntelligence, DataPoint } from '../types';
import { Info, BarChart2, PieChart as PieIcon, Activity, GitMerge } from 'lucide-react';

interface DynamicVizProps {
  data: VisualIntelligence;
}

export const DynamicVizPanel: React.FC<DynamicVizProps> = ({ data }) => {
  const [showInfo, setShowInfo] = useState(false);
  const { chartType, dataPoints, headline, description } = data;

  // --- RENDERERS ---

  const renderSankey = () => {
      // Sankey data transformation
      // We need unique nodes and indexed links
      const uniqueNodes = new Set<string>();
      dataPoints.forEach(dp => {
          uniqueNodes.add(dp.label);
          if(dp.target) uniqueNodes.add(dp.target);
      });
      const nodes = Array.from(uniqueNodes).map(name => ({ name }));
      
      const nodeMap = new Map(nodes.map((n, i) => [n.name, i]));
      
      const links = dataPoints
        .filter(dp => dp.target)
        .map(dp => ({
          source: nodeMap.get(dp.label) || 0,
          target: nodeMap.get(dp.target!) || 0,
          value: dp.value
        }));

      if (links.length === 0) return <div className="text-gray-500 text-xs p-4">Insuficient link data for flow chart.</div>;

      return (
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={{ nodes, links }}
            node={{ stroke: '#333', strokeWidth: 1, width: 10 }}
            nodePadding={50}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            link={{ stroke: '#ff9900', strokeOpacity: 0.3 }}
          >
            <RechartsTooltip />
          </Sankey>
        </ResponsiveContainer>
      );
  };

  const renderBar = () => (
      <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dataPoints} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="label" stroke="#666" fontSize={10} tickLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} />
              <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                  itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#ff9900" radius={[4, 4, 0, 0]} />
          </BarChart>
      </ResponsiveContainer>
  );

  const renderPie = () => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#ff9900', '#FF4E4E'];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataPoints}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {dataPoints.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip 
               contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
               itemStyle={{ color: '#fff' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}}/>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderStat = () => {
     // Generally assumes one main stat, but we'll map the first one
     const stat = dataPoints[0];
     return (
         <div className="flex flex-col items-center justify-center h-full">
             <div className="text-6xl font-mono font-bold text-terminal-accent tracking-tighter">
                 {stat.value.toLocaleString()}
                 {stat.meta && <span className="text-2xl text-gray-500 ml-1">{stat.meta}</span>}
             </div>
             <div className="text-lg text-white font-mono mt-2 uppercase tracking-widest">{stat.label}</div>
         </div>
     );
  };

  const getIcon = () => {
      switch(chartType) {
          case 'SANKEY': return <GitMerge size={16} className="text-terminal-accent" />;
          case 'BAR': return <BarChart2 size={16} className="text-terminal-accent" />;
          case 'PIE': return <PieIcon size={16} className="text-terminal-accent" />;
          case 'STAT': return <Activity size={16} className="text-terminal-accent" />;
          default: return <Activity size={16} className="text-terminal-accent" />;
      }
  };

  return (
    <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 h-full flex flex-col relative group">
      <h3 className="text-lg font-mono font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2 flex justify-between items-center">
        <span className="flex items-center space-x-2">
            {getIcon()}
            <span className="truncate max-w-[200px] uppercase">{headline || "KEY METRIC"}</span>
        </span>
        <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 hidden sm:inline font-mono">{chartType} VIZ</span>
            <button 
                className="text-gray-500 hover:text-terminal-accent transition-colors relative"
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                onClick={() => setShowInfo(!showInfo)}
                aria-label="Methodology Info"
            >
                <Info size={14} />
            </button>
        </div>
      </h3>

      {/* Info Popup */}
      {showInfo && (
        <div className="absolute top-12 right-4 z-[60] w-64 bg-black/95 border border-gray-700 p-4 rounded shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md text-xs text-gray-300 font-mono leading-relaxed animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-white font-bold mb-2 border-b border-gray-800 pb-1">AI INSIGHT</h4>
            <p>{description}</p>
        </div>
      )}
      
      {/* Explicit Height Container to fix Recharts width(-1) error */}
      <div className="w-full h-[200px] min-h-[200px] relative">
        {chartType === 'SANKEY' && renderSankey()}
        {chartType === 'BAR' && renderBar()}
        {chartType === 'PIE' && renderPie()}
        {chartType === 'STAT' && renderStat()}
        {!['SANKEY', 'BAR', 'PIE', 'STAT'].includes(chartType) && (
            <div className="flex items-center justify-center h-full text-gray-600 font-mono">
                NO VISUAL DATA
            </div>
        )}
      </div>
      
      <div className="mt-2 text-center text-[10px] text-gray-600 font-mono">
         Generated by Gemini 3 Pro
      </div>
    </div>
  );
};
