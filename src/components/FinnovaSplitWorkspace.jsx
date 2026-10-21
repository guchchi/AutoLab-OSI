import React, { useState, useMemo } from 'react';
import { Layers, Thermometer, RotateCw, Clock, Play, Pause, RotateCcw, Send, CheckCircle2, AlertTriangle, ShieldCheck, Download, Code2, Terminal } from 'lucide-react';
import { generateKineticsData, generateHardwarePayload } from '../utils/thermalKinetics';

export default function FinnovaSplitWorkspace({
  protocol,
  overrides,
  setOverrides,
  isRunning,
  setIsRunning,
  logs,
  onDeployToLab,
  isDeploying
}) {
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'heating' | 'quiescent'
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showConsole, setShowConsole] = useState(true);

  const kinetics = useMemo(() => {
    return generateKineticsData(protocol, overrides);
  }, [protocol, overrides]);

  const { points, stats } = kinetics;
  const steps = protocol.steps;
  const activeStep = steps[selectedStageIdx] || steps[0];

  // Filtered steps
  const filteredSteps = useMemo(() => {
    if (activeFilterTab === 'heating') {
      return steps.filter(s => s.targetTempC > 35);
    }
    if (activeFilterTab === 'quiescent') {
      return steps.filter(s => s.stirRpm === 0);
    }
    return steps;
  }, [steps, activeFilterTab]);

  // Dynamic simulation values
  const simTemp = Math.round(activeStep.targetTempC + (overrides.tempOffset || 0));
  const simRpm = Math.round(activeStep.stirRpm * (overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1));

  // Chart Dimensions & Coordinate Math for SVG
  const width = 560;
  const height = 180;
  const padding = { top: 20, right: 35, bottom: 25, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(10, stats.totalTimeMin);
  const maxTemp = Math.max(120, protocol.safetyEnvelope.maxTempC * 1.05);

  const getX = (time) => padding.left + (time / maxTime) * innerWidth;
  const getYTemp = (temp) => padding.top + innerHeight - (temp / maxTemp) * innerHeight;

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

  const handleChartMouseMove = (e) => {
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

  // Hotplate & Beaker Visualizer Dynamics
  const heatFactor = Math.min(1, Math.max(0, (simTemp - 30) / 180));
  const plateGlow = heatFactor > 0.05
    ? `radial-gradient(circle, rgba(239, 68, 68, ${0.4 + heatFactor * 0.5}) 0%, rgba(249, 115, 22, ${0.3 + heatFactor * 0.3}) 60%, #1e293b 100%)`
    : '#1e293b';

  const spinDuration = simRpm > 0 ? Math.max(0.06, 60 / simRpm) : 0;
  const vortexDepth = Math.min(22, (simRpm / 1000) * 22);

  let liquidColor = 'rgba(56, 189, 248, 0.5)';
  if (protocol.id === 'cspbbr3-quantum-dots') {
    liquidColor = simTemp > 140 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(250, 204, 21, 0.6)';
  } else if (protocol.id === 'llzo-electrolyte') {
    liquidColor = simTemp > 200 ? 'rgba(71, 85, 105, 0.85)' : simTemp > 70 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(56, 189, 248, 0.5)';
  }

  // Export JSON handler
  const handleDownloadJson = () => {
    const payload = generateHardwarePayload(protocol, overrides);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `autolab_${protocol.id}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  return (
    <div className="finnova-dark-section">
      {/* Finnova Top Section Bar with Rounded Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-dark)',
        paddingBottom: '16px'
      }}>
        {/* Left Tabs: All Stages, Heating, Quiescent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveFilterTab('all')}
            style={{
              border: 'none',
              background: activeFilterTab === 'all' ? '#3730a3' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            All Stages <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.68rem' }}>{steps.length}</span>
          </button>

          <button
            onClick={() => setActiveFilterTab('heating')}
            style={{
              border: 'none',
              background: activeFilterTab === 'heating' ? '#3730a3' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Thermal Ramps
          </button>

          <button
            onClick={() => setActiveFilterTab('quiescent')}
            style={{
              border: 'none',
              background: activeFilterTab === 'quiescent' ? '#3730a3' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Quiescent Dwells
          </button>
        </div>

        {/* Right Tools: Export & Console Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowConsole(!showConsole)}
            style={{
              border: '1px solid var(--border-dark)',
              background: showConsole ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: '#e2e8f0',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Terminal size={12} color="var(--primary-light)" />
            {showConsole ? "Hide Serial" : "Show Serial"}
          </button>

          <button
            onClick={handleDownloadJson}
            style={{
              border: '1px solid var(--border-dark)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#e2e8f0',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Download size={12} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Main Split Grid (Finnova Invoices List on Left, Active Details on Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(360px, 2.2fr)',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {/* Left Column: Stages List (Finnova Left Table style) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredSteps.map((step, idx) => {
            const isSelected = selectedStageIdx === idx;
            return (
              <div
                key={step.id}
                onClick={() => setSelectedStageIdx(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isSelected
                    ? 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: isSelected ? '0 4px 16px rgba(67, 56, 202, 0.35)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#3730a3' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {idx + 1}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                      {step.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isSelected ? '#c7d2fe' : '#94a3b8' }}>
                      {step.durationMin} mins • {step.stirRpm > 0 ? `${step.stirRpm} RPM` : 'Quiescent'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: step.targetTempC > 45 ? '#fb7185' : '#38bdf8'
                  }}>
                    {step.targetTempC} <span style={{ fontSize: '0.7rem' }}>°C</span>
                  </div>
                  <span style={{
                    fontSize: '0.62rem',
                    textTransform: 'uppercase',
                    color: isSelected ? '#e0e7ff' : '#64748b',
                    fontWeight: 600
                  }}>
                    {step.operation.split('_')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Stage Inspector & Digital Twin (Finnova Active Details style) */}
        <div style={{
          background: 'rgba(26, 34, 58, 0.7)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}>
          {/* Top Stage Header */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  Active Stage Inspector
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800 }}>
                    # STAGE-0{selectedStageIdx + 1}
                  </h3>
                  <span style={{
                    background: 'rgba(99, 102, 241, 0.25)',
                    color: '#c7d2fe',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}>
                    {activeStep.operation}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                  {activeStep.name} • <strong style={{ color: '#93c5fd' }}>{activeStep.reagents}</strong>
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge-clean badge-clean-green" style={{ fontSize: '0.68rem' }}>
                  Interlock: Verified
                </span>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  Ramp: {activeStep.rampRateCMin} °C/min
                </div>
              </div>
            </div>

            {/* 3 Metric Summary Boxes (Finnova Invoice details row) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '2px' }}>TARGET TEMPERATURE</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  {simTemp} °C
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Offset: {overrides.tempOffset || 0} °C</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '2px' }}>AGITATION SPEED</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                  {simRpm} RPM
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Magnetic Flea Active</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '2px' }}>STAGE DWELL TIME</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                  {activeStep.durationMin} min
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{Math.round(activeStep.durationMin * 60)} seconds</div>
              </div>
            </div>

            {/* Split Display: SVG Thermal Curve on Left + Hotplate Visualizer on Right */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 1.4fr) minmax(180px, 1fr)',
              gap: '14px',
              alignItems: 'center',
              background: 'rgba(11, 17, 30, 0.7)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              marginBottom: '14px'
            }}>
              {/* Left: Reactive Kinetics SVG Curve */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.72rem' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Thermodynamic Curve T(t)</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    Hover: {activePoint.temp}°C @ {activePoint.time}m
                  </span>
                </div>

                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <defs>
                    <linearGradient id="finnovaTempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Area */}
                  <path d={tempAreaPath} fill="url(#finnovaTempGrad)" />

                  {/* Curve Line */}
                  <path
                    d={tempPath}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Hover Marker */}
                  {activePoint && (
                    <g>
                      <circle
                        cx={getX(activePoint.time)}
                        cy={getYTemp(activePoint.temp)}
                        r="4.5"
                        fill="#ffffff"
                        stroke="#4338ca"
                        strokeWidth="2"
                      />
                    </g>
                  )}
                </svg>
              </div>

              {/* Right: Compact Live Hardware Digital Twin */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 10px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {/* Glass Beaker */}
                <div style={{
                  position: 'relative',
                  width: '75px',
                  height: '85px',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  borderTop: 'none',
                  borderRadius: '0 0 10px 10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  marginBottom: '-4px',
                  zIndex: 2
                }}>
                  {/* Liquid */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: '55px',
                    background: liquidColor,
                    borderRadius: '0 0 8px 8px',
                    overflow: 'hidden'
                  }}>
                    {/* Vortex */}
                    {simRpm > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '45px',
                        height: `${vortexDepth}px`,
                        background: '#0d1322',
                        borderRadius: '50%',
                        opacity: 0.6
                      }}></div>
                    )}

                    {/* Magnetic Flea */}
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '50%',
                      width: '20px',
                      height: '5px',
                      background: '#ffffff',
                      borderRadius: '3px',
                      transform: 'translate(-50%, -50%)',
                      animation: simRpm > 0 ? `magneticRotate ${spinDuration}s linear infinite` : 'none'
                    }}></div>
                  </div>
                </div>

                {/* Hotplate Top */}
                <div style={{
                  width: '110px',
                  height: '14px',
                  background: plateGlow,
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: heatFactor > 0.1 ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none',
                  zIndex: 1
                }}></div>

                <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  {simTemp}°C • {simRpm} RPM
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Calibration Sliders + Big Action Button (Finnova Payout Style) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '14px'
          }}>
            {/* Fine-Tuning Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Temp Offset:</span>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={overrides.tempOffset || 0}
                  onChange={(e) => setOverrides(prev => ({ ...prev, tempOffset: parseInt(e.target.value, 10) }))}
                  style={{ width: '80px', accentColor: '#6366f1' }}
                />
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  {overrides.tempOffset > 0 ? `+${overrides.tempOffset}` : overrides.tempOffset || 0}°C
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>RPM Scale:</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1.0}
                  onChange={(e) => setOverrides(prev => ({ ...prev, rpmMultiplier: parseFloat(e.target.value) }))}
                  style={{ width: '80px', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  {overrides.rpmMultiplier || 1.0}x
                </span>
              </div>
            </div>

            {/* Deploy / Payout Button */}
            <button
              onClick={onDeployToLab}
              disabled={isDeploying}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(255, 255, 255, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={15} color="#4338ca" />
              {isDeploying ? "Deploying..." : "Deploy to Lab Hardware"}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Serial Telemetry Console below */}
      {showConsole && (
        <div style={{
          marginTop: '18px',
          background: '#070a12',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
              <Terminal size={13} color="#10b981" />
              ESP8266 Live Serial Telemetry Stream (115200 Baud)
            </span>
            <span style={{ color: '#64748b' }}>COM3 /dev/ttyUSB0</span>
          </div>

          <div style={{
            height: '90px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            lineHeight: '1.5',
            color: '#34d399'
          }}>
            {logs && logs.map((l, i) => (
              <div key={i}>
                <span style={{ color: '#64748b' }}>[{l.timestamp}]</span> <span style={{ color: '#6366f1' }}>[{l.tag}]</span> {l.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
