import React from 'react';
import { Thermometer, RotateCw, Cpu, Layers, ShieldCheck, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { generateKineticsData } from '../utils/thermalKinetics';

export default function FinnovaKpiCards({
  protocol,
  overrides,
  onDeployToLab,
  targetNode,
  setTargetNode,
  isDeploying
}) {
  const kinetics = generateKineticsData(protocol, overrides);
  const { stats } = kinetics;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* Card 1: Target Material */}
      <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Active Material Target</span>
            <span className="badge-clean badge-clean-purple" style={{ fontSize: '0.65rem' }}>
              {protocol.category}
            </span>
          </div>

          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {protocol.name.split(' (')[0]}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginBottom: '12px' }}>
            <ArrowUpRight size={14} />
            <span>{protocol.targetProperty}</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '10px',
          fontSize: '0.72rem',
          color: '#94a3b8'
        }}>
          <span>Formula: <strong style={{ color: '#475569' }}>{protocol.formula}</strong></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
            DOI: {protocol.citation.doi.slice(0, 12)}...
          </span>
        </div>
      </div>

      {/* Card 2: Thermal Budget (with Mini Bar Chart like Finnova Screenshot) */}
      <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Peak Thermal Budget</span>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Thermometer size={13} color="var(--primary)" />
            </div>
          </div>

          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {stats.peakTemp} °C
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#4338ca', fontWeight: 600 }}>
            <span>Ceiling: {protocol.safetyEnvelope.maxTempC} °C</span>
            <span style={{ color: '#059669', marginLeft: '6px' }}>(Safe)</span>
          </div>
        </div>

        {/* Mini Vertical Bar Graphic (Exact Match to Finnova Card 2) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '42px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          {[35, 45, 60, 50, 75, 95].map((val, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}>
              <div style={{
                width: '10px',
                height: `${(val / 100) * 32}px`,
                background: idx === 5 ? 'var(--primary)' : '#c7d2fe',
                borderRadius: '3px'
              }}></div>
              <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>S{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Reaction Kinetics (with Mini Dot Line Sparkline like Finnova Screenshot) */}
      <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Agitation Kinetics</span>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCw size={13} color="#0284c7" />
            </div>
          </div>

          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {stats.maxRpm} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>RPM</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>
            <span>{stats.totalTimeMin} min total</span>
            <span style={{ color: '#64748b', fontWeight: 400 }}>({(stats.totalTimeMin / 60).toFixed(1)} hrs)</span>
          </div>
        </div>

        {/* Mini Sparkline with Dots (Exact Match to Finnova Card 3) */}
        <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
          <svg viewBox="0 0 160 30" style={{ width: '100%', height: '30px', display: 'block' }}>
            <path
              d="M 5 22 Q 35 18, 60 12 T 110 8 T 155 4"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
            />
            {[
              { cx: 5, cy: 22 },
              { cx: 35, cy: 19 },
              { cx: 60, cy: 12 },
              { cx: 85, cy: 11 },
              { cx: 110, cy: 8 },
              { cx: 135, cy: 6 },
              { cx: 155, cy: 4 }
            ].map((pt, i) => (
              <circle key={i} cx={pt.cx} cy={pt.cy} r="2.5" fill="#ffffff" stroke="#4338ca" strokeWidth="1.5" />
            ))}
          </svg>
        </div>
      </div>

      {/* Card 4: Hardware Node & Payout (like Finnova Card 4 Instant Payout) */}
      <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Physical Execution Node</span>
            <span className="badge-clean badge-clean-green" style={{ fontSize: '0.65rem' }}>
              Online
            </span>
          </div>

          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            ESP8266 Lab Node
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>
            {protocol.steps.length} Physical Stages Loaded & Armed
          </div>
        </div>

        {/* Target Node Pill Switcher + Action (Finnova Card 4 visual layout) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 8px',
          marginTop: '6px'
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setTargetNode('twin')}
              style={{
                border: 'none',
                background: targetNode === 'twin' ? 'var(--primary)' : 'transparent',
                color: targetNode === 'twin' ? '#ffffff' : '#64748b',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Virtual Twin
            </button>
            <button
              onClick={() => setTargetNode('hardware')}
              style={{
                border: 'none',
                background: targetNode === 'hardware' ? 'var(--primary)' : 'transparent',
                color: targetNode === 'hardware' ? '#ffffff' : '#64748b',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              NodeMCU
            </button>
          </div>

          <button
            onClick={onDeployToLab}
            disabled={isDeploying}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Deploy
          </button>
        </div>
      </div>
    </div>
  );
}
