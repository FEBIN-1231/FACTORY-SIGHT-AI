import React, { useState } from 'react';

/**
 * 2D Isometric Blueprint Fallback for reduced motion, WebGL unsupported, or loading states.
 */
export default function CanvasFallback({ machineId = 'M-01', status = 'NORMAL', telemetry = {}, message = '' }) {
  const [activeHotspot, setActiveHotspot] = useState(null);

  const statusColors = {
    NORMAL: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    WARNING: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
    CRITICAL: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400' },
  };

  const currentTheme = statusColors[status] || statusColors.NORMAL;

  // Helper for safe telemetry value formatting
  const fmt = (val, fallback, decimals = 1) => {
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'number') return val.toFixed(decimals);
    return String(val).replace(/[^0-9.-]+/g, '') || fallback;
  };

  const hotspots = [
    { id: 'temp', label: 'Spindle Bearing', x: '52%', y: '35%', value: `${fmt(telemetry.temperature, '72.4', 1)} °C`, param: 'Temperature' },
    { id: 'vib', label: 'Drive Motor', x: '68%', y: '58%', value: `${fmt(telemetry.vibration, '3.82', 2)} mm/s`, param: 'Vibration' },
    { id: 'press', label: 'Hydraulic Clamp', x: '35%', y: '65%', value: `${fmt(telemetry.pressure, '124', 0)} PSI`, param: 'Pressure' },
    { id: 'curr', label: 'Spindle Inverter', x: '42%', y: '25%', value: `${fmt(telemetry.current, '18.5', 1)} A`, param: 'Current' },
  ];

  return (
    <div className="relative w-full h-full min-h-[340px] bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center p-6 overflow-hidden select-none">
      {/* Blueprint Grid Background */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#FE4B4A 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* SVG Isometric Machine Schematic */}
      <div className="relative z-10 w-full max-w-[280px] h-[220px] flex items-center justify-center">
        <svg viewBox="0 0 240 200" className="w-full h-full drop-shadow-lg" fill="none" stroke="currentColor">
          {/* Base Platform */}
          <polygon points="120,180 210,135 120,90 30,135" className="fill-slate-900/90 stroke-[#FE4B4A]/40" strokeWidth="1.5" />
          <polygon points="30,135 120,180 120,195 30,150" className="fill-slate-950 stroke-[#FE4B4A]/30" strokeWidth="1.5" />
          <polygon points="210,135 120,180 120,195 210,150" className="fill-slate-900 stroke-[#FE4B4A]/30" strokeWidth="1.5" />

          {/* Machining Bed */}
          <polygon points="120,155 180,125 120,95 60,125" className="fill-slate-800/80 stroke-slate-600" strokeWidth="1.2" />

          {/* Vertical Column */}
          <polygon points="120,95 160,75 160,25 120,45" className="fill-slate-800 stroke-[#FE4B4A]/50" strokeWidth="1.2" />
          <polygon points="80,75 120,95 120,45 80,25" className="fill-slate-900 stroke-[#FE4B4A]/50" strokeWidth="1.2" />
          <polygon points="120,45 160,25 120,5 80,25" className="fill-slate-800 stroke-[#FE4B4A]" strokeWidth="1.5" />

          {/* Spindle Head */}
          <rect x="105" y="55" width="30" height="40" rx="3" className="fill-slate-700 stroke-[#FE4B4A]/80" strokeWidth="1.5" />
          <line x1="120" y1="95" x2="120" y2="120" className="stroke-[#FE4B4A]" strokeWidth="3" strokeLinecap="round" />
          <circle cx="120" cy="120" r="4" className={status === 'CRITICAL' ? 'fill-rose-500' : status === 'WARNING' ? 'fill-amber-500' : 'fill-emerald-400'} />
        </svg>

        {/* Hotspots */}
        {hotspots.map((h) => (
          <div
            key={h.id}
            style={{ left: h.x, top: h.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            onMouseEnter={() => setActiveHotspot(h.id)}
            onMouseLeave={() => setActiveHotspot(null)}
            onClick={() => setActiveHotspot(activeHotspot === h.id ? null : h.id)}
          >
            <div className="relative flex items-center justify-center">
              <span className={`absolute w-4 h-4 rounded-full ${currentTheme.dot} opacity-40 animate-ping`} />
              <span className={`w-2.5 h-2.5 rounded-full ${currentTheme.dot} border border-slate-950 shadow-sm`} />
            </div>

            {/* Tooltip Card */}
            {(activeHotspot === h.id) && (
              <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 rounded-lg bg-slate-900/95 border border-[#FE4B4A]/40 shadow-xl backdrop-blur-md text-[10px] pointer-events-none">
                <div className="text-slate-400 font-medium">{h.label}</div>
                <div className="text-white font-mono font-bold text-xs mt-0.5">{h.value}</div>
                <div className="text-[#FE4B4A] text-[9px] mt-0.5 uppercase tracking-wider">{h.param}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Badge & Info Footer */}
      <div className="relative z-10 mt-3 flex items-center justify-between w-full text-xs text-slate-400 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${currentTheme.dot}`} />
          <span className="font-semibold text-slate-200">{machineId} Schematic (2D Blueprint)</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${currentTheme.bg} ${currentTheme.text} border ${currentTheme.border}`}>
          {status}
        </span>
      </div>

      {message && (
        <div className="text-[10px] text-slate-500 mt-1 text-center">
          {message}
        </div>
      )}
    </div>
  );
}
