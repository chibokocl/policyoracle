
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Radio, History, Clock, ChevronRight, Trash2, Database, X, FileText, ArrowLeft, LayoutGrid, RefreshCw, MapPin } from 'lucide-react';
import { PolicyAnalysis, TickerItem } from '../types';
import { getLiveTickerData } from '../services/marketService';

interface LayoutProps {
  children: React.ReactNode;
  recentAnalyses?: PolicyAnalysis[];
  onHistorySelect?: (analysis: PolicyAnalysis) => void;
  onClearHistory?: () => void;
  currentView?: string;
  onBack?: () => void;
}

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, disabled = false }) => (
  <div className="group relative flex items-center">
    {children}
    {!disabled && (
      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 border border-gray-700 text-gray-300 text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        {text}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-700"></div>
      </div>
    )}
  </div>
);

const RegistryModal = ({ sessions, onSelect, onClose, onClear }: { 
    sessions: PolicyAnalysis[], 
    onSelect: (s: PolicyAnalysis) => void, 
    onClose: () => void, 
    onClear?: () => void 
}) => (
  <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-terminal-dark border border-terminal-border rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] relative">
       {/* Header */}
       <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <div className="flex items-center space-x-3">
             <div className="bg-terminal-accent/10 p-2 rounded">
                <Database className="text-terminal-accent" size={20} />
             </div>
             <div>
                <h2 className="text-lg font-mono font-bold text-white tracking-tight leading-none">SESSION REGISTRY</h2>
                <p className="text-[10px] text-gray-500 font-mono mt-1">ARCHIVED ANALYSES // LOCAL STORAGE</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded">
             <X size={20} />
          </button>
       </div>
       
       {/* List */}
       <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
          {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600 space-y-4 border border-dashed border-gray-800 rounded mx-4">
                  <Database size={48} className="opacity-20" />
                  <div className="font-mono text-sm">NO ARCHIVED SESSIONS FOUND</div>
              </div>
          ) : (
              sessions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => { onSelect(s); onClose(); }}
                    className="w-full bg-terminal-dark border border-gray-800 hover:border-terminal-accent hover:bg-white/5 p-4 rounded-lg text-left transition-all group flex items-center justify-between shadow-sm hover:shadow-md"
                  >
                      <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center space-x-2 mb-1.5">
                              <FileText size={14} className="text-gray-500 group-hover:text-terminal-accent shrink-0" />
                              <span className="font-bold text-gray-200 font-mono text-sm truncate">{s.policyTitle || s.documentName}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-[10px] text-gray-500 font-mono">
                              <span className="flex items-center">
                                  <Clock size={10} className="mr-1.5" />
                                  {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 border border-gray-700">{s.country}</span>
                          </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 shrink-0">
                          <div className={`text-[10px] font-bold font-mono px-2 py-1 rounded border min-w-[80px] text-center ${s.corruptionScore > 50 ? 'border-red-900 text-red-500 bg-red-950/20' : 'border-green-900 text-green-500 bg-green-950/20'}`}>
                              RISK: {s.corruptionScore}
                          </div>
                          <ChevronRight size={18} className="text-gray-700 group-hover:text-terminal-accent transition-colors" />
                      </div>
                  </button>
              ))
          )}
       </div>

       {/* Footer */}
       <div className="p-4 border-t border-gray-800 bg-black/40 flex justify-between items-center">
           <span className="text-xs text-gray-600 font-mono">{sessions.length} SESSIONS ARCHIVED</span>
           {sessions.length > 0 && onClear && (
               <button 
                  onClick={() => { if(confirm('Clear all session history?')) onClear(); }}
                  className="flex items-center space-x-2 text-xs text-red-500 hover:text-red-400 font-mono transition-colors hover:bg-red-950/20 px-3 py-1.5 rounded"
               >
                  <Trash2 size={12} />
                  <span>CLEAR REGISTRY</span>
               </button>
           )}
       </div>
    </div>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  recentAnalyses = [], 
  onHistorySelect,
  onClearHistory,
  currentView,
  onBack
}) => {
  const [registryOpen, setRegistryOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([
      { symbol: "SYSTEM", price: "INITIALIZING", change: "...", trend: "FLAT" }
  ]);
  const [tickerLoading, setTickerLoading] = useState(true);
  const [locationFound, setLocationFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchTicker = async () => {
        let coords: { lat: number, lng: number } | undefined;
        
        // Attempt to get location for local context
        try {
            const pos: GeolocationPosition = await new Promise((resolve, reject) => {
                // Short timeout to fallback to global quickly if permission prompt ignored
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
            });
            coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            if (mounted) setLocationFound(true);
        } catch (e) {
            console.log("Geolocation skipped or denied, using global feed.");
        }

        if (!mounted) return;

        try {
            const data = await getLiveTickerData(coords);
            if (mounted) {
                setTickerItems(data);
                setTickerLoading(false);
            }
        } catch (e) {
            console.error("Ticker init failed");
        }
    };
    
    fetchTicker();
    
    // Refresh ticker every 2 minutes
    const interval = setInterval(() => fetchTicker(), 120000);
    return () => {
        mounted = false;
        clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-terminal-black text-terminal-text font-sans selection:bg-terminal-accent selection:text-black flex flex-col">
      {/* Terminal Header */}
      <header className="border-b border-terminal-border bg-terminal-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            {currentView === 'DASHBOARD' && onBack && (
               <button 
                 onClick={onBack}
                 className="text-gray-400 hover:text-terminal-accent transition-colors flex items-center space-x-1 pr-3 border-r border-gray-800"
                 title="Back to Upload"
               >
                 <ArrowLeft size={18} />
                 <span className="text-xs font-mono font-bold hidden sm:inline">BACK</span>
               </button>
            )}

            <div className="flex items-center space-x-3">
                <div className="bg-terminal-accent text-black p-1 rounded-sm">
                  <Terminal size={20} />
                </div>
                <h1 className="text-xl font-mono font-bold tracking-tight text-terminal-accent">
                  POLICY<span className="text-white">ORACLE</span>
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-xs font-mono bg-terminal-border rounded text-gray-400">
                  v2.5.0 BETA
                </span>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm font-mono">
            
            {/* Registry Button */}
            <Tooltip text="View Analysis Registry" disabled={registryOpen}>
              <button 
                onClick={() => setRegistryOpen(true)}
                className={`flex items-center space-x-2 transition-colors ${registryOpen ? 'text-terminal-accent' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutGrid size={16} />
                <span className="hidden sm:inline">REGISTRY</span>
              </button>
            </Tooltip>

            {/* Status */}
            <Tooltip text="System Online // Gemini-3-Pro">
              <div className="flex items-center text-terminal-green space-x-2 cursor-help">
                <Radio size={14} className="animate-pulse" />
                <span className="hidden sm:inline">ONLINE</span>
              </div>
            </Tooltip>
            
          </div>
        </div>
        
        {/* Ticker Tape Aesthetic */}
        <div className="bg-terminal-black border-b border-terminal-border overflow-hidden whitespace-nowrap py-1 relative flex items-center">
          {locationFound && (
             <div className="absolute left-0 top-0 bottom-0 bg-terminal-black z-10 px-2 flex items-center border-r border-gray-800 text-terminal-accent">
                 <MapPin size={10} className="mr-1" />
                 <span className="text-[10px] font-mono font-bold">LOCAL</span>
             </div>
          )}
          <div className="inline-block animate-marquee text-xs font-mono text-gray-500">
             {/* Duplicate map for seamless loop effect */}
             {[...tickerItems, ...tickerItems].map((item, idx) => (
                 <span key={idx} className="mx-4">
                     <span className="text-white font-bold">{item.symbol}</span> {item.price} 
                     <span className={`ml-2 ${item.trend === 'UP' ? 'text-terminal-green' : item.trend === 'DOWN' ? 'text-red-500' : 'text-gray-400'}`}>
                         {item.trend === 'UP' ? '▲' : item.trend === 'DOWN' ? '▼' : '▬'} {item.change}
                     </span>
                     <span className="text-gray-700 mx-4">|</span>
                 </span>
             ))}
             <span className="mx-4 text-terminal-accent font-bold">LIVE FEED ACTIVE</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 relative">
        {children}
      </main>

      <footer className="border-t border-terminal-border py-4 bg-terminal-dark text-center text-xs font-mono text-gray-600">
        POLICY ORACLE © 2025 // SECURE CONNECTION // POWERED BY GOOGLE GENAI
      </footer>

      {/* Session Registry Modal */}
      {registryOpen && (
          <RegistryModal 
             sessions={recentAnalyses} 
             onSelect={onHistorySelect!} 
             onClose={() => setRegistryOpen(false)}
             onClear={onClearHistory}
          />
      )}
    </div>
  );
};
