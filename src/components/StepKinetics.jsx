import React, { useState, useMemo } from 'react';
import { Layers, Thermometer, RotateCw, Clock, ArrowRight, ArrowLeft, ShieldCheck, Activity, Sliders } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
    <div className="max-w-5xl mx-auto">
      <Card className="p-8 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1.5 py-1 px-3">
              <Activity size={13} />
              Reactive Kinetics Engine (Marimo Verified)
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Thermodynamic T(t) Simulation</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-sky-600 rounded-sm"></span>
              <span className="text-slate-900">Temperature (°C)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600"></span>
              <span className="text-slate-600">Stirring (RPM)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dotted border-rose-600"></span>
              <span className="text-rose-600">Safety Ceiling</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Thermodynamic Simulation: <span className="text-sky-600">{protocol.name}</span>
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Interactive mathematical curve verifying thermal ramp rates, soak plateaus, and safety boundaries:
        </p>

        {/* SVG Kinetics Chart */}
        <div className="relative w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden mb-6">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto block cursor-crosshair"
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
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
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

            {/* Shaded Area & Line */}
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
                  stroke="rgba(255, 255, 255, 0.35)"
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
            <div className="absolute top-3 right-4 bg-slate-900/90 border border-sky-500/40 rounded-lg px-3.5 py-1.5 text-xs font-mono flex items-center gap-3 text-white backdrop-blur-xs">
              <span>Time: <strong className="text-white">{activePoint.time}m</strong></span>
              <span>•</span>
              <span className="text-sky-400">Temp: <strong>{activePoint.temp}°C</strong></span>
              <span>•</span>
              <span className="text-emerald-400">RPM: <strong>{activePoint.rpm}</strong></span>
              <span>•</span>
              <span className="text-slate-400">{activePoint.stepName}</span>
            </div>
          )}
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Time</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
              {stats.totalTimeMin}m <span className="text-xs font-normal text-slate-500">({(stats.totalTimeMin / 60).toFixed(1)}h)</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Peak Temperature</div>
            <div className="text-xl font-extrabold text-sky-600 font-mono mt-1">
              {stats.peakTemp} °C
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Max Agitation</div>
            <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
              {stats.maxRpm} RPM
            </div>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Safety Interlock</div>
            <div className="text-sm font-bold text-emerald-900 flex items-center gap-1.5 mt-1">
              <ShieldCheck size={16} className="text-emerald-600" />
              Envelope Cleared
            </div>
          </div>
        </div>

        {/* Calibration Sliders */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={16} className="text-sky-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Researcher Verification & Fine Calibration
            </h4>
            <span className="text-xs text-slate-500">(Adjust before physical deployment)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600">Temp Offset:</span>
                <span className="text-sky-600 font-mono">
                  {overrides.tempOffset > 0 ? `+${overrides.tempOffset}` : overrides.tempOffset || 0} °C
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                value={overrides.tempOffset || 0}
                onChange={(e) => setOverrides(prev => ({ ...prev, tempOffset: parseInt(e.target.value, 10) }))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600">Stirring RPM Scaling:</span>
                <span className="text-emerald-600 font-mono">
                  {overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier.toFixed(1) : 1.0}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1.0}
                onChange={(e) => setOverrides(prev => ({ ...prev, rpmMultiplier: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600">Dwell Duration Scale:</span>
                <span className="text-amber-600 font-mono">
                  {overrides.timeScale !== undefined ? overrides.timeScale.toFixed(1) : 1.0}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={overrides.timeScale !== undefined ? overrides.timeScale : 1.0}
                onChange={(e) => setOverrides(prev => ({ ...prev, timeScale: parseFloat(e.target.value) }))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to Literature
          </Button>

          <Button
            variant="ocean"
            onClick={onNext}
            className="gap-2 font-bold shadow-md shadow-sky-500/20"
          >
            Proceed to Physical Lab Execution
            <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
