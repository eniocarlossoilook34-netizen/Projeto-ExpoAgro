import React, { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';

export default function HUDPanel({ data, position, open, onToggle, demoMode, setDemoMode }) {
  const flowRateRef = useRef(null);
  const efficiencyRef = useRef(null);
  const statusRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (flowRateRef.current) {
      flowRateRef.current.textContent = `${data.flowRate.toFixed(2)} m³/s`;
    }
    if (efficiencyRef.current) {
      efficiencyRef.current.textContent = `${data.managementEfficiency}%`;
    }
    if (statusRef.current) {
      statusRef.current.textContent = data.status;
    }
  }, [data]);

  useEffect(() => {
    if (!panelRef.current) return;
    panelRef.current.style.opacity = open ? '1' : '0.18';
    panelRef.current.style.transform = open ? 'translateY(0) scale(1)' : 'translateY(-16px) scale(0.96)';
    panelRef.current.style.pointerEvents = open ? 'auto' : 'none';
  }, [open]);

  return (
    <Html position={position} transform style={{ pointerEvents: 'none' }}>
      <div
        ref={panelRef}
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.(!open);
        }}
        className="hud-panel"
        style={{
          pointerEvents: 'auto',
          position: 'absolute',
          top: '8%',
          right: '4%',
          width: '320px',
          padding: '1.35rem',
          borderRadius: '1.35rem',
          background: 'rgba(2, 10, 24, 0.88)',
          border: '1px solid rgba(34, 211, 238, 0.32)',
          boxShadow: '0 0 18px rgba(34, 211, 238, 0.12)',
          backdropFilter: 'blur(18px)',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-16px) scale(0.96)',
          transition: 'opacity 220ms ease, transform 220ms ease',
          opacity: open ? 0.94 : 0.82,
          color: '#d8f7ff',
          fontFamily: 'JetBrains Mono, monospace',
          zIndex: 20,
          overflow: 'hidden',
        }}
      >
        <style>{`
          .hud-panel::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(34,211,238,0.08) 0%, transparent 16%, transparent 84%, rgba(34,211,238,0.04) 100%);
            pointer-events: none;
          }
          .hud-glitch {
            position: relative;
            display: inline-block;
            color: #7dd3fc;
            font-size: 0.66rem;
            letter-spacing: 0.35em;
            text-transform: uppercase;
          }
          .hud-glitch::before,
          .hud-glitch::after {
            content: attr(data-text);
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0.7;
            clip: rect(0, 0, 0, 0);
          }
          .hud-glitch::before {
            color: rgba(34,211,238,0.72);
            transform: translate(1px, -1px);
            animation: glitch-top 2.7s infinite linear alternate-reverse;
          }
          .hud-glitch::after {
            color: rgba(56,189,248,0.72);
            transform: translate(-1px, 1px);
            animation: glitch-bottom 3.1s infinite linear alternate-reverse;
          }
          @keyframes glitch-top {
            0% { clip: rect(2px, 9999px, 6px, 0); }
            20% { clip: rect(8px, 9999px, 12px, 0); }
            40% { clip: rect(4px, 9999px, 8px, 0); }
            60% { clip: rect(10px, 9999px, 16px, 0); }
            80% { clip: rect(2px, 9999px, 4px, 0); }
            100% { clip: rect(0px, 9999px, 6px, 0); }
          }
          @keyframes glitch-bottom {
            0% { clip: rect(12px, 9999px, 16px, 0); }
            20% { clip: rect(6px, 9999px, 10px, 0); }
            40% { clip: rect(10px, 9999px, 14px, 0); }
            60% { clip: rect(0px, 9999px, 6px, 0); }
            80% { clip: rect(8px, 9999px, 12px, 0); }
            100% { clip: rect(14px, 9999px, 18px, 0); }
          }
        `}</style>

        <div className="hud-header" style={{ marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
            <span className="hud-glitch" data-text="WaterFlow Analytics">
              WaterFlow Analytics
            </span>
            <span style={{ color: '#94e2ff', fontSize: '0.7rem', opacity: 0.82 }}>
              {open ? 'Online' : 'Standby'}
            </span>
          </div>
          <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: open ? '#22d3ee' : 'rgba(34, 211, 238, 0.24)' }} />
            <span style={{ fontSize: '0.86rem', color: '#e0f7ff', letterSpacing: '0.08em' }}>
              Pulse interface with river for detail.
            </span>
          </div>
        </div>

        <div className="hud-stat" style={{ display: 'grid', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', borderRadius: '1rem', background: 'rgba(12, 22, 40, 0.72)', border: '1px solid rgba(56, 189, 248, 0.14)' }}>
            <span style={{ color: '#7dd3fc', fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Flow rate</span>
            <span ref={flowRateRef} style={{ fontSize: '1rem', fontWeight: 700, color: '#effbff' }}>0.00 m³/s</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', borderRadius: '1rem', background: 'rgba(12, 22, 40, 0.72)', border: '1px solid rgba(56, 189, 248, 0.14)' }}>
            <span style={{ color: '#7dd3fc', fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Efficiency</span>
            <span ref={efficiencyRef} style={{ fontSize: '1rem', fontWeight: 700, color: '#effbff' }}>0%</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', borderRadius: '1rem', background: 'rgba(12, 22, 40, 0.72)', border: '1px solid rgba(56, 189, 248, 0.14)' }}>
            <span style={{ color: '#7dd3fc', fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Status</span>
            <span ref={statusRef} style={{ fontSize: '1rem', fontWeight: 700, color: '#effbff' }}>Idle</span>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '0.72rem', color: '#94e2ff', opacity: 0.82 }}>Data driven from GPU pipeline.</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDemoMode?.(false);
              }}
              style={{ pointerEvents: 'auto', padding: '6px 10px', borderRadius: '8px', background: demoMode ? 'rgba(255,255,255,0.04)' : 'rgba(34,211,238,0.14)', border: '1px solid rgba(56,189,248,0.12)', color: '#dff8ff', cursor: 'pointer' }}
            >
              Manual Mode
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDemoMode?.(true);
              }}
              style={{ pointerEvents: 'auto', padding: '6px 10px', borderRadius: '8px', background: demoMode ? 'rgba(34,211,238,0.14)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.12)', color: '#062022', cursor: 'pointer' }}
            >
              Auto Mode
            </button>
          </div>
        </div>
        {demoMode && (
          <div style={{ position: 'absolute', right: '18px', bottom: '18px', display: 'flex', gap: '12px', pointerEvents: 'auto' }}>
            <a href="/" target="_blank" rel="noreferrer" style={{ display: 'block', width: '84px', height: '84px', background: '#071018', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', padding: '6px' }}>
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <rect width="100" height="100" fill="#071018" />
                <circle cx="20" cy="20" r="6" fill="#22d3ee" />
                <rect x="40" y="18" width="18" height="18" fill="#dff8ff" />
                <rect x="66" y="18" width="12" height="12" fill="#94e2ff" />
                <rect x="40" y="40" width="38" height="38" fill="#0b2730" />
              </svg>
            </a>

            <a href="/remote-controller" target="_blank" rel="noreferrer" style={{ display: 'block', width: '84px', height: '84px', background: '#071018', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', padding: '6px' }}>
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <rect width="100" height="100" fill="#071018" />
                <rect x="10" y="20" width="24" height="24" fill="#22d3ee" />
                <rect x="38" y="20" width="24" height="24" fill="#dff8ff" />
                <rect x="66" y="20" width="24" height="24" fill="#94e2ff" />
                <rect x="10" y="52" width="80" height="28" fill="#072028" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </Html>
  );
}
