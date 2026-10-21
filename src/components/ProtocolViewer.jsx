import React, { useState } from 'react';
import { Layers, Thermometer, RotateCw, Clock, AlertTriangle, ShieldAlert, Code2, Eye, CheckCircle2 } from 'lucide-react';

export default function ProtocolViewer({ protocol, overrides }) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'json'

  const tempOffset = overrides.tempOffset || 0;
  const rpmMultiplier = overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1;
  const timeScale = overrides.timeScale !== undefined ? overrides.timeScale : 1;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--accent-blue)" />
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>
              Extracted Machine Protocol: <span style={{ color: 'var(--accent-cyan)' }}>{protocol.name}</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {protocol.steps.length} Physical Lab Operations • Chemical Formula: {protocol.formula}
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.7)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'cards' ? 'var(--accent-cyan)' : 'transparent',
              color: viewMode === 'cards' ? '#070a10' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={13} />
            Visual Protocol
          </button>
          <button
            onClick={() => setViewMode('json')}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'json' ? 'var(--accent-cyan)' : 'transparent',
              color: viewMode === 'json' ? '#070a10' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Code2 size={13} />
            JSON Bytecode
          </button>
        </div>
      </div>

      {/* Safety Interlock Warnings */}
      {protocol.safetyEnvelope && protocol.safetyEnvelope.criticalWarnings && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <ShieldAlert size={18} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '2px' }}>
              Safety Envelope Limits (Active Interlock):
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Max Allowable Temp: <strong>{protocol.safetyEnvelope.maxTempC} °C</strong> • Max Ramp Rate: <strong>{protocol.safetyEnvelope.maxRampRateCMin} °C/min</strong>
            </div>
            <ul style={{ paddingLeft: '16px', marginTop: '6px', fontSize: '0.76rem', color: '#cbd5e1' }}>
              {protocol.safetyEnvelope.criticalWarnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {viewMode === 'cards' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {protocol.steps.map((step, idx) => {
            const adjustedTemp = Math.round(step.targetTempC + tempOffset);
            const adjustedRpm = Math.round(step.stirRpm * rpmMultiplier);
            const adjustedDuration = Math.round(step.durationMin * timeScale * 10) / 10;

            const isHeating = step.targetTempC > 30;
            const isStirring = step.stirRpm > 0;

            return (
              <div
                key={step.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                  alignItems: 'center',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* Column 1: Step Info & Reagents */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--accent-cyan)',
                      background: 'rgba(0, 242, 254, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700
                    }}>
                      STAGE 0{idx + 1}
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                      {step.operation}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '6px' }}>
                    {step.name}
                  </h3>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: '1.4' }}>
                    <strong style={{ color: '#cbd5e1' }}>Reagents:</strong> {step.reagents}
                  </p>

                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                    ⚙️ {step.hardwareAction}
                  </div>
                </div>

                {/* Column 2: Physical Parameters */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  background: 'rgba(9, 13, 22, 0.7)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {/* Temp */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Thermometer size={12} color={isHeating ? 'var(--accent-rose)' : 'var(--accent-cyan)'} />
                      Target Temp
                    </div>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: isHeating ? '#fb7185' : '#38bdf8'
                    }}>
                      {adjustedTemp} <span style={{ fontSize: '0.75rem' }}>°C</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                      Ramp: {step.rampRateCMin} °C/m
                    </div>
                  </div>

                  {/* Agitation / RPM */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <RotateCw size={12} color={isStirring ? 'var(--accent-emerald)' : 'var(--text-subtle)'} />
                      Agitation
                    </div>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: isStirring ? '#34d399' : 'var(--text-subtle)'
                    }}>
                      {adjustedRpm} <span style={{ fontSize: '0.75rem' }}>RPM</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                      {step.stirRpm === 0 ? 'Quiescent' : 'Magnetic'}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Clock size={12} color="var(--accent-amber)" />
                      Dwell Time
                    </div>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: '#fbbf24'
                    }}>
                      {adjustedDuration} <span style={{ fontSize: '0.75rem' }}>min</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                      {Math.round(adjustedDuration * 60)} sec
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <pre style={{
          background: '#070a12',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: '#38bdf8',
          overflowX: 'auto',
          maxHeight: '400px'
        }}>
          {JSON.stringify(protocol, null, 2)}
        </pre>
      )}
    </div>
  );
}
