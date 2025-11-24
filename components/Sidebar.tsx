import React from 'react';
import { MECHANISMS } from '../constants';
import { MechanismType } from '../types';
import { GitGraph, Activity, Box, Cpu } from 'lucide-react';

interface SidebarProps {
  currentMechanism: MechanismType;
  onSelect: (m: MechanismType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMechanism, onSelect }) => {
  // Group mechanisms
  const groups: Record<string, typeof MECHANISMS[MechanismType][]> = {};
  Object.values(MECHANISMS).forEach(mech => {
    if (!groups[mech.category]) groups[mech.category] = [];
    groups[mech.category].push(mech);
  });

  return (
    <div className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0 select-none">
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-sky-500/10 p-2 rounded-lg">
            <GitGraph className="w-6 h-6 text-sky-500" />
        </div>
        <div>
            <span className="font-bold text-lg tracking-wider text-slate-100 block leading-none">KINEMA<span className="text-sky-500">VIZ</span></span>
            <span className="text-[10px] font-semibold text-sky-500 uppercase tracking-[0.2em] relative -top-0.5 left-0.5">Professional</span>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        {Object.entries(groups).map(([category, items]) => (
            <div key={category} className="mb-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
                    {category === 'Basic Linkages' ? <Box className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                    {category}
                </h3>
                <div className="space-y-1">
                {items.map((mech) => (
                    <button
                    key={mech.id}
                    onClick={() => onSelect(mech.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-3 group
                        ${currentMechanism === mech.id 
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                    >
                    <Activity className={`w-4 h-4 ${currentMechanism === mech.id ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />
                    <span>{mech.name}</span>
                    </button>
                ))}
                </div>
            </div>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950">
        <div className="text-[10px] text-slate-600 font-mono">
          <p>Engine: Gemini 2.5 Flash</p>
          <p>Solver: Runge-Kutta (Simulated)</p>
          <p className="mt-2 text-sky-900">v2.1.0-RC</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;