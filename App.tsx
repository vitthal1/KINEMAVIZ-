import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MechanismCanvas from './components/MechanismCanvas';
import ControlPanel from './components/ControlPanel';
import InfoPanel from './components/InfoPanel';
import AnalysisCharts from './components/AnalysisCharts';
import { MECHANISMS } from './constants';
import { MechanismType, ChartDataPoint, MechanismState } from './types';

const App: React.FC = () => {
  const [activeMechId, setActiveMechId] = useState<MechanismType>(MechanismType.FOUR_BAR);
  const [params, setParams] = useState<Record<string, number>>({});
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTrace, setShowTrace] = useState(true);
  
  // Analysis Data State
  const [outputData, setOutputData] = useState<ChartDataPoint[]>([]);
  
  // Current Mechanism Definition
  const mechanism = MECHANISMS[activeMechId];

  // Initialize params when mechanism changes
  useEffect(() => {
    const defaults: Record<string, number> = {};
    mechanism.defaultParams.forEach(p => {
      defaults[p.id] = p.value;
    });
    setParams(defaults);
    setOutputData([]); // Clear graph
  }, [activeMechId, mechanism]);

  const handleParamChange = (id: string, value: number) => {
    setParams(prev => ({ ...prev, [id]: value }));
  };

  const handleDataUpdate = (angle: number, state: MechanismState) => {
    // Determine relevant metric for charting
    let metric = 0;
    
    // Auto-detect interesting output variable based on mechanism type
    if (state.joints.length > 0) {
        if (activeMechId === MechanismType.FOUR_BAR) {
             // Rocker Angle
             if (state.joints[3] && state.joints[2]) {
                 const J3 = state.joints[2]; // Coupler-Rocker joint
                 const J4 = state.joints[3]; // Ground
                 metric = Math.atan2(J3.y - J4.y, J3.x - J4.x);
             }
        } else if (activeMechId === MechanismType.SLIDER_CRANK) {
             // Piston X
             if (state.joints[2]) metric = state.joints[2].x;
        } else if (activeMechId === MechanismType.QUICK_RETURN) {
            // Ram X
            if (state.joints[4]) metric = state.joints[4].x;
        } else if (activeMechId === MechanismType.WATTS_LINKAGE || activeMechId === MechanismType.PEAUCELLIER) {
            // Output Y (deviation from straight line) or X
            const output = state.joints[state.joints.length - 1];
            metric = output.x; // Track X movement usually
        } else {
             // Fallback: Last joint Y
             metric = state.joints[state.joints.length - 1].y;
        }
    }

    setOutputData(prev => {
        // Keep buffer manageable
        const newData = [...prev, { angle, value: metric }];
        if (newData.length > 200) return newData.slice(newData.length - 200);
        return newData;
    });
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 overflow-hidden">
      <Sidebar 
        currentMechanism={activeMechId} 
        onSelect={setActiveMechId} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 flex relative overflow-hidden">
            {/* Charts Overlay */}
            <div className="absolute top-4 right-4 w-72 z-20 pointer-events-none opacity-90">
                <AnalysisCharts 
                    data={outputData} 
                    label="Output Metric" 
                    color="#38bdf8" 
                />
            </div>

            <MechanismCanvas 
                mechanism={mechanism} 
                params={params} 
                speed={speed} 
                isPlaying={isPlaying}
                showTrace={showTrace}
                onDataUpdate={handleDataUpdate}
            />
        </div>
        
        <ControlPanel 
            params={mechanism.defaultParams} 
            values={params} 
            onChange={handleParamChange}
            speed={speed}
            setSpeed={setSpeed}
            isPlaying={isPlaying}
            togglePlay={() => setIsPlaying(!isPlaying)}
            showTrace={showTrace}
            toggleTrace={() => setShowTrace(!showTrace)}
        />
      </main>

      <InfoPanel 
        mechanismType={activeMechId} 
        mechanismName={mechanism.name} 
        currentParams={params} 
      />
    </div>
  );
};

export default App;