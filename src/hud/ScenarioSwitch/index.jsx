import React from 'react';

export default function ScenarioSwitch({ active, onChange }) {
  return (
    <div className="relative flex gap-1 pointer-events-auto bg-slate-950/70 p-1.5 backdrop-blur-md border border-slate-700/60 rounded-md shadow-[0_0_30px_rgba(0,0,0,0.45)]">
      <div
        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.4rem)] rounded-sm transition-all duration-300 ease-out ${
          active === 0
            ? 'left-1.5 bg-rose-500/15 shadow-[0_0_16px_rgba(244,63,94,0.25)]'
            : 'left-[calc(50%+0.05rem)] bg-cyan-500/15 shadow-[0_0_16px_rgba(34,211,238,0.3)]'
        }`}
      />

      <button
        onClick={() => onChange(0)}
        className={`relative z-10 px-5 py-2.5 text-[11px] font-mono font-bold tracking-[0.2em] transition-colors duration-300 flex items-center gap-2 ${
          active === 0 ? 'text-rose-300' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${active === 0 ? 'bg-rose-400 animate-pulse-soft' : 'bg-slate-600'}`} />
        01 · DEGRADADO
      </button>
      <button
        onClick={() => onChange(1)}
        className={`relative z-10 px-5 py-2.5 text-[11px] font-mono font-bold tracking-[0.2em] transition-colors duration-300 flex items-center gap-2 ${
          active === 1 ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${active === 1 ? 'bg-cyan-400 animate-pulse-soft' : 'bg-slate-600'}`} />
        02 · FLUX
      </button>
    </div>
  );
}
