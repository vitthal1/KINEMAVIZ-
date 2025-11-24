import React, { useState, useEffect, useRef } from 'react';
import { generateMechanismExplanation, chatWithMechanism } from '../services/geminiService';
import { BrainCircuit, Send, Loader2, Bot, User, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MechanismType } from '../types';

interface InfoPanelProps {
  mechanismType: MechanismType;
  mechanismName: string;
  currentParams: Record<string, number>;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ mechanismType, mechanismName, currentParams }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      const paramsStr = JSON.stringify(currentParams);
      const text = await generateMechanismExplanation(mechanismName, paramsStr);
      setExplanation(text || 'No information available.');
      setLoading(false);
      
      setChatHistory([{
        role: 'model',
        content: `I'm ready to analyze the ${mechanismName} with you. Ask about forces, velocities, or applications.`
      }]);
    };

    // Debounce slightly to avoid hammering API on slide
    const timeoutId = setTimeout(fetchInfo, 500);
    return () => clearTimeout(timeoutId);
  }, [mechanismType, mechanismName, currentParams]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    const response = await chatWithMechanism(chatHistory, userMsg);
    
    setChatHistory(prev => [...prev, { role: 'model', content: response || "I couldn't process that." }]);
    setChatLoading(false);
  };

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 shadow-2xl z-30">
      <div className="flex border-b border-slate-800">
        <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
            ${activeTab === 'info' ? 'text-sky-400 border-b-2 border-sky-500 bg-slate-800' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            <BrainCircuit className="w-4 h-4" /> Engineering Data
        </button>
        <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
            ${activeTab === 'chat' ? 'text-sky-400 border-b-2 border-sky-500 bg-slate-800' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            <MessageSquare className="w-4 h-4" /> AI Assistant
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50">
        {activeTab === 'info' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-sky-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-sky-500" />
                    </div>
                </div>
                <p className="text-xs font-mono uppercase tracking-widest animate-pulse">Running Analysis...</p>
            </div>
          ) : (
            <div className="p-6 prose prose-invert prose-sm max-w-none prose-headings:text-sky-100 prose-p:text-slate-300 prose-strong:text-sky-400 prose-li:text-slate-300">
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
          )
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-6 p-4">
                {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-sky-600' : 'bg-indigo-600'}`}>
                            {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                        </div>
                        <div className={`rounded-2xl p-4 text-sm max-w-[85%] shadow-md ${msg.role === 'user' ? 'bg-sky-500/10 border border-sky-500/20 text-sky-100' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                           <ReactMarkdown components={{p: ({node, ...props}) => <p className="mb-0" {...props} />}}>
                             {msg.content}
                           </ReactMarkdown>
                        </div>
                    </div>
                ))}
                {chatLoading && (
                    <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                <form onSubmit={handleChatSubmit} className="relative">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about torque, velocity, or friction..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                    />
                    <button 
                        type="submit" 
                        disabled={chatLoading || !chatInput.trim()} 
                        className="absolute right-2 top-2 p-1.5 bg-sky-600 rounded-lg text-white hover:bg-sky-500 disabled:opacity-50 disabled:hover:bg-sky-600 transition-colors shadow-lg"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;