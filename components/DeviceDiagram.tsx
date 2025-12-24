
import React from 'react';

const DeviceDiagram: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center overflow-hidden">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 w-full text-left flex items-center gap-2">
        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
        Axis Orientation (3D View)
      </h3>
      
      <div className="relative w-full h-56 flex items-center justify-center perspective-[1000px]">
        {/* Container for 3D rotation */}
        <div className="relative w-24 h-44" style={{ transform: 'rotateX(35deg) rotateY(-20deg) rotateZ(10deg)', transformStyle: 'preserve-3d' }}>
          
          {/* iPhone Body */}
          <div className="absolute inset-0 border-[3px] border-slate-800 rounded-[1.5rem] bg-white shadow-[10px_10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center py-2 overflow-hidden">
            <div className="w-8 h-2 bg-slate-800 rounded-full mb-1 opacity-20"></div>
            <div className="flex-1 w-full border-t border-b border-slate-100 bg-slate-50/50"></div>
            <div className="w-4 h-4 rounded-full border border-slate-200 mt-1 opacity-20"></div>
          </div>

          {/* Axes Visualization */}
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 overflow-visible pointer-events-none" style={{ transform: 'translateZ(20px)' }} viewBox="0 0 160 160">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
              </marker>
            </defs>
            
            {/* Center Point (Origin) */}
            <circle cx="80" cy="80" r="3" fill="#64748b" />

            {/* X-Axis (Red) - Along the width */}
            <g className="text-red-500">
              <line x1="80" y1="80" x2="140" y2="80" stroke="currentColor" strokeWidth="3" markerEnd="url(#arrowhead)" />
              <text x="145" y="85" fontSize="14" fontWeight="900" fill="currentColor">X</text>
            </g>

            {/* Y-Axis (Green) - Along the length */}
            <g className="text-green-500">
              <line x1="80" y1="80" x2="80" y2="20" stroke="currentColor" strokeWidth="3" markerEnd="url(#arrowhead)" />
              <text x="74" y="15" fontSize="14" fontWeight="900" fill="currentColor">Y</text>
            </g>

            {/* Z-Axis (Blue) - Vertical to screen */}
            <g className="text-blue-500">
              {/* Simulated perpendicular axis */}
              <line x1="80" y1="80" x2="40" y2="120" stroke="currentColor" strokeWidth="3" strokeDasharray="4 2" />
              <line x1="40" y1="120" x2="30" y2="130" stroke="currentColor" strokeWidth="3" markerEnd="url(#arrowhead)" />
              <text x="15" y="145" fontSize="14" fontWeight="900" fill="currentColor">Z (Front)</text>
            </g>
          </svg>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 w-full gap-4 px-2">
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mx-auto mb-1"></div>
          <span className="text-[9px] text-slate-500 font-black uppercase">Lateral</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mx-auto mb-1"></div>
          <span className="text-[9px] text-slate-500 font-black uppercase">Vertical</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-auto mb-1"></div>
          <span className="text-[9px] text-slate-500 font-black uppercase">Depth</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceDiagram;
