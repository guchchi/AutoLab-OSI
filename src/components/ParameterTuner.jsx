import React from 'react';
import { Sliders, RotateCcw, Thermometer, RotateCw, Clock, AlertCircle } from 'lucide-react';

export default function ParameterTuner({ overrides, setOverrides, protocol }) {
  const handleTempChange = (e) => {
    setOverrides(prev => ({ ...prev, tempOffset: parseInt(e.target.value, 10) }));
  };

  const handleRpmChange = (e) => {
    setOverrides(prev => ({ ...prev, rpmMultiplier: parseFloat(e.target.value) }));
  };

  const handleTimeChange = (e) => {
    setOverrides(prev => ({ ...prev, timeScale: parseFloat(e.target.value) }));
  };

  const handleReset = () => {
    setOverrides({ tempOffset: 0, rpmMultiplier: 1.0, timeScale: 1.0 });
  };

  const isModified = overrides.tempOffset !== 0 || overrides.rpmMultiplier !== 1.0 || overrides.timeScale !== 1.0;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-purple)" />
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>
              Researcher Verification & Parameter Calibration
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Fine-tune synthesis parameters before deploying to physical hardware:
            </p>
          </div>
        </div>

        {isModified && (
          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <RotateCcw size={13} />
            Reset to Literature Baseline
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {/* Temperature Offset Slider */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Thermometer size={14} color="var(--accent-rose)" />
              Temperature Offset
            </span>
            <span style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: overrides.tempOffset > 0 ? 'var(--accent-rose)' : overrides.tempOffset < 0 ? 'var(--accent-cyan)' : '#fff'
            }}>
              {overrides.tempOffset > 0 ? `+${overrides.tempOffset}` : overrides.tempOffset} °C
            </span>
          </div>

          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={overrides.tempOffset}
            onChange={handleTempChange}
            style={{ width: '100%', accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            <span>-30 °C</span>
            <span>Literature Baseline (0)</span>
            <span>+30 °C</span>
          </div>
        </div>

        {/* Stirring RPM Multiplier */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RotateCw size={14} color="var(--accent-emerald)" />
              Stirring Speed Scaling
            </span>
            <span style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: overrides.rpmMultiplier !== 1.0 ? 'var(--accent-emerald)' : '#fff'
            }}>
              {overrides.rpmMultiplier.toFixed(1)}x
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={overrides.rpmMultiplier}
            onChange={handleRpmChange}
            style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            <span>0.5x (Gentle)</span>
            <span>1.0x (Standard)</span>
            <span>1.5x (Vigorous)</span>
          </div>
        </div>

        {/* Reaction Dwell Time Scale */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--accent-amber)" />
              Reaction Dwell Duration
            </span>
            <span style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: overrides.timeScale !== 1.0 ? 'var(--accent-amber)' : '#fff'
            }}>
              {overrides.timeScale.toFixed(1)}x
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={overrides.timeScale}
            onChange={handleTimeChange}
            style={{ width: '100%', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            <span>0.5x (Fast)</span>
            <span>1.0x (Standard)</span>
            <span>2.0x (Extended)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
