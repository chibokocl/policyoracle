
import React, { useEffect, useState } from 'react';
import { PolicyAnalysis, MarketData } from '../types';
import { getPredictionMarkets } from '../services/marketService';
import { Griftometer } from './Griftometer';
import { FortuneMap } from './FortuneMap';
import { RealityCheck } from './RealityCheck';
import { DynamicVizPanel } from './MoneyFlow'; // Import the new Dynamic Component (which sits in MoneyFlow file for now)
import { ReportView } from './ReportView';
import { ChatPanel } from './ChatPanel';
import { GlobalBenchmarking } from './GlobalBenchmarking';
import { OpportunitiesPanel } from './OpportunitiesPanel';
import { GeoIntel } from './GeoIntel';
import { WarRoom } from './WarRoom';
import { DollarSign, FileText, Share2, Download, MessageSquareText, MapPin, Gamepad2, Database, Globe, Newspaper } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Search, X } from 'lucide-react'; 

interface DashboardProps {
  data: PolicyAnalysis;
  currentFile: File | string | null;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, currentFile, onReset }) => {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  
  // Risk Section State
  const [riskSearch, setRiskSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // UI States
  const [showReport, setShowReport] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showWarRoom, setShowWarRoom] = useState(false); // War Room State
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchMarkets = async () => {
      const searchTerms = data.gameTheoryQueries && data.gameTheoryQueries.length > 0 
        ? data.gameTheoryQueries 
        : data.sectors.map(s => s.name);
      
      const results = await getPredictionMarkets(searchTerms);
      setMarkets(results);
      setLoadingMarkets(false);
    };
    fetchMarkets();
  }, [data]);

  const filteredRisks = data.risks.filter(risk => {
    const searchLower = riskSearch.toLowerCase();
    const matchesSearch = risk.clause.toLowerCase().includes(searchLower) || 
                          risk.explanation.toLowerCase().includes(searchLower);
    const matchesFilter = riskFilter === 'ALL' || risk.riskLevel === riskFilter;
    return matchesSearch && matchesFilter;
  });

  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightRiskContent = (text: string) => {
    const riskKeywords = [
        "arbitrary", "discretionary", "as deemed fit", "sole discretion", 
        "waiver", "undefined", "exempt", "emergency", "no-bid", 
        "without limitation", "notwithstanding", "confidential", "secret",
        "private negotiation", "bypass"
    ];
    
    const pattern = riskKeywords.map(escapeRegExp).join('|');
    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = text.split(regex);
    
    return (
        <span>
            {parts.map((part, i) => {
                const isMatch = riskKeywords.some(k => k.toLowerCase() === part.toLowerCase());
                if (isMatch) {
                    return (
                        <span key={i} className="text-white px-1 py-0.5 rounded border-b font-bold animate-risk-glow transition-all duration-300">
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `PolicyOracle: ${data.policyTitle}`,
                text: `Analysis of ${data.country}: Corruption Score ${data.corruptionScore}/100.`,
                url: window.location.href
            });
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        alert("Link copied to clipboard! (Simulation)");
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('swiss-report');
    if (!element) return;
    
    setIsExporting(true);
    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save(`${data.policyTitle.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (err) {
        console.error("PDF Export failed", err);
        alert("Failed to generate PDF.");
    } finally {
        setIsExporting(false);
    }
  };

  const handleExternalLink = (url: string, query: string) => {
      let targetUrl = url;
      // If URL is invalid, empty, or a placeholder hash, fallback to Google Search
      if (!targetUrl || targetUrl === '#' || !targetUrl.startsWith('http')) {
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // --- WAR ROOM RENDER ---
  if (showWarRoom) {
      return (
          <WarRoom file={currentFile} analysis={data} onExit={() => setShowWarRoom(false)} />
      );
  }

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('polymarket')) return <Globe size={10} className="text-blue-400" />;
    if (p.includes('kalshi')) return <DollarSign size={10} className="text-green-400" />;
    if (p.includes('news')) return <Newspaper size={10} className="text-white" />;
    return <Database size={10} className="text-gray-400" />;
  };

  // Safe fallback for reality check if legacy data structure
  const summaryText = data.reportSections && data.reportSections.length > 0 
    ? data.reportSections[0].body 
    : (data as any).realityCheck || "Analysis complete.";

  return (
    <div className="space-y-6 animate-fadeIn pb-10 relative">
      
      {/* Top Bar: Doc Info & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-terminal-border pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center font-mono tracking-tighter">
            <FileText className="mr-3 text-terminal-accent" size={28} />
            {data.policyTitle || data.documentName}
          </h2>
          <div className="flex items-center space-x-4 mt-2">
             <span className="flex items-center text-sm font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-gray-800">
                <MapPin size={12} className="mr-1 text-terminal-accent" />
                {data.country.toUpperCase()}
             </span>
             <p className="text-xs text-gray-500 font-mono">
                SESSION ID: {data.timestamp.toString(36).toUpperCase()} // {new Date(data.timestamp).toLocaleTimeString()}
             </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
             <button 
                onClick={() => setShowWarRoom(true)}
                className="p-2 rounded transition-colors flex items-center space-x-2 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40"
                title="Enter War Room Simulator"
             >
                <Gamepad2 size={18} />
                <span className="font-mono font-bold text-xs hidden md:inline">WAR ROOM</span>
             </button>

             <button 
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded transition-colors flex items-center space-x-2 ${showChat ? 'bg-terminal-accent text-black' : 'text-terminal-accent bg-terminal-accent/10 hover:bg-terminal-accent/20'}`}
                title="Chat with Oracle"
             >
                <MessageSquareText size={18} />
                <span className="font-mono font-bold text-xs hidden md:inline">ASK ORACLE</span>
             </button>

             <button 
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Share Analysis"
             >
                <Share2 size={18} />
             </button>
             
             <button 
                onClick={() => setShowReport(true)}
                className="flex items-center space-x-2 bg-terminal-dark border border-gray-600 text-gray-300 px-4 py-2 rounded font-mono font-bold hover:bg-white/10 transition-colors text-xs"
             >
                <Download size={16} />
                <span>REPORT</span>
             </button>

             <button 
                onClick={onReset}
                className="px-4 py-2 bg-terminal-border hover:bg-white/20 text-xs font-mono font-bold text-white rounded transition-colors"
             >
                NEW DOC
             </button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel 
          file={currentFile} 
          onClose={() => setShowChat(false)} 
        />
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Row 1: Griftometer (3), Fortune (3), Dynamic Chart (6) */}
        <div className="md:col-span-3 h-[300px]">
          <Griftometer score={data.corruptionScore} />
        </div>

        <div className="md:col-span-3 h-[300px]">
          <FortuneMap sectors={data.sectors} />
        </div>

        <div className="md:col-span-6 h-[300px]">
            {/* Swapped MoneyFlow for DynamicVizPanel */}
            {data.visualData ? (
                <DynamicVizPanel data={data.visualData} />
            ) : (
                <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 h-full flex items-center justify-center text-gray-500 font-mono text-sm">
                    NO VISUAL DATA GENERATED
                </div>
            )}
        </div>

        {/* Row 2: Global Benchmarking, GeoIntel, Opportunities */}
        <div className="md:col-span-4 h-[400px]">
           <GlobalBenchmarking country={data.country} contexts={data.globalContext} />
        </div>

        <div className="md:col-span-4 h-[400px]">
           <GeoIntel country={data.country} sector={data.sectors[0]?.name || 'Economy'} />
        </div>

        <div className="md:col-span-4 h-[400px]">
           <OpportunitiesPanel opportunities={data.opportunities} />
        </div>

        {/* Row 3: Summary & Report Sections */}
        <div className="md:col-span-8 space-y-6">
            <RealityCheck text={summaryText} />

            {/* Render additional report sections as cards if available */}
            {data.reportSections && data.reportSections.slice(1).map((section, idx) => (
                <div key={idx} className="bg-terminal-dark border border-terminal-border rounded-lg p-6">
                    <h3 className="text-lg font-mono font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2">
                        {section.header.toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-400 font-mono leading-relaxed">
                        {section.body}
                    </p>
                </div>
            ))}
        </div>

        {/* Side Panel: Risks & Markets */}
        <div className="md:col-span-4 space-y-6">
            
            {/* Prediction Markets / Market Intelligence */}
            <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6">
                <h3 className="text-lg font-mono font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2 flex items-center justify-between">
                    <span>MARKET INTELLIGENCE</span>
                    {loadingMarkets ? 
                        <span className="text-xs animate-pulse text-terminal-accent">SYNCING...</span> :
                        <span className="text-[10px] text-green-500 flex items-center">● LIVE</span>
                    }
                </h3>
                <div className="space-y-3">
                    {markets.map((market, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleExternalLink(market.url, market.question)}
                            className={`block group bg-black/40 border border-gray-800 p-3 rounded hover:border-terminal-accent transition-all cursor-pointer relative overflow-hidden ${market.isSimulation ? 'opacity-80' : ''}`}
                        >
                            <div className="absolute top-0 right-0 bg-gray-900/80 text-gray-400 text-[9px] px-1.5 py-0.5 rounded-bl font-mono flex items-center space-x-1 border-l border-b border-gray-800">
                                {getPlatformIcon(market.platform)}
                                <span>{market.platform.toUpperCase()}</span>
                            </div>
                            
                            <p className="text-sm font-medium text-gray-200 group-hover:text-terminal-accent transition-colors line-clamp-2 pr-16 mt-2">
                                {market.question}
                            </p>
                            
                            <div className="flex justify-between items-center mt-3 font-mono text-xs">
                                <span className={`font-bold ${market.probability > 0.5 ? 'text-terminal-green' : 'text-gray-500'}`}>
                                    {(market.probability * 100).toFixed(0)}% PROBABILITY
                                </span>
                                <span className="text-gray-600">
                                    {market.volume}
                                </span>
                            </div>
                        </div>
                    ))}
                    {!loadingMarkets && markets.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-4">
                            No market data found for this context.
                        </div>
                    )}
                </div>
            </div>

            {/* High Risk Clauses */}
            <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 flex flex-col h-[600px]">
                 <div className="border-b border-gray-800 pb-4 mb-4">
                    <h3 className="text-lg font-mono font-bold text-gray-300 mb-3 text-terminal-red flex items-center justify-between">
                        RISK ANALYSIS
                        <span className="text-xs text-gray-500 font-normal">
                            {filteredRisks.length} DETECTED
                        </span>
                    </h3>
                    
                    {/* Search Input */}
                    <div className="relative mb-3 group">
                        <Search className="absolute left-3 top-2.5 text-gray-600 w-4 h-4 group-focus-within:text-terminal-accent transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search clauses..." 
                            className="w-full bg-black/40 border border-gray-700 rounded py-2 pl-9 pr-3 text-sm font-mono text-gray-300 focus:border-terminal-red focus:outline-none placeholder-gray-600 transition-colors"
                            value={riskSearch}
                            onChange={(e) => setRiskSearch(e.target.value)}
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex space-x-1">
                        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => setRiskFilter(level)}
                                className={`
                                    flex-1 text-[10px] py-1.5 rounded border font-mono font-bold transition-all
                                    ${riskFilter === level 
                                        ? 'bg-red-900/40 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                                        : 'bg-transparent border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-400'
                                    }
                                `}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredRisks.length > 0 ? (
                        filteredRisks.map((risk, i) => (
                            <div key={i} className="bg-red-950/10 border border-red-900/30 p-3 rounded hover:bg-red-950/20 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold font-mono border px-1.5 py-0.5 rounded
                                        ${risk.riskLevel === 'HIGH' ? 'text-red-500 border-red-900 bg-red-950/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 
                                          risk.riskLevel === 'MEDIUM' ? 'text-orange-500 border-orange-900 bg-orange-950/30' : 
                                          'text-yellow-500 border-yellow-900 bg-yellow-950/30'}
                                    `}>
                                        {risk.riskLevel}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 font-mono italic leading-relaxed border-l-2 border-red-900/50 pl-3 py-1">
                                    "{highlightRiskContent(risk.clause)}"
                                </p>
                                <p className="text-xs text-red-400/70 mt-2 pt-2 font-mono group-hover:text-red-400 transition-colors">
                                    <span className="font-bold text-red-500/50 mr-1">ANALYSIS:</span>
                                    {risk.explanation}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-600 font-mono text-xs border border-dashed border-gray-800 rounded">
                            NO RISKS MATCHING CRITERIA
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Hidden Report View for PDF Generation */}
      {showReport && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-auto p-4">
            <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-gray-100 p-4 border-b flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-black font-bold font-sans">Report Preview</h3>
                    <div className="flex space-x-2">
                        <button 
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="bg-black text-white px-4 py-2 rounded font-bold text-xs hover:bg-gray-800 flex items-center"
                        >
                            {isExporting ? 'GENERATING...' : 'DOWNLOAD PDF'}
                        </button>
                        <button onClick={() => setShowReport(false)} className="p-2 hover:bg-gray-200 rounded text-black">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto">
                    <ReportView data={data} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
