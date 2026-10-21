import React, { useState, useMemo } from 'react';
import { Activity, Flame, RotateCw, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { generateKineticsData } from '../utils/thermalKinetics';

export default function ThermalKineticsChart({ protocol, overrides }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const kinetics = useMemo(() => {
    return generateKineticsData(protocol, overrides);
  }, [protocol, overrides]);

  const { points, stats } = kinetics;

  // Chart Dimensions & Coordinate Math
  const width = 850;
  const height = 340;
  const padding = { top: 35, right: 65, bottom: 45, left: 65 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(10, stats.totalTimeMin);
  const maxTemp = Math.max(120, protocol.safetyEnvelope.maxTempC * 1.08, stats.peakTemp * 1.15);
  const maxRpm = Math.max(500, stats.maxRpm * 1.2);

  const getX = (time) => padding.left + (time / maxTime) * innerWidth;
  const getYTemp = (temp) => padding.top + innerHeight - (temp / maxTemp) * innerHeight;
  const getYRpm = (rpm) => padding.top + innerHeight - (rpm / maxRpm) * innerHeight;

  // Path strings
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

  // Hover detection
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;
    const clampedX = Math.max(padding.left, Math.min(width - padding.right, svgX));
    const normalizedTime = ((clampedX - padding.left) / innerWidth) * maxTime;

    // Find closest data point
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
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Header and Live Metric Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>
              Step 2: Reactive Thermal & Kinetic Dynamics (Marimo Verified)
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Mathematical time-series simulation showing T(t) ramp/dwell profiles and stirring kinetics:
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: 'var(--accent-cyan)', borderRadius: '2px' }}></span>
            <span style={{ color: '#fff', fontWeight: 600 }}>Temperature (°C)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: 'var(--accent-emerald)', borderTop: '2px dashed var(--accent-emerald)' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>Stirring (RPM)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', background: 'var(--accent-rose)', borderTop: '2px dotted var(--accent-rose)' }}></span>
            <span style={{ color: 'var(--accent-rose)' }}>Safety Ceiling</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: 'rgba(7, 10, 18, 0.9)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + innerHeight * (1 - pct);
            const tempVal = Math.round(maxTemp * pct);
            const rpmVal = Math.round(maxRpm * pct);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                {/* Left Y Axis Label (Temp) */}
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="var(--text-subtle)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {tempVal}°C
                </text>
                {/* Right Y Axis Label (RPM) */}
                <text
                  x={width - padding.right + 10}
                  y={y + 4}
                  fill="rgba(16, 185, 129, 0.6)"
                  fontSize="10"
                  textAnchor="start"
                  fontFamily="var(--font-mono)"
                >
                  {rpmVal}
                </text>
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const x = padding.left + innerWidth * pct;
            const timeVal = Math.round(maxTime * pct);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 5}
                  stroke="rgba(255, 255, 255, 0.2)"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill="var(--text-subtle)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {timeVal}m
                </text>
              </g>
            );
          })}

          {/* Safety Envelope Limit Line */}
          {protocol.safetyEnvelope && (
            <g>
              <line
                x1={padding.left}
                y1={getYTemp(protocol.safetyEnvelope.maxTempC)}
                x2={width - padding.right}
                y2={getYTemp(protocol.safetyEnvelope.maxTempC)}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.85"
              />
              <text
                x={width - padding.right - 10}
                y={getYTemp(protocol.safetyEnvelope.maxTempC) - 6}
                fill="#f43f5e"
                fontSize="9"
                fontWeight="700"
                textAnchor="end"
                fontFamily="var(--font-mono)"
              >
                SAFETY CEILING: {protocol.safetyEnvelope.maxTempC} °C
              </text>
            </g>
          )}

          {/* Shaded Area Under Temp Curve */}
          <path d={tempAreaPath} fill="url(#tempGradient)" />

          {/* Temperature Curve */}
          <path
            d={tempPath}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* RPM Curve */}
          <path
            d={rpmPath}
            fill="none"
            stroke="var(--accent-emerald)"
            strokeWidth="1.8"
            strokeDasharray="5 3"
            opacity="0.9"
          />

          {/* Hover Crosshair */}
          {activePoint && (
            <g>
              <line
                x1={getX(activePoint.time)}
                y1={padding.top}
                x2={getX(activePoint.time)}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(activePoint.time)}
                cy={getYTemp(activePoint.temp)}
                r="5"
                fill="var(--accent-cyan)"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={getX(activePoint.time)}
                cy={getYRpm(activePoint.rpm)}
                r="4"
                fill="var(--accent-emerald)"
                stroke="#050b14"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Dynamic Tooltip Bar */}
        {activePoint && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid var(--border-bright)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
          }}>
            <div>
              <span style={{ color: 'var(--text-subtle)' }}>Time: </span>
              <strong style={{ color: '#fff' }}>{activePoint.time} min</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-subtle)' }}>Temp: </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{activePoint.temp} °C</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-subtle)' }}>RPM: </span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{activePoint.rpm}</strong>
            </div>
            <div style={{ color: 'var(--accent-blue)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activePoint.stepName}
            </div>
          </div>
        )}
      </div>

      {/* Safety & Performance Summary Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginTop: '16px'
      }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>TOTAL REACTION DURATION</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
            {stats.totalTimeMin} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>mins ({(stats.totalTimeMin / 60).toFixed(1)} hrs)</span>
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>PEAK OPERATING TEMP</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)' }}>
            {stats.peakTemp} °C
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>MAX AGITATION SPEED</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
            {stats.maxRpm} RPM
          </div>
        </div>

        <div style={{
          background: stats.violations.length > 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: stats.violations.length > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
        }}>
          <div style={{ fontSize: '0.7rem', color: stats.violations.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            SAFETY ENVELOPE STATUS
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', marginTop: '2px' }}>
            {stats.violations.length > 0 ? (
              <>
                <AlertTriangle size={15} color="var(--accent-rose)" />
                {stats.violations.length} Interlock Violation(s)
              </>
            ) : (
              <>
                <ShieldCheck size={15} color="var(--accent-emerald)" />
                Envelope Verified (Safe to Run)
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
