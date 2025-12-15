
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WarRoomSession, generatePersonas } from '../services/geminiService';
import { getPredictionMarkets } from '../services/marketService';
import { WarRoomTurn, PersonaConfig, PolicyAnalysis, PersonaType, SimulationState } from '../types';
import { Shield, Briefcase, Flag, Globe, Send, AlertTriangle, CheckCircle2, XCircle, PlayCircle, RotateCcw, Gavel, Lightbulb, Radio, Activity, Zap, Users, BrainCircuit, Loader2, Sparkles, ChevronUp, Command, Plus, UserPlus, Gauge, Flame, Target, Crosshair } from 'lucide-react';

interface WarRoomProps {
  file: File | string | null;
  analysis: PolicyAnalysis;
  onExit: () => void;
}

// Fallback moves if AI generation is delayed or empty
const getGenericMoves = (type: PersonaType): string[] => {
    switch(type) {
        case 'CORPORATION': return ['Lobby for tax exemptions', 'Threaten market exit', 'Launch PR campaign', 'File judicial review'];
        case 'PROTESTOR': return ['Organize mass rally', 'Viral social media boycott', 'Occupy infrastructure', 'Leak internal memos'];
        case 'FOREIGN_STATE': return ['Impose tariffs', 'Fund opposition groups', 'Cyber operation', 'Diplomatic protest'];
        case 'INVESTOR': return ['Short key assets', 'Capital flight', 'Demand board seat', 'Hostile takeover'];
        case 'REGULATOR': return ['Audit compliance', 'Freeze assets', 'Issue fines', 'Revoke licenses'];
        case 'CUSTOM': return ['Gather intelligence', 'Form strategic alliance', 'Issue public statement', 'Consult legal counsel'];
        default: return ['Analyze situation', 'Wait for signal'];
    }
};

export const WarRoom: React.FC<WarRoomProps> = ({ file, analysis, onExit }) => {
  const [stage, setStage] = useState<'LOADING' | 'SELECT' | 'SIMULATION'>('LOADING');
  const [personas, setPersonas] = useState<PersonaConfig[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<PersonaConfig | null>(null);
  const [session, setSession] = useState<WarRoomSession | null>(null);
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<WarRoomTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [intelText, setIntelText] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [liveStrategies, setLiveStrategies] = useState<string[]>([]);
  
  // Simulation State Tracking
  const [currentSimState, setCurrentSimState] = useState<SimulationState>({
      regime: 'STABLE',
      gprIndex: 85,
      interestRate: 5.5,
      inflation: 3.2,
      reserves: "$16.8B",
      privateCredit: 'EXPANDING'
  });

  // Custom Persona State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customObj, setCustomObj] = useState('');

  // Suggestion State
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Computed Theater Metrics
  const conflictLevel = useMemo(() => {
    const score = analysis.corruptionScore;
    if (score >= 80) return { label: 'HOSTILE', color: 'text-red-500', border: 'border-red-900', bg: 'bg-red-950/30' };
    if (score >= 50) return { label: 'VOLATILE', color: 'text-orange-500', border: 'border-orange-900', bg: 'bg-orange-950/30' };
    return { label: 'STABLE', color: 'text-terminal-green', border: 'border-green-900', bg: 'bg-green-950/30' };
  }, [analysis.corruptionScore]);

  // Initial Persona Generation
  useEffect(() => {
    const initPersonas = async () => {
        try {
            const sectors = analysis.sectors.map(s => s.name);
            // Extract full risk clauses for context
            const risks = analysis.risks ? analysis.risks.map(r => r.clause) : [];
            const generated = await generatePersonas(analysis.country, analysis.documentName, sectors, risks);
            setPersonas(generated);
            setStage('SELECT');
        } catch (e) {
            console.error("Persona Init Failed", e);
            // Fallback
            setPersonas([
                { id: 'CORPORATION', name: 'Standard Corp', description: 'Generic entity', demographics: 'N/A', psychographics: 'Profit-driven', objective: 'Maximize shareholder value', suggestedMoves: ['Lobby'] }
            ]);
            setStage('SELECT');
        }
    };
    initPersonas();
  }, [analysis.country, analysis.documentName, analysis.sectors, analysis.risks]);

  // Initialize Session
  useEffect(() => {
    if (file && selectedPersona) {
       const init = async () => {
           const s = new WarRoomSession();
           
           // Inject rich context including the new psycho/demographics AND OBJECTIVE
           const richDescription = `
             ${selectedPersona.description}
             [DEMOGRAPHICS]: ${selectedPersona.demographics || 'Custom User Defined'}
             [PSYCHOGRAPHICS]: ${selectedPersona.psychographics || 'Custom User Defined'}
             [OBJECTIVE]: ${selectedPersona.objective}
           `;
           
           await s.loadContext(file, selectedPersona.name, richDescription);
           
           // 1. Fetch Real-time Intel (General)
           setIsEnriching(true);
           const intelData = await s.enrichContext(analysis.country, analysis.documentName);
           setIntelText(intelData.summary);
           
           // Deduplicate live strategies
           const rawStrategies = (intelData.liveStrategies || []) as string[];
           const uniqueLive = Array.from(new Set(rawStrategies));
           setLiveStrategies(uniqueLive);

           // 2. Fetch Prediction Markets for Game Theory (Specific)
           // Use AI-generated queries if available, otherwise construct relevant queries
           const gameTheoryQueries = analysis.gameTheoryQueries && analysis.gameTheoryQueries.length > 0 
              ? analysis.gameTheoryQueries 
              : [
                  `${analysis.country} ${analysis.sectors[0]?.name || 'economy'} outlook`,
                  `${analysis.country} political stability forecast`,
                  `Global prediction market ${analysis.sectors[0]?.name || 'tech'}`
                ];
           
           // Fetch and format
           const markets = await getPredictionMarkets(gameTheoryQueries);
           const relevantMarkets = markets
                .filter(m => !m.isSimulation) // Prefer real data
                .slice(0, 5) // Top 5
                .map(m => `[ODDS] ${m.question}: ${(m.probability * 100).toFixed(0)}% (${m.platform})`)
                .join('; ');

           if (relevantMarkets) {
               await s.integrateGameTheory(relevantMarkets);
           }
           
           setIsEnriching(false);
           setSession(s);
       };
       init();
    }
  }, [file, selectedPersona, analysis.country, analysis.documentName, analysis.sectors, analysis.gameTheoryQueries]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  // Reset active suggestion when input changes
  useEffect(() => {
    setActiveSuggestionIndex(-1);
    setShowAutocomplete(input.trim().length > 0);
  }, [input]);

  const handleStart = (p: PersonaConfig) => {
    setSelectedPersona(p);
    setStage('SIMULATION');
  };

  const handleCustomSubmit = () => {
      if (!customName || !customDesc) return;
      const newPersona: PersonaConfig = {
          id: 'CUSTOM',
          name: customName,
          description: customDesc,
          objective: customObj || 'Survival',
          demographics: 'Custom User Origin',
          psychographics: 'Adaptive/Strategic',
          suggestedMoves: ['Assess key vulnerabilities', 'Identify potential allies', 'Review legal framework']
      };
      setSelectedPersona(newPersona);
      setStage('SIMULATION');
      setIsCustomizing(false);
  };

  const handleMove = async (manualAction?: string) => {
    const action = manualAction || input;
    if (!action.trim() || !session) return;
    
    setInput('');
    setShowAutocomplete(false);
    setIsLoading(true);

    try {
        const turn = await session.submitMove(action);
        setTurns(prev => [...prev, turn]);
        // Update simulation state if returned
        if (turn.simState) {
            setCurrentSimState(turn.simState);
        }
    } catch (e) {
        alert("Simulation Error: The engine could not process that move.");
    } finally {
        setIsLoading(false);
    }
  };

  const triggerGPRShock = () => {
      handleMove("SYSTEM INJECTION: TRIGGER MAJOR GEOPOLITICAL RISK (GPR) SHOCK. IMPACT ENERGY SECTOR.");
  };

  // --- Suggestion Logic ---
  const allSuggestions = useMemo(() => {
    const live = liveStrategies || [];
    const personaMoves = selectedPersona?.suggestedMoves || [];
    
    // Combine context-aware moves first
    let combined = [...live, ...personaMoves];
    
    // Only add defaults if we have very few suggestions to maintain high relevance
    if (combined.length < 4 && selectedPersona) {
        combined = [...combined, ...getGenericMoves(selectedPersona.id)];
    }
    
    // Deduplicate
    const unique = Array.from(new Set(combined));
    
    return unique.length > 0 ? unique : ['Analyze Market', 'Wait for signal', 'Gather Intelligence'];
  }, [liveStrategies, selectedPersona]);

  const filteredSuggestions = useMemo(() => {
    if (!input.trim()) return [];
    const lowerInput = input.toLowerCase();
    return allSuggestions.filter(s => s.toLowerCase().includes(lowerInput) && s.toLowerCase() !== lowerInput);
  }, [input, allSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const nextIndex = activeSuggestionIndex < filteredSuggestions.length - 1 ? activeSuggestionIndex + 1 : 0;
        setActiveSuggestionIndex(nextIndex);
        setInput(filteredSuggestions[nextIndex]);
    } else if (e.key === 'Enter') {
        if (activeSuggestionIndex >= 0) {
            e.preventDefault();
            setInput(filteredSuggestions[activeSuggestionIndex]);
            setActiveSuggestionIndex(-1);
            setShowAutocomplete(false);
        } else {
            handleMove();
        }
    } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
    }
  };

  const getLastTurn = () => turns[turns.length - 1];

  const getOutcomeColor = (outcome?: string) => {
      if (outcome === 'SUCCESS') return 'text-terminal-green border-terminal-green';
      if (outcome === 'FAILURE') return 'text-terminal-red border-terminal-red';
      return 'text-terminal-accent border-terminal-accent';
  };

  const renderGauge = (label: string, value: number, inverse: boolean = false) => {
      // For Risk/Exposure, High is Bad (Red). For Reward, High is Good (Green).
      let colorClass = 'bg-gray-500';
      if (inverse) {
         if (value < 40) colorClass = 'bg-terminal-green';
         else if (value < 70) colorClass = 'bg-terminal-accent';
         else colorClass = 'bg-terminal-red';
      } else {
         if (value < 40) colorClass = 'bg-terminal-red';
         else if (value < 70) colorClass = 'bg-terminal-accent';
         else colorClass = 'bg-terminal-green';
      }

      return (
          <div className="mb-4">
              <div className="flex justify-between text-xs font-mono mb-1 text-gray-400">
                  <span>{label.toUpperCase()}</span>
                  <span className="text-white font-bold">{value}%</span>
              </div>
              <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
                  <div className={`h-full transition-all duration-700 ${colorClass}`} style={{ width: `${value}%` }}></div>
              </div>
          </div>
      );
  };

  if (stage === 'LOADING') {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <Loader2 size={48} className="text-terminal-accent animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-white font-mono tracking-tighter">CALIBRATING POPULATION MODELS</h2>
            <p className="text-gray-500 font-mono mt-2 text-sm text-center max-w-md">
                Analyzing demographic data and psychographic profiles for {analysis.country}...
            </p>
        </div>
      );
  }

  if (stage === 'SELECT') {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto relative">
              {/* Custom Persona Modal Overlay */}
              {isCustomizing && (
                  <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-terminal-dark border border-terminal-accent rounded-lg max-w-md w-full p-6 shadow-[0_0_30px_rgba(255,153,0,0.1)]">
                          <h3 className="text-xl font-bold text-white font-mono mb-4 flex items-center">
                              <UserPlus size={20} className="mr-2 text-terminal-accent" />
                              CREATE CUSTOM PERSONA
                          </h3>
                          <div className="space-y-4 font-mono">
                              <div>
                                  <label className="block text-xs text-gray-500 mb-1">DESIGNATION / NAME</label>
                                  <input 
                                      value={customName}
                                      onChange={e => setCustomName(e.target.value)}
                                      className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-terminal-accent focus:outline-none"
                                      placeholder="e.g. The Whistleblower"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs text-gray-500 mb-1">BACKGROUND & ROLE</label>
                                  <textarea 
                                      value={customDesc}
                                      onChange={e => setCustomDesc(e.target.value)}
                                      className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-terminal-accent focus:outline-none h-20"
                                      placeholder="Who are they and what is their role in this scenario?"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs text-gray-500 mb-1">STRATEGIC OBJECTIVE</label>
                                  <input 
                                      value={customObj}
                                      onChange={e => setCustomObj(e.target.value)}
                                      className="w-full bg-black border border-gray-700 rounded p-2 text-white focus:border-terminal-accent focus:outline-none"
                                      placeholder="e.g. Expose corruption without legal fallout"
                                  />
                              </div>
                              <div className="flex space-x-3 pt-4">
                                  <button onClick={handleCustomSubmit} className="flex-1 bg-terminal-accent text-black font-bold py-2 rounded hover:bg-yellow-500 transition-colors">
                                      INITIALIZE
                                  </button>
                                  <button onClick={() => setIsCustomizing(false)} className="px-4 py-2 border border-gray-700 text-gray-400 rounded hover:text-white hover:border-gray-500">
                                      CANCEL
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-terminal-accent font-mono tracking-tighter mb-4">WAR ROOM SIMULATOR</h2>
                  
                  {/* Dynamic Theater Details - Enhanced */}
                  <div className="max-w-2xl mx-auto bg-black/40 border border-gray-800 rounded-lg p-4 mb-6 backdrop-blur-sm">
                      <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                          {/* Theater Location */}
                          <div className="flex flex-col items-center justify-center border-r border-gray-800">
                              <div className="text-gray-500 mb-1 flex items-center space-x-1">
                                  <Globe size={12} />
                                  <span>THEATER</span>
                              </div>
                              <div className="text-white font-bold text-lg uppercase tracking-wider">{analysis.country}</div>
                              <div className="text-[9px] text-gray-600 mt-1">LAT/LONG: CLASSIFIED</div>
                          </div>

                          {/* Threat Level */}
                          <div className="flex flex-col items-center justify-center border-r border-gray-800">
                              <div className="text-gray-500 mb-1 flex items-center space-x-1">
                                  <Crosshair size={12} />
                                  <span>THREAT LEVEL</span>
                              </div>
                              <div className={`font-bold text-lg uppercase tracking-wider ${conflictLevel.color} flex items-center`}>
                                  {conflictLevel.label}
                                  <span className={`ml-2 w-2 h-2 rounded-full ${conflictLevel.bg} ${conflictLevel.color} animate-pulse shadow-[0_0_8px_currentColor]`}></span>
                              </div>
                              <div className="text-[9px] text-gray-600 mt-1">SCORE: {analysis.corruptionScore}/100</div>
                          </div>

                          {/* Primary Sector */}
                          <div className="flex flex-col items-center justify-center">
                              <div className="text-gray-500 mb-1 flex items-center space-x-1">
                                  <Target size={12} />
                                  <span>KEY VECTOR</span>
                              </div>
                              <div className="text-white font-bold text-lg uppercase tracking-wider truncate max-w-[120px]">
                                  {analysis.sectors[0]?.name || 'GENERAL'}
                              </div>
                              <div className="text-[9px] text-gray-600 mt-1">
                                  {analysis.sectors.length > 1 ? `+${analysis.sectors.length - 1} OTHER SECTORS` : 'SINGLE FRONT'}
                              </div>
                          </div>
                      </div>
                  </div>

                  <p className="text-gray-500 max-w-lg mx-auto font-mono text-sm">
                      Select your strategic persona. Profiles have been calibrated to real-world population distributions and current market sentiment.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full mb-8">
                  {personas.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handleStart(p)}
                        className="bg-terminal-dark border border-terminal-border p-6 rounded-lg text-left hover:border-terminal-accent hover:bg-white/5 transition-all group relative overflow-hidden flex flex-col h-[340px]"
                      >
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              {p.id === 'CORPORATION' && <Briefcase size={64} />}
                              {p.id === 'PROTESTOR' && <Flag size={64} />}
                              {p.id === 'FOREIGN_STATE' && <Globe size={64} />}
                              {p.id === 'INVESTOR' && <Shield size={64} />}
                              {p.id === 'REGULATOR' && <Gavel size={64} />}
                          </div>
                          
                          <div className="relative z-10 flex flex-col h-full">
                              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-terminal-accent transition-colors font-mono">{p.name}</h3>
                              <p className="text-xs text-gray-400 mb-4 h-12 overflow-hidden">{p.description}</p>
                              
                              <div className="space-y-2 mb-4 flex-1">
                                  <div className="flex items-start space-x-2">
                                      <Users size={12} className="text-gray-500 mt-0.5 shrink-0" />
                                      <p className="text-[10px] text-gray-500 font-mono leading-tight">
                                        <span className="text-gray-400 font-bold block mb-0.5">DEMOGRAPHICS</span>
                                        {p.demographics}
                                      </p>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                      <BrainCircuit size={12} className="text-gray-500 mt-0.5 shrink-0" />
                                      <p className="text-[10px] text-gray-500 font-mono leading-tight">
                                        <span className="text-gray-400 font-bold block mb-0.5">PSYCHOGRAPHICS</span>
                                        {p.psychographics}
                                      </p>
                                  </div>
                              </div>

                              <div className="text-xs font-mono text-gray-500 bg-black/30 p-2 rounded border border-gray-800 mt-auto truncate">
                                  OBJ: {p.objective}
                              </div>
                          </div>
                      </button>
                  ))}

                  {/* Create Custom Persona Card */}
                  <button 
                    onClick={() => setIsCustomizing(true)}
                    className="bg-black/40 border border-terminal-border border-dashed p-6 rounded-lg text-left hover:border-terminal-accent hover:bg-white/5 transition-all group flex flex-col items-center justify-center h-[340px] text-gray-500 hover:text-white"
                  >
                      <Plus size={48} className="mb-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-bold font-mono">CREATE CUSTOM</h3>
                      <p className="text-xs text-gray-600 mt-2 font-mono">Define your own strategic actor</p>
                  </button>
              </div>

              <button onClick={onExit} className="text-gray-500 hover:text-white flex items-center space-x-2 font-mono text-sm">
                  <RotateCcw size={14} />
                  <span>RETURN TO DASHBOARD</span>
              </button>
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-140px)] grid grid-cols-12 gap-6 animate-in slide-in-from-right-10 duration-500">
        
        {/* Left Col: Interaction */}
        <div className="col-span-8 flex flex-col bg-terminal-dark border border-terminal-border rounded-lg overflow-hidden relative">
            {/* Header with Markov Regime State */}
            <div className="p-4 border-b border-gray-800 bg-black/20 flex justify-between items-center z-10">
                <div className="flex items-center space-x-3">
                    <div className="bg-terminal-accent text-black p-1 rounded">
                        {selectedPersona?.id === 'CORPORATION' && <Briefcase size={16} />}
                        {selectedPersona?.id === 'PROTESTOR' && <Flag size={16} />}
                        {selectedPersona?.id === 'FOREIGN_STATE' && <Globe size={16} />}
                        {selectedPersona?.id === 'INVESTOR' && <Shield size={16} />}
                        {selectedPersona?.id === 'REGULATOR' && <Gavel size={16} />}
                        {selectedPersona?.id === 'CUSTOM' && <UserPlus size={16} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white font-mono">{selectedPersona?.name}</h3>
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-gray-500 font-mono">TURN {turns.length + 1}</span>
                            <span className="text-[10px] text-gray-600 font-mono">|</span>
                            <span className={`text-[10px] font-bold font-mono flex items-center ${currentSimState.regime === 'VOLATILE' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                                {currentSimState.regime === 'VOLATILE' ? <Flame size={10} className="mr-1" /> : <Gauge size={10} className="mr-1" />}
                                {currentSimState.regime} REGIME
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Situation Ticker: Macro Indicators */}
                <div className="flex-1 mx-4 overflow-hidden hidden md:block">
                     <div className="text-[10px] font-mono text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-end space-x-4">
                        <span className="flex items-center" title="Geopolitical Risk Index">
                            <Globe size={10} className="mr-1 text-blue-400" />
                            GPR: {currentSimState.gprIndex}
                        </span>
                        <span className="flex items-center" title="Interest Rate">
                            <Activity size={10} className="mr-1 text-yellow-400" />
                            RATES: {currentSimState.interestRate}%
                        </span>
                        <span className="flex items-center" title="Foreign Reserves">
                            <Briefcase size={10} className="mr-1 text-green-400" />
                            FX: {currentSimState.reserves}
                        </span>
                     </div>
                </div>

                <button onClick={onExit} className="text-gray-500 hover:text-red-500 ml-3">
                    <XCircle size={20} />
                </button>
            </div>
            
            {/* Intel Briefing Panel */}
            <div className={`border-b border-gray-800 bg-black/40 p-3 transition-all duration-500 ${isEnriching || intelText ? 'max-h-32' : 'max-h-0 opacity-0'} overflow-y-auto custom-scrollbar z-10`}>
                 <div className="flex items-start space-x-2">
                     <Radio size={14} className={`mt-0.5 shrink-0 ${isEnriching ? 'text-yellow-500 animate-spin' : 'text-terminal-green'}`} />
                     <div className="font-mono text-xs text-gray-400">
                         {isEnriching ? (
                             <span className="text-yellow-500">ACCESSING EMBASSY CABLES & MARKET DATA...</span>
                         ) : (
                             <span className="leading-relaxed">
                                 <strong className="text-terminal-green block mb-1">SITUATION REPORT // {new Date().toLocaleDateString()}</strong>
                                 {intelText}
                             </span>
                         )}
                     </div>
                 </div>
            </div>

            {/* Turn History / Chat */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative" ref={scrollRef}>
                {/* Intro Message */}
                <div className="flex justify-start">
                    <div className="bg-white/5 border border-gray-700 rounded-lg p-4 max-w-[80%]">
                        <p className="text-sm text-gray-300 font-mono leading-relaxed">
                            <span className="text-terminal-accent font-bold">SYSTEM:</span> Simulation initialized for <span className="uppercase text-white">{analysis.country}</span>. 
                            Policy constraints loaded. Your objective is: <span className="text-white italic">{selectedPersona?.objective}</span>.
                            <br/><br/>State your first strategic move.
                        </p>
                    </div>
                </div>

                {turns.map((turn, i) => (
                    <div key={turn.id} className="space-y-4">
                        {/* User Move */}
                        <div className="flex justify-end">
                             <div className="bg-terminal-accent/10 border border-terminal-accent/30 rounded-lg p-4 max-w-[80%] text-right">
                                <p className="text-xs text-terminal-accent font-bold mb-1 font-mono">STRATEGIC ACTION</p>
                                <p className="text-sm text-white font-mono">{turn.userAction}</p>
                             </div>
                        </div>

                        {/* AI Response */}
                        <div className="flex justify-start relative">
                             {/* Connector Line */}
                             <div className="absolute left-[-20px] top-0 bottom-0 w-0.5 bg-gray-800"></div>
                             
                             <div className={`border rounded-lg p-4 max-w-[85%] ${getOutcomeColor(turn.outcome)} bg-black/40`}>
                                <div className="flex justify-between items-start mb-2 border-b border-gray-800 pb-2">
                                    <span className="font-bold font-mono text-sm flex items-center">
                                        {turn.outcome === 'SUCCESS' && <CheckCircle2 size={14} className="mr-2" />}
                                        {turn.outcome === 'FAILURE' && <XCircle size={14} className="mr-2" />}
                                        {turn.outcome === 'STALEMATE' && <AlertTriangle size={14} className="mr-2" />}
                                        OUTCOME: {turn.outcome}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed font-mono mb-3">
                                    {turn.narrative}
                                </p>
                                {turn.relevantClause && turn.relevantClause !== 'N/A' && (
                                    <div className="bg-black/30 p-2 rounded border border-gray-800 text-xs font-mono text-gray-500 italic">
                                        " ...{turn.relevantClause}... "
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="bg-transparent p-4 flex items-center space-x-3 text-terminal-accent animate-pulse font-mono text-sm">
                            <PlayCircle size={16} className="animate-spin" />
                            <span>CALCULATING PROBABILITIES...</span>
                        </div>
                     </div>
                )}
            </div>

            {/* Suggested Strategies UI - Fixed at bottom above input */}
            <div className="bg-black/90 border-t border-gray-800 px-4 py-2 z-20">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-2">
                    <div className="flex items-center space-x-2">
                        <Lightbulb size={10} className="text-terminal-accent" />
                        <span>TACTICAL OPTIONS</span>
                    </div>
                    {/* Visual scroll indicator */}
                    <div className="hidden md:flex space-x-1">
                        <div className="w-1 h-1 bg-terminal-accent rounded-full opacity-50"></div>
                        <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                    </div>
                </div>
                
                {/* Scrollable list */}
                <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar min-h-[36px]">
                    <button
                        onClick={triggerGPRShock}
                        disabled={isLoading}
                        className="whitespace-nowrap bg-red-900/20 hover:bg-red-900/40 border border-red-800 text-red-400 px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center space-x-1 shrink-0 disabled:opacity-50"
                    >
                        <Zap size={10} className="text-red-500" />
                        <span>INJECT GPR SHOCK</span>
                    </button>
                    
                    {allSuggestions.map((move, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setInput(move); inputRef.current?.focus(); }}
                            disabled={isLoading}
                            className="whitespace-nowrap bg-white/5 hover:bg-white/10 hover:border-terminal-accent border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center space-x-1 shrink-0 disabled:opacity-50"
                        >
                           <Command size={10} className="text-gray-500" />
                           <span>{move}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input with Autocomplete */}
            <div className="p-4 bg-black border-t border-gray-800 relative z-30">
                
                {/* Autocomplete Suggestions Overlay */}
                {showAutocomplete && filteredSuggestions.length > 0 && !isLoading && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 bg-terminal-dark border border-gray-700 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                        <div className="bg-black/80 px-3 py-1.5 text-[10px] font-mono text-gray-500 border-b border-gray-800 flex justify-between items-center backdrop-blur-sm">
                            <span>AUTOCOMPLETE MATCHES</span>
                            <span className="flex items-center space-x-1">
                                <span className="bg-gray-800 px-1 rounded">TAB</span>
                                <span className="bg-gray-800 px-1 rounded">ARROWS</span>
                                <span>to select</span>
                            </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {filteredSuggestions.slice(0, 8).map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setInput(suggestion);
                                        setActiveSuggestionIndex(-1);
                                        setShowAutocomplete(false);
                                        inputRef.current?.focus();
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-mono border-b border-gray-800/50 last:border-0 transition-colors flex items-center justify-between group
                                        ${idx === activeSuggestionIndex ? 'bg-terminal-accent/10 text-terminal-accent' : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                                    `}
                                >
                                    <span className="flex items-center truncate">
                                        <Sparkles size={12} className={`mr-3 flex-shrink-0 ${idx === activeSuggestionIndex ? 'text-terminal-accent' : 'text-gray-600 group-hover:text-terminal-accent'}`} />
                                        <span className="truncate">{suggestion}</span>
                                    </span>
                                    {idx === activeSuggestionIndex && <span className="text-[10px] text-gray-500 ml-2 whitespace-nowrap"><ChevronUp size={10} className="inline mr-1" />ENTER</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative">
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Command the ${selectedPersona?.name}...`}
                        className="w-full bg-terminal-dark border border-gray-700 rounded pl-4 pr-12 py-3 text-white font-mono focus:border-terminal-accent focus:outline-none placeholder-gray-600 transition-colors"
                        disabled={isLoading}
                        autoComplete="off"
                    />
                    <button 
                        onClick={() => handleMove()}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-terminal-accent disabled:opacity-30 transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* Right Col: Scorecard & Tree */}
        <div className="col-span-4 flex flex-col space-y-6">
            
            {/* Scorecard */}
            <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-white font-mono mb-4 border-b border-gray-800 pb-2 flex items-center">
                    <Shield size={16} className="mr-2 text-terminal-accent" />
                    SCENARIO SCORECARD
                </h3>
                
                {getLastTurn() ? (
                    <div className="animate-in fade-in duration-500">
                        {renderGauge("Projected Reward", getLastTurn().scorecard.potentialReward, false)}
                        {renderGauge("Operational Risk", getLastTurn().scorecard.userRisk, true)}
                        {renderGauge("Legal Exposure", getLastTurn().scorecard.legalExposure, true)}
                        
                        <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                            <div className="text-xs text-gray-500 font-mono mb-1">STATUS</div>
                            <div className={`text-2xl font-bold font-mono ${getLastTurn().outcome === 'SUCCESS' ? 'text-terminal-green' : getLastTurn().outcome === 'FAILURE' ? 'text-terminal-red' : 'text-yellow-500'}`}>
                                {getLastTurn().outcome}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-600 font-mono text-sm border border-dashed border-gray-800 rounded">
                        NO DATA AVAILABLE
                        <br/><span className="text-[10px]">INITIATE TURN 1</span>
                    </div>
                )}
            </div>

            {/* Decision Tree Viz */}
            <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white font-mono mb-4 border-b border-gray-800 pb-2 flex items-center">
                    <Globe size={16} className="mr-2 text-terminal-accent" />
                    DECISION MATRIX
                </h3>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar relative pl-4">
                    {/* Visual Tree Line */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-800"></div>

                    {turns.length === 0 && (
                        <div className="text-xs text-gray-600 font-mono ml-4">Waiting for input...</div>
                    )}

                    {turns.map((turn, i) => (
                        <div key={i} className="mb-6 relative ml-4 group">
                             <div className={`absolute -left-[21px] top-3 w-4 h-0.5 ${turn.outcome === 'SUCCESS' ? 'bg-terminal-green' : 'bg-red-500'}`}></div>
                             <div className={`absolute -left-[25px] top-1.5 w-3 h-3 rounded-full border-2 bg-terminal-dark z-10 ${turn.outcome === 'SUCCESS' ? 'border-terminal-green' : turn.outcome === 'FAILURE' ? 'border-terminal-red' : 'border-yellow-500'}`}></div>
                             
                             <div className="bg-black/50 border border-gray-800 p-2 rounded text-[10px] font-mono hover:bg-white/5 transition-colors cursor-default">
                                <div className="text-gray-400 mb-1 truncate max-w-[200px]">{turn.userAction}</div>
                                <div className={`${turn.outcome === 'SUCCESS' ? 'text-terminal-green' : 'text-red-500'} font-bold`}>
                                    {turn.outcome}
                                </div>
                             </div>
                        </div>
                    ))}
                    
                    {/* Next Node Placeholder */}
                    {turns.length > 0 && (
                        <div className="ml-4 relative opacity-30">
                             <div className="absolute -left-[21px] top-3 w-4 h-0.5 bg-gray-600"></div>
                             <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full border-2 border-gray-600 bg-terminal-dark z-10"></div>
                             <div className="bg-gray-900 border border-gray-800 p-2 rounded text-[10px] font-mono text-gray-500">
                                ...
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
