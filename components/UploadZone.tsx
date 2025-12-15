import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2, ShieldAlert, Link as LinkIcon, ArrowRight, Terminal } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onUrlSelect: (url: string) => void;
  isAnalyzing: boolean;
}

const URL_DRAFT_KEY = 'policy_oracle_url_draft';

const ANALYSIS_LOGS = [
  "INITIALIZING SECURE UPLINK...",
  "HANDSHAKE ESTABLISHED // GEMINI-3-PRO",
  "DECRYPTING DOCUMENT STREAM...",
  "PARSING TEXTUAL STRUCTURES...",
  "IDENTIFYING KEY INDUSTRIAL SECTORS...",
  "EXTRACTING FINANCIAL MANDATES...",
  "ANALYZING RISK VECTORS...",
  "CALCULATING GRIFTOMETER SCORE...",
  "CROSS-REFERENCING HISTORICAL DATA...",
  "SYNTHESIZING FINAL REPORT..."
];

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, onUrlSelect, isAnalyzing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize with draft from localStorage if available
  const [urlInput, setUrlInput] = useState(() => {
    try {
      return localStorage.getItem(URL_DRAFT_KEY) || '';
    } catch (e) {
      return '';
    }
  });

  // Auto-save URL to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(URL_DRAFT_KEY, urlInput);
    } catch (e) {
      console.warn('Failed to save URL draft to localStorage');
    }
  }, [urlInput]);

  // Handle analysis log animation
  useEffect(() => {
    if (!isAnalyzing) {
      setLogs([]);
      return;
    }

    setLogs(["STARTING ANALYSIS SEQUENCE..."]);
    let step = 0;

    const interval = setInterval(() => {
      if (step < ANALYSIS_LOGS.length) {
        setLogs(prev => [...prev, ANALYSIS_LOGS[step]]);
        step++;
      } else {
        clearInterval(interval);
      }
    }, 800); // Add a new log line every 800ms

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        setError("Invalid file type. Please upload a PDF.");
      }
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        setError("Invalid file type. Please upload a PDF.");
      }
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput);
      onUrlSelect(urlInput);
    } catch (_) {
      setError("Please enter a valid URL (e.g., https://example.com/policy.pdf)");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto px-4">
      {/* File Upload Area */}
      <div 
        className={`
          relative w-full rounded-lg border-2 border-dashed transition-all duration-300
          flex flex-col items-center justify-center text-center
          ${isAnalyzing ? 'p-0 border-terminal-accent bg-black border-opacity-50 h-80 overflow-hidden' : 'p-10 mb-8 border-terminal-border bg-terminal-dark hover:border-gray-500'}
          ${dragActive && !isAnalyzing ? 'border-terminal-accent bg-terminal-accent/10' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!isAnalyzing && (
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept="application/pdf"
          />
        )}

        {isAnalyzing ? (
          <div className="w-full h-full flex flex-col bg-black font-mono text-left p-4 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-accent animate-pulse shadow-[0_0_10px_#ff9900]"></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 z-10">
                {logs.map((log, i) => (
                    <div key={i} className="text-xs md:text-sm text-green-500">
                        <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                        <span className="text-terminal-accent">admin@oracle:~$</span> {log}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
            <div className="mt-4 pt-2 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-terminal-accent animate-spin" />
                    <span className="text-xs text-gray-400">PROCESSING...</span>
                </div>
                <div className="text-xs text-gray-600">CPU: 98% // MEM: 64%</div>
            </div>
            
            {/* Matrix-like background effect */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-terminal-border flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-300" />
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Upload Policy Document</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Drag & drop a government policy PDF (e.g., "The Green Act 2024.pdf") to initialize the Analyst Engine.
            </p>

            <button className="bg-terminal-accent text-black px-6 py-3 rounded font-bold font-mono hover:bg-yellow-500 transition-colors">
              SELECT FILE
            </button>
          </>
        )}

        {error && !isAnalyzing && (
          <div className="absolute -bottom-16 flex items-center text-red-500 bg-red-950/30 px-4 py-2 rounded border border-red-900 z-10">
            <AlertCircle size={18} className="mr-2" />
            <span className="text-sm font-mono">{error}</span>
          </div>
        )}
      </div>

      {!isAnalyzing && (
        <>
          <div className="flex items-center w-full mb-8">
            <div className="h-px bg-terminal-border flex-1"></div>
            <span className="px-4 text-gray-500 font-mono text-sm">OR ANALYZE URL</span>
            <div className="h-px bg-terminal-border flex-1"></div>
          </div>

          <form onSubmit={handleUrlSubmit} className="w-full flex space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="url"
                className="block w-full pl-10 pr-3 py-3 bg-terminal-dark border border-terminal-border rounded focus:ring-1 focus:ring-terminal-accent focus:border-terminal-accent placeholder-gray-600 text-white font-mono text-sm"
                placeholder="https://whitehouse.gov/briefing-room/legislation/policy.pdf"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="bg-terminal-border hover:bg-terminal-accent hover:text-black text-white px-6 py-3 rounded font-mono font-bold transition-colors flex items-center"
            >
              ANALYZE <ArrowRight size={16} className="ml-2" />
            </button>
          </form>

          <div className="mt-8 flex items-center space-x-8 text-gray-600">
             <div className="flex items-center space-x-2">
               <FileText size={16} />
               <span className="text-sm font-mono">PDF SUPPORTED</span>
             </div>
             <div className="flex items-center space-x-2">
               <ShieldAlert size={16} />
               <span className="text-sm font-mono">ENCRYPTED UPLOAD</span>
             </div>
          </div>
        </>
      )}
    </div>
  );
};