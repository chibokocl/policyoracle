import React, { useEffect, useState } from 'react';
import { getGeoIntelligence } from '../services/geminiService';
import { Map, Crosshair, ExternalLink, Satellite, Layers, Loader2, Navigation } from 'lucide-react';

interface GeoIntelProps {
  country: string;
  sector: string;
}

export const GeoIntel: React.FC<GeoIntelProps> = ({ country, sector }) => {
  const [data, setData] = useState<{ text: string, webSources: any[], mapSources: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchIntel = async () => {
      // Small delay to allow UI to settle before firing another AI request
      await new Promise(r => setTimeout(r, 500));
      if (!mounted) return;
      
      const result = await getGeoIntelligence(country, sector);
      if (mounted) {
        setData(result);
        setLoading(false);
      }
    };
    fetchIntel();
    return () => { mounted = false; };
  }, [country, sector]);

  return (
    <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 h-full flex flex-col relative overflow-hidden group">
       {/* Background Grid Effect */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.8)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none"></div>

      <h3 className="text-lg font-mono font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2 flex justify-between items-center relative z-10">
        <span className="flex items-center space-x-2">
            <Satellite size={18} className={`text-terminal-accent ${loading ? 'animate-pulse' : ''}`} />
            <span>GEOSPATIAL INTEL</span>
        </span>
        <div className="flex items-center space-x-2">
            {loading ? (
                 <span className="text-[10px] bg-yellow-900/30 text-yellow-500 px-2 py-0.5 rounded font-mono animate-pulse">
                    ACQUIRING SIGNAL...
                 </span>
            ) : (
                <span className="text-[10px] bg-green-900/30 text-green-500 px-2 py-0.5 rounded font-mono flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                    LIVE LINK
                 </span>
            )}
        </div>
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                <Loader2 size={32} className="text-terminal-accent animate-spin" />
                <div className="font-mono text-xs text-center">
                    <div>SCANNING TRADE ROUTES IN <span className="text-white uppercase">{country}</span>...</div>
                    <div className="text-gray-500 mt-1">CROSS-REFERENCING LOGISTICS HUBS</div>
                </div>
            </div>
        ) : !data ? (
            <div className="text-center py-10 text-red-500 font-mono text-xs border border-dashed border-red-900 rounded bg-red-950/10">
                SATELLITE LINK LOST
            </div>
        ) : (
            <div className="space-y-4">
                {/* Map Locations */}
                {data.mapSources.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                        {data.mapSources.slice(0, 4).map((map, idx) => (
                            <a 
                                key={idx} 
                                href={map.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-black/40 border border-gray-800 p-2 rounded hover:border-terminal-accent hover:bg-white/5 transition-all group/item"
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded bg-terminal-dark border border-gray-700 flex items-center justify-center shrink-0">
                                        <Map size={14} className="text-terminal-accent" />
                                    </div>
                                    <div className="truncate">
                                        <div className="text-xs font-bold text-gray-200 group-hover/item:text-white truncate">{map.title}</div>
                                        <div className="text-[9px] text-gray-500 font-mono">LAT/LONG CONFIRMED</div>
                                    </div>
                                </div>
                                <ExternalLink size={12} className="text-gray-600 group-hover/item:text-terminal-accent" />
                            </a>
                        ))}
                    </div>
                )}

                {/* Analysis Text */}
                <div className="bg-terminal-dark/50 p-3 rounded border border-gray-800 text-xs text-gray-400 font-mono leading-relaxed relative">
                    <div className="absolute -left-1 top-3 bottom-3 w-0.5 bg-gray-700"></div>
                     <span className="text-terminal-accent font-bold">TACTICAL ANALYSIS:</span> {data.text}
                </div>

                {/* Web Sources */}
                {data.webSources.length > 0 && (
                     <div className="border-t border-gray-800 pt-3">
                        <div className="text-[10px] text-gray-500 font-mono mb-2 uppercase flex items-center">
                            <Layers size={10} className="mr-1" /> Related Intelligence
                        </div>
                        <div className="space-y-1">
                            {data.webSources.slice(0, 2).map((web, idx) => (
                                <a key={idx} href={web.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-400 hover:underline truncate">
                                    > {web.title}
                                </a>
                            ))}
                        </div>
                     </div>
                )}
            </div>
        )}
      </div>

      {/* Decorative HUD Elements */}
      <div className="absolute bottom-2 right-2 text-[8px] font-mono text-gray-700 pointer-events-none">
          IMG_SAT_V2.0 // {new Date().toISOString().split('T')[0]}
      </div>
    </div>
  );
};
