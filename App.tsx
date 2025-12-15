
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { UploadZone } from './components/UploadZone';
import { Dashboard } from './components/Dashboard';
import { analyzePolicyDocument, analyzePolicyUrl } from './services/geminiService';
import { AppState, PolicyAnalysis } from './types';
import { AlertTriangle, Terminal, RefreshCw, ShieldX, WifiOff } from 'lucide-react';

const HISTORY_KEY = 'policy_oracle_history';
const MAX_HISTORY_ITEMS = 10;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [analysisData, setAnalysisData] = useState<PolicyAnalysis | null>(null);
  const [currentFile, setCurrentFile] = useState<File | string | null>(null); // Store file for chat context
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<PolicyAnalysis[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveToHistory = (newAnalysis: PolicyAnalysis) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.documentName !== newAnalysis.documentName);
      const updated = [newAnalysis, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const handleFileSelect = async (file: File) => {
    setAppState(AppState.ANALYZING);
    setErrorMessage(null);
    setCurrentFile(file);
    
    try {
      const result = await analyzePolicyDocument(file);
      setAnalysisData(result);
      saveToHistory(result);
      setAppState(AppState.DASHBOARD);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Failed to analyze document. Ensure API Key is set and file is valid PDF.");
      setAppState(AppState.ERROR);
    }
  };

  const handleUrlSelect = async (url: string) => {
    setAppState(AppState.ANALYZING);
    setErrorMessage(null);
    setCurrentFile(url);

    try {
      const result = await analyzePolicyUrl(url);
      setAnalysisData(result);
      saveToHistory(result);
      setAppState(AppState.DASHBOARD);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Failed to analyze URL. The link might be inaccessible or the API key is missing.");
      setAppState(AppState.ERROR);
    }
  };

  const handleHistorySelect = (analysis: PolicyAnalysis) => {
    setAnalysisData(analysis);
    setCurrentFile(analysis.documentName); // We only have the name in history, so Chat context might be limited to URL text if reloaded
    setAppState(AppState.DASHBOARD);
    setErrorMessage(null);
  };

  const resetApp = () => {
    setAnalysisData(null);
    setCurrentFile(null);
    setAppState(AppState.UPLOAD);
    setErrorMessage(null);
  };

  // Helper to categorize errors
  const getErrorDetails = (msg: string | null) => {
    const m = msg || "";
    if (m.toLowerCase().includes("api key")) {
      return {
        code: "ERR_AUTH_01",
        title: "Authentication Failed",
        steps: ["Verify your .env file contains a valid API_KEY.", "Check if your billing account is active."],
        icon: <ShieldX className="w-12 h-12 text-red-500 mb-4" />
      };
    } else if (m.toLowerCase().includes("fetch") || m.toLowerCase().includes("network")) {
      return {
        code: "ERR_NET_02",
        title: "Network Connection Lost",
        steps: ["Check your internet connection.", "Verify firewall settings are not blocking the API."],
        icon: <WifiOff className="w-12 h-12 text-red-500 mb-4" />
      };
    } else if (m.toLowerCase().includes("json")) {
      return {
        code: "ERR_PARSE_03",
        title: "Data Parsing Error",
        steps: ["The AI response format was invalid.", "The document content might be too complex or garbled.", "Try re-uploading the file."],
        icon: <Terminal className="w-12 h-12 text-red-500 mb-4" />
      };
    }
    return {
      code: "ERR_SYS_99",
      title: "System Malfunction",
      steps: ["Consult system logs for details.", "Restart the application session.", "Ensure the document is a readable PDF."],
      icon: <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
    };
  };

  return (
    <Layout 
      recentAnalyses={history} 
      onHistorySelect={handleHistorySelect}
      onClearHistory={clearHistory}
      currentView={appState}
      onBack={resetApp}
    >
      {appState === AppState.UPLOAD && (
        <UploadZone 
          onFileSelect={handleFileSelect} 
          onUrlSelect={handleUrlSelect}
          isAnalyzing={false} 
        />
      )}

      {appState === AppState.ANALYZING && (
        <UploadZone 
          onFileSelect={() => {}} 
          onUrlSelect={() => {}}
          isAnalyzing={true} 
        />
      )}

      {appState === AppState.DASHBOARD && analysisData && (
        <Dashboard 
          data={analysisData} 
          currentFile={currentFile} 
          onReset={resetApp} 
        />
      )}

      {appState === AppState.ERROR && (
        <div className="flex flex-col items-center justify-center h-[60vh] px-4">
            <div className="bg-terminal-dark border border-red-900 rounded-lg max-w-lg w-full shadow-[0_0_20px_rgba(239,68,68,0.2)] overflow-hidden">
                
                {/* Error Header */}
                <div className="bg-red-950/30 p-6 flex flex-col items-center text-center border-b border-red-900/50">
                    {getErrorDetails(errorMessage).icon}
                    <h3 className="text-xl font-bold text-red-400 font-mono tracking-tight">
                        {getErrorDetails(errorMessage).title}
                    </h3>
                    <div className="mt-2 text-xs font-mono text-red-700 bg-red-950/50 px-2 py-1 rounded border border-red-900/50">
                        CODE: {getErrorDetails(errorMessage).code}
                    </div>
                </div>

                {/* Technical Details */}
                <div className="p-6 space-y-4">
                    <div className="bg-black/40 p-3 rounded border border-gray-800">
                        <p className="text-xs text-gray-500 font-bold mb-1 font-mono uppercase">Exception Message</p>
                        <p className="text-sm font-mono text-gray-300 break-words">
                            {errorMessage || "Unknown Error"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 font-bold mb-2 font-mono uppercase">Troubleshooting Steps</p>
                        <ul className="space-y-2">
                            {getErrorDetails(errorMessage).steps.map((step, idx) => (
                                <li key={idx} className="flex items-start text-sm text-gray-400">
                                    <span className="text-red-500 mr-2">➜</span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button 
                        onClick={resetApp}
                        className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-500 text-white py-3 rounded font-mono font-bold transition-all flex items-center justify-center group"
                    >
                        <RefreshCw size={16} className="mr-2 group-hover:rotate-180 transition-transform duration-500" />
                        REBOOT SESSION
                    </button>
                </div>
            </div>
            
            <p className="mt-6 text-xs text-gray-600 font-mono">
                If the problem persists, verify your Gemini API quota limits.
            </p>
        </div>
      )}
    </Layout>
  );
};

export default App;
