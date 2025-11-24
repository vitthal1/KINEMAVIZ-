import React from 'react';
import { MechanismParam } from '../types';
import { Sliders, RotateCw, Eye } from 'lucide-react';

interface ControlPanelProps {
  params: MechanismParam[];
  values: Record<string, number>;
  onChange: (id: string, value: number) => void;
  speed: number;
  setSpeed: (s: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  showTrace: boolean;
  toggleTrace: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    params, values, onChange, 
    speed, setSpeed, 
    isPlaying, togglePlay,
    showTrace, toggleTrace
}) => {
  return (
    <div className="bg-slate-950 border-t border-slate-800 p-6 z-20 shadow-xl shadow-black/50">
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-6">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-500" /> Configuration
             </h3>
             
             <div className="h-4 w-px bg-slate-800"></div>

             <button 
                onClick={toggleTrace}
                className={`text-xs font-medium flex items-center gap-2 px-2 py-1 rounded transition-colors ${showTrace ? 'text-sky-400 bg-sky-500/10' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <Eye className="w-3.5 h-3.5" /> Trace Path
             </button>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                <RotateCw className={`w-3.5 h-3.5 text-slate-400 ${isPlaying ? 'animate-spin' : ''}`} style={{animationDuration: '3s'}} />
                <input 
                    type="range" 
                    min="0" max="5" step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                />
            </div>
            <button 
                onClick={togglePlay}
                className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-lg
                    ${isPlaying 
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20' 
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'}
                `}
            >
                {isPlaying ? 'Pause' : 'Simulate'}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
        {params.map((param) => (
          <div key={param.id} className="relative group">
            <div className="flex justify-between mb-2 text-[10px] uppercase tracking-wider font-semibold">
                <label className="text-slate-400 group-hover:text-slate-300 transition-colors">{param.label}</label>
                <span className="text-sky-500 font-mono">{values[param.id]} <span className="text-slate-600">{param.unit}</span></span>
            </div>
            <div className="relative h-2">
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full"></div>
                <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={values[param.id] || param.value}
                    onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
                    className="absolute top-1/2 -translate-y-1/2 w-full h-4 opacity-0 cursor-pointer z-10"
                />
                <div 
                    className="absolute top-1/2 -translate-y-1/2 h-1 bg-sky-500 rounded-l-full pointer-events-none"
                    style={{ width: `${((values[param.id] - param.min) / (param.max - param.min)) * 100}%` }}
                ></div>
                <div 
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-lg pointer-events-none transition-transform group-hover:scale-125"
                    style={{ left: `${((values[param.id] - param.min) / (param.max - param.min)) * 100}%`, transform: 'translate(-50%, -50%)' }}
                ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlPanel;