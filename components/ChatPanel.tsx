import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Terminal, Loader2, Cpu, Zap } from 'lucide-react';
import { PolicyChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  file: File | string | null;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ file, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Secure channel established. I have read the policy document. What details do you need classified or clarified?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<PolicyChatSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initSession = async () => {
      if (file) {
        const s = new PolicyChatSession();
        await s.loadContext(file);
        setSession(s);
      }
    };
    initSession();
  }, [file]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !session) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const responseText = await session.sendMessage(userMsg);
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "ERROR: Uplink interrupted. Please try again.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeepDive = () => {
    setInput("Perform a 'Special Deep Dive' analysis on the most hidden risks in this document that regular analysis might miss.");
    // Auto submit would require separate logic, just setting input for user to confirm is safer UX, 
    // but user asked to "force" it. Let's call send immediately.
    setTimeout(() => {
        // We can't easily call handleSend here due to state closure on 'input', 
        // so we manually trigger the logic.
        const msg = "Perform a 'Special Deep Dive' analysis on the most hidden risks in this document.";
        setMessages(prev => [...prev, { role: 'user', text: msg, timestamp: Date.now() }]);
        setIsLoading(true);
        session?.sendMessage(msg).then(res => {
            setMessages(prev => [...prev, { role: 'model', text: res, timestamp: Date.now() }]);
            setIsLoading(false);
        });
    }, 100);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-black border border-terminal-accent shadow-[0_0_30px_rgba(255,153,0,0.2)] rounded-lg flex flex-col z-[80] font-mono animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-terminal-border bg-terminal-dark">
        <div className="flex items-center space-x-2 text-terminal-accent">
          <Terminal size={16} />
          <span className="font-bold text-sm">ORACLE LINK // ENCRYPTED</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/90" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-terminal-border text-white rounded-br-none' 
                : 'bg-terminal-dark border border-gray-800 text-terminal-text rounded-bl-none shadow-lg'
            }`}>
              {msg.role === 'model' && <Cpu size={12} className="mb-1 text-terminal-accent" />}
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-terminal-dark border border-gray-800 p-3 rounded rounded-bl-none">
               <Loader2 size={16} className="animate-spin text-terminal-accent" />
             </div>
           </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 bg-terminal-dark border-t border-terminal-border">
        {/* Quick Actions */}
        <div className="flex space-x-2 mb-2 overflow-x-auto pb-1">
             <button 
                onClick={handleDeepDive}
                className="flex items-center space-x-1 px-2 py-1 bg-purple-900/30 border border-purple-500/50 text-purple-300 text-[10px] rounded hover:bg-purple-900/50 transition-colors whitespace-nowrap"
             >
                <Zap size={10} />
                <span>FORCE DEEP SCAN</span>
             </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query the Oracle..."
            className="w-full bg-black border border-gray-700 rounded pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-terminal-accent"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 text-terminal-accent disabled:opacity-50 hover:text-white transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
