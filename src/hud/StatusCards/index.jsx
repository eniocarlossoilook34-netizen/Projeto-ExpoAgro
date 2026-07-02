import React from 'react';
import { scenarioData } from '../../data/scenarioData';

export default function StatusCards({ scenario }) {
  const data = scenarioData[scenario];
  const isFlux = scenario === 1;

  return (
    <div
      key={scenario}
      className="animate-fade-up pointer-events-auto w-[26rem] bg-slate-950/70 backdrop-blur-xl border border-slate-700/60 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.55)] relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-[3px] h-full ${isFlux ? 'bg-gradient-to-b from-cyan-400 via-cyan-500/40 to-transparent' : 'bg-gradient-to-b from-rose-400 via-rose-500/40 to-transparent'}`} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        <div className={`w-full h-1/3 ${isFlux ? 'bg-cyan-300' : 'bg-rose-300'} animate-scan`} />
      </div>

      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-slate-600" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-slate-600" />

      <div className="p-7 relative">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-mono tracking-[0.3em] px-2 py-0.5 rounded ${isFlux ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'}`}>
            CENÁRIO {isFlux ? '02' : '01'}
          </span>
        </div>

        <h2 className="text-slate-50 font-extrabold text-xl leading-tight uppercase tracking-tight mt-2">
          {data.title.replace('ESTADO ATUAL: ', '')}
        </h2>
        <h3 className="text-slate-500 text-[11px] tracking-[0.2em] mt-1.5 uppercase font-mono">{data.subtitle}</h3>

        <ul className="text-slate-300 text-sm mt-6 mb-6 space-y-2.5">
          {data.bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${isFlux ? 'bg-cyan-400' : 'bg-rose-400'}`} />
              <span className="leading-snug text-slate-300/90">{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-slate-800 pt-5 space-y-2.5">
          {data.kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-slate-900/60 px-3 py-2.5 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <span className="text-slate-500 text-[10px] tracking-[0.15em] font-mono uppercase">{kpi.label.replace(/_/g, ' ')}</span>
              <span className={`font-mono font-bold text-xs tracking-wide ${kpi.color || 'text-slate-200'}`}>
                {kpi.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
