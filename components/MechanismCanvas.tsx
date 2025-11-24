import React, { useRef, useEffect, useState } from 'react';
import { MechanismDef } from '../types';

interface MechanismCanvasProps {
  mechanism: MechanismDef;
  params: Record<string, number>;
  speed: number;
  isPlaying: boolean;
  showTrace: boolean;
  onDataUpdate: (angle: number, state: any) => void;
}

const MechanismCanvas: React.FC<MechanismCanvasProps> = ({ mechanism, params, speed, isPlaying, showTrace, onDataUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(0);
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  
  // Trace buffer
  const traceRef = useRef<{x: number, y: number}[]>([]);

  // Reset angle and trace when mechanism changes
  useEffect(() => {
    setAngle(0);
    traceRef.current = [];
  }, [mechanism.id, params]); // Also clear trace on param change

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      if (isPlaying) {
        setAngle(prev => (prev + (speed * deltaTime * 0.002)) % (Math.PI * 2));
      }
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Background
    const gradient = ctx.createRadialGradient(rect.width/2, rect.height/2, 0, rect.width/2, rect.height/2, rect.width);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Grid
    drawGrid(ctx, rect.width, rect.height);

    // Solve Mechanism
    const state = mechanism.solve(angle, params);

    // Update Trace
    if (state.isValid && state.pathPoints && state.pathPoints.length > 0 && isPlaying) {
        traceRef.current.push({x: state.pathPoints[0].x, y: state.pathPoints[0].y});
        if (traceRef.current.length > 400) traceRef.current.shift();
    }

    // Send data up
    onDataUpdate(angle, state);

    // Coordinate Transform
    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.scale(1, -1); // Flip Y

    // Draw Trace
    if (showTrace && traceRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(traceRef.current[0].x, traceRef.current[0].y);
        for (let i = 1; i < traceRef.current.length; i++) {
            ctx.lineTo(traceRef.current[i].x, traceRef.current[i].y);
        }
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)'; // Amber-500 transparent
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    if (state.isValid) {
      // Draw Links
      // Draw construction/ghost links first
      state.links.forEach(link => {
        if (link.type === 'construction' || link.type === 'ghost') {
            ctx.beginPath();
            ctx.moveTo(link.start.x, link.start.y);
            ctx.lineTo(link.end.x, link.end.y);
            ctx.strokeStyle = link.color || '#475569';
            ctx.lineWidth = link.thickness || 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
      });

      // Draw primary links
      state.links.forEach(link => {
        if (link.type !== 'construction' && link.type !== 'ghost') {
            // Shadow
            ctx.beginPath();
            ctx.moveTo(link.start.x, link.start.y + 4); // Fake shadow offset in flipped Y? No, minus
            ctx.lineTo(link.end.x, link.end.y + 4);
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = (link.thickness || 2) + 2;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Body
            ctx.beginPath();
            ctx.moveTo(link.start.x, link.start.y);
            ctx.lineTo(link.end.x, link.end.y);
            ctx.strokeStyle = link.color || '#fff';
            ctx.lineWidth = link.thickness || 2;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Link Joints (Hinges)
            ctx.beginPath();
            ctx.arc(link.start.x, link.start.y, (link.thickness || 2) * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.fill();
        }
      });

      // Draw Joints
      state.joints.forEach(joint => {
        ctx.beginPath();
        const r = joint.isGround ? 8 : 6;
        ctx.arc(joint.x, joint.y, r, 0, Math.PI * 2);
        
        // Ground joints different style
        if (joint.isGround) {
            ctx.fillStyle = '#ef4444'; // red-500
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Ground hatch
            ctx.beginPath();
            ctx.moveTo(joint.x - 8, joint.y - 8);
            ctx.lineTo(joint.x + 8, joint.y - 8);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Hatches
            for(let i=-6; i<=6; i+=4) {
                ctx.beginPath();
                ctx.moveTo(joint.x + i, joint.y - 8);
                ctx.lineTo(joint.x + i - 3, joint.y - 12);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = '#bae6fd'; // sky-200
            ctx.fill();
            ctx.strokeStyle = '#0ea5e9'; // sky-500
            ctx.lineWidth = 2;
            ctx.stroke();
        }
      });
      
      // Draw Labels
      ctx.scale(1, -1); // Flip back
      ctx.font = 'bold 12px "Roboto Mono", monospace';
      state.joints.forEach(joint => {
        if (joint.label) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            const txt = joint.label;
            const w = ctx.measureText(txt).width;
            ctx.fillRect(joint.x + 6, -joint.y - 18, w + 4, 16);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(txt, joint.x + 8, -joint.y - 6);
        }
      });
    } else {
        ctx.scale(1, -1);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("IMPOSSIBLE CONFIGURATION", 0, 0);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText("The linkages cannot connect with current parameters.", 0, 30);
    }
    
    ctx.restore();

  }, [angle, mechanism, params, showTrace]);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    // Major grid
    const step = 50;
    ctx.beginPath();
    for (let x = w/2 % step; x < w; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    for (let y = h/2 % step; y < h; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.stroke();
  };

  return (
    <div className="flex-1 relative bg-slate-950 overflow-hidden cursor-crosshair">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
         <h2 className="text-3xl font-black text-slate-100 tracking-tight">{mechanism.name}</h2>
         <div className="h-1 w-20 bg-sky-500 mt-2 mb-2"></div>
         <p className="text-sky-200/80 text-sm max-w-md font-medium leading-relaxed drop-shadow-md">{mechanism.description}</p>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
    </div>
  );
};

export default MechanismCanvas;