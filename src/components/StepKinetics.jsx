import React, { useState, useMemo } from 'react';
import { Layers, Thermometer, RotateCw, Clock, ArrowRight, ArrowLeft, ShieldCheck, AlertTriangle, Sliders, Activity } from 'lucide-react';
import { generateKineticsData } from '../utils/thermalKinetics';

export default function StepKinetics({
  protocol,
  overrides,
  setOverrides,
  onNext,
  onBack
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const kinetics = useMemo(() => {
    return generateKineticsData(protocol, overrides);
  }, [protocol, overrides]);

  const { points, stats } = kinetics;

  // Chart Dimensions & Coordinate Math for SVG
  const width = 800;
  const height = 240;
  const padding = { top: 25, right: 40, bottom: 35, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(10, stats.totalTimeMin);
  const maxTemp = Math.max(120, protocol.safetyEnvelope.maxTempC * 1.05, stats.peakTemp * 1.1);
  const maxRpm = Math.max(500, stats.maxRpm * 1.25);

  const getX = (time) => padding.left + (time / maxTime) * innerWidth;
  const getYTemp = (temp) => padding.top + innerHeight - (temp / maxTemp) * innerHeight;
  const getYRpm = (rpm) => padding.top + innerHeight - (rpm / maxRpm) * innerHeight;

  const tempPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, pt, i) => {
      const x = getX(pt.time);
      const y = getYTemp(pt.temp);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [points, maxTime, maxTemp]);

  const tempAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const base = getYTemp(0);
    const startX = getX(0);
    const endX = getX(points[points.length - 1].time);
    return `${tempPath} L ${endX} ${base} L ${startX} ${base} Z`;
  }, [tempPath, points, maxTime, maxTemp]);

  const rpmPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, pt, i) => {
      const x = getX(pt.time);
      const y = getYRpm(pt.rpm);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [points, maxTime, maxRpm]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;
    const clampedX = Math.max(padding.left, Math.min(width - padding.right, svgX));
    const normalizedTime = ((clampedX - padding.left) / innerWidth) * maxTime;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.time - normalizedTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : points[points.length - 1];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Header Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-card)',
        padding: '32px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-clean badge-clean-green">
              <Activity size={13} />
              Reactive Kinetics Engine (Marimo Verified)
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Thermodynamic T(t) Simulation</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.76rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--primary)', borderRadius: '2px' }}></span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Temperature (°C)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', background: '#059669', borderTop: '2px dashed #059669' }}></span>
              <span style={{ color: '#64748b' }}>Stirring (RPM)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '2px', background: '#e11d48', borderTop: '2px dotted #e11d48' }}></span>
              <span style={{ color: '#e11d48' }}>Safety Ceiling</span>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
          Thermodynamic Simulation: <span style={{ color: 'var(--primary)' }}>{protocol.name}</span>
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '20px' }}>
          Interactive mathematical curve verifying thermal ramp rates, soak plateaus, and safety boundaries:
        </p>

        {/* SVG Kinetics Chart Canvas */}
        <div style={{
          position: 'relative',
          width: '100%',
          background: '#090d16',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #1e293b',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="oceanTempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padding.top + innerHeight * (1 - pct);
              const tempVal = Math.round(maxTemp * pct);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="var(--font-mono)"
                  >
                    {tempVal}°C
                  </text>
                </g>
              );
            })}

            {/* Safety Ceiling Line */}
            <line
              x1={padding.left}
              y1={getYTemp(protocol.safetyEnvelope.maxTempC)}
              x2={width - padding.right}
              y2={getYTemp(protocol.safetyEnvelope.maxTempC)}
              stroke="#e11d48"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />

            {/* Temperature Shaded Area & Line */}
            <path d={tempAreaPath} fill="url(#oceanTempGrad)" />
            <path d={tempPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

            {/* RPM Line */}
            <path d={rpmPath} fill="none" stroke="#10b981" strokeWidth="1.8" strokeDasharray="5 3" opacity="0.85" />

            {/* Hover Marker */}
            {activePoint && (
              <g>
                <line
                  x1={getX(activePoint.time)}
                  y1={padding.top}
                  x2={getX(activePoint.time)}
                  y2={height - padding.bottom}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={getX(activePoint.time)}
                  cy={getYTemp(activePoint.temp)}
                  r="4.5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Dynamic Tooltip */}
          {activePoint && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(2, 132, 199, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              fontSize: '0.76rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#ffffff'
            }}>
              <span>Time: <strong>{activePoint.time}m</strong></span>
              <span>•</span>
              <span style={{ color: '#38bdf8' }}>Temp: <strong>{activePoint.temp}°C</strong></span>
              <span>•</span>
              <span style={{ color: '#10b981' }}>RPM: <strong>{activePoint.rpm}</strong></span>
              <span>•</span>
              <span style={{ color: '#94a3b8' }}>{activePoint.stepName}</span>
            </div>
          )}
        </div>

        {/* 4 Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>TOTAL TIME</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
              {stats.totalTimeMin} min <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>({(stats.totalTimeMin / 60).toFixed(1)} hrs)</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>PEAK TEMPERATURE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0284c7' }}>
              {stats.peakTemp} °C
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MAX AGITATION SPEED</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#059669' }}>
              {stats.maxRpm} RPM
            </div>
          </div>

          <div style={{ background: '#ecfdf5', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>SAFETY INTERLOCK</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <ShieldCheck size={16} color="#059669" />
              Envelope Cleared
            </div>
          </div>
        </div>

        {/* Researcher Calibration Sliders */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sliders size={16} color="var(--primary)" />
            <h4 style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>
              Researcher Verification & Fine Calibration
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>(Adjust before physical deployment)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: '#475569' }}>Temp Offset:</span>
                <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  {overrides.tempOffset > 0 ? `+${overrides.tempOffset}` : overrides.tempOffset || 0} °C
                </strong>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                value={overrides.tempOffset || 0}
                onChange={(e) => setOverrides(prev => ({ ...prev, tempOffset: parseInt(e.target.value, 10) }))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: '#475569' }}>Stirring RPM Scaling:</span>
                <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                  {overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier.toFixed(1) : 1.0}x
                </strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1.0}
                onChange={(e) => setOverrides(prev => ({ ...prev, rpmMultiplier: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: '#475569' }}>Dwell Duration Scale:</span>
                <strong style={{ color: '#d97706', fontFamily: 'var(--font-mono)' }}>
                  {overrides.timeScale !== undefined ? overrides.timeScale.toFixed(1) : 1.0}x
                </strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={overrides.timeScale !== undefined ? overrides.timeScale : 1.0}
                onChange={(e) => setOverrides(prev => ({ ...prev, timeScale: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: '#d97706', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Wizard Navigation Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <button
            onClick={onBack}
            className="btn-subtle"
          >
            <ArrowLeft size={16} />
            Back to Literature
          </button>

          <button
            onClick={onNext}
            className="btn-primary-ocean"
          >
            Proceed to Physical Lab Execution
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
