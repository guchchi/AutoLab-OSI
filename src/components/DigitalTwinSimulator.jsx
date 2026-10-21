import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Play, Pause, RotateCcw, FastForward, Flame, RotateCw, Thermometer, ShieldCheck, Zap } from 'lucide-react';
import { generateKineticsData } from '../utils/thermalKinetics';

export default function DigitalTwinSimulator({
  protocol,
  overrides,
  isRunning,
  setIsRunning,
  onLogEvent
}) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [simSpeed, setSimSpeed] = useState(10); // 10x default for fast hackathon demo
  const [simTemp, setSimTemp] = useState(25.0);
  const [simRpm, setSimRpm] = useState(0);
  const [heaterPwm, setHeaterPwm] = useState(0);

  const kinetics = generateKineticsData(protocol, overrides);
  const totalSimSec = kinetics.stats.totalTimeMin * 60;

  // Active step in protocol
  const steps = protocol.steps;
  const activeStep = steps[currentStepIdx] || steps[0];

  // Target values with overrides
  const targetTemp = Math.round(activeStep.targetTempC + (overrides.tempOffset || 0));
  const targetRpm = Math.round(activeStep.stirRpm * (overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1));

  // Simulation timer loop
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSec(prev => {
          const next = prev + simSpeed * 0.5;
          if (next >= totalSimSec) {
            setIsRunning(false);
            if (onLogEvent) {
              onLogEvent("EXPERIMENT_COMPLETE", "Protocol synthesis finished successfully. All physical stages executed.");
            }
            return totalSimSec;
          }
          return next;
        });

        // Dynamic thermal lag & PID approach
        setSimTemp(prev => {
          const delta = targetTemp - prev;
          if (Math.abs(delta) < 0.2) {
            // stable PID micro-jitter
            return targetTemp + (Math.random() - 0.5) * 0.3;
          }
          const stepChange = (delta > 0 ? 1 : -1) * Math.min(Math.abs(delta), 1.8 * (simSpeed / 5));
          return Math.round((prev + stepChange) * 10) / 10;
        });

        // Dynamic motor acceleration
        setSimRpm(prev => {
          const delta = targetRpm - prev;
          if (Math.abs(delta) < 5) return targetRpm;
          const rpmStep = (delta > 0 ? 1 : -1) * Math.min(Math.abs(delta), 35 * (simSpeed / 5));
          return Math.round(prev + rpmStep);
        });

        // Heater PWM calculation
        const pwm = targetTemp > simTemp ? Math.min(100, Math.round(((targetTemp - simTemp) / 15) * 100)) : 0;
        setHeaterPwm(pwm);

      }, 200);
    }
    return () => clearInterval(interval);
  }, [isRunning, simSpeed, targetTemp, targetRpm, totalSimSec, setIsRunning, onLogEvent, simTemp]);

  // Stage progression based on elapsed time
  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < steps.length; i++) {
      const stepDurationSec = steps[i].durationMin * (overrides.timeScale || 1) * 60;
      accumulated += stepDurationSec;
      if (elapsedSec < accumulated) {
        if (i !== currentStepIdx) {
          setCurrentStepIdx(i);
          if (onLogEvent) {
            onLogEvent("STAGE_TRANSITION", `Entered Stage ${i + 1}: ${steps[i].name} (Target: ${steps[i].targetTempC}°C, ${steps[i].stirRpm} RPM)`);
          }
        }
        break;
      }
    }
  }, [elapsedSec, steps, overrides, currentStepIdx, onLogEvent]);

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSec(0);
    setCurrentStepIdx(0);
    setSimTemp(25.0);
    setSimRpm(0);
    setHeaterPwm(0);
    if (onLogEvent) {
      onLogEvent("SIM_RESET", "Hardware Digital Twin reset to standby ambient state (25°C, 0 RPM).");
    }
  };

  // Color calculation based on protocol & temperature
  let liquidColor = 'rgba(56, 189, 248, 0.45)'; // default clear cyan
  if (protocol.id === 'cspbbr3-quantum-dots') {
    if (simTemp > 140) {
      liquidColor = 'rgba(34, 197, 94, 0.85)'; // glowing green QDs
    } else {
      liquidColor = 'rgba(250, 204, 21, 0.55)'; // yellow oleate solution
    }
  } else if (protocol.id === 'llzo-electrolyte') {
    if (simTemp > 200) {
      liquidColor = 'rgba(51, 65, 85, 0.85)'; // ash/pyrolyzed
    } else if (simTemp > 70) {
      liquidColor = 'rgba(245, 158, 11, 0.65)'; // viscous amber gel
    }
  }

  // Heat glow on hotplate (0 - 1)
  const heatFactor = Math.min(1, Math.max(0, (simTemp - 30) / 180));
  const plateGlow = heatFactor > 0.05
    ? `radial-gradient(circle, rgba(239, 68, 68, ${0.3 + heatFactor * 0.6}) 0%, rgba(249, 115, 22, ${0.2 + heatFactor * 0.4}) 55%, #182030 100%)`
    : '#182030';

  // Magnetic rotation duration
  const spinDuration = simRpm > 0 ? Math.max(0.06, 60 / simRpm) : 0;
  const vortexDepth = Math.min(30, (simRpm / 1000) * 30);

  return (
    <div className="glass-panel glass-panel-glow" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={19} color="var(--accent-cyan)" />
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>
              Step 3: Hardware Digital Twin (ESP8266 Live Node)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Interactive physical lab station simulating thermal dissipation, magnetic stirring, and PWM duty cycle:
            </p>
          </div>
        </div>

        {/* Speed Controls & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            {[1, 5, 10, 25].map(spd => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: simSpeed === spd ? 'var(--accent-cyan)' : 'transparent',
                  color: simSpeed === spd ? '#070a10' : 'var(--text-muted)'
                }}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
          >
            {isRunning ? (
              <>
                <Pause size={14} /> Pause Run
              </>
            ) : (
              <>
                <Play size={14} /> Start Execution
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 12px' }}
            title="Reset Simulator"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Progress Bar of Simulation */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Active Stage {currentStepIdx + 1} of {steps.length}: <strong style={{ color: '#fff' }}>{activeStep.name}</strong>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            {Math.floor(elapsedSec / 60)}m {Math.floor(elapsedSec % 60)}s / {Math.floor(totalSimSec / 60)}m {Math.floor(totalSimSec % 60)}s ({Math.round((elapsedSec / totalSimSec) * 100)}%)
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: `${Math.min(100, (elapsedSec / totalSimSec) * 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00f2fe 0%, #10b981 100%)',
            transition: 'width 0.2s linear'
          }}></div>
        </div>
      </div>

      {/* Hardware Station Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Left Side: Physical Animated Visualizer (Hotplate & Beaker) */}
        <div style={{
          background: '#090d16',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Heat Shimmer Effect when hot */}
          {simTemp > 60 && (
            <div style={{
              position: 'absolute',
              top: '40px',
              width: '120px',
              height: '40px',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, transparent 70%)',
              filter: 'blur(4px)',
              animation: 'pulseGlow 1.2s infinite ease-in-out',
              pointerEvents: 'none'
            }}></div>
          )}

          {/* Glass Beaker Container */}
          <div style={{
            position: 'relative',
            width: '140px',
            height: '160px',
            border: '3px solid rgba(255, 255, 255, 0.4)',
            borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            boxShadow: 'inset 0 0 20px rgba(0, 242, 254, 0.1)',
            marginBottom: '-6px',
            zIndex: 2,
            backdropFilter: 'blur(2px)'
          }}>
            {/* Beaker Measurement Ticks */}
            <div style={{ position: 'absolute', left: '6px', top: '25px', width: '12px', height: '1px', background: 'rgba(255,255,255,0.4)' }}></div>
            <div style={{ position: 'absolute', left: '6px', top: '55px', width: '18px', height: '1px', background: 'rgba(255,255,255,0.5)' }}></div>
            <div style={{ position: 'absolute', left: '6px', top: '85px', width: '12px', height: '1px', background: 'rgba(255,255,255,0.4)' }}></div>
            <div style={{ position: 'absolute', left: '6px', top: '115px', width: '18px', height: '1px', background: 'rgba(255,255,255,0.5)' }}></div>

            {/* Liquid Fill */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '110px',
              background: liquidColor,
              borderRadius: '0 0 13px 13px',
              transition: 'background 0.5s ease',
              overflow: 'hidden'
            }}>
              {/* Liquid Vortex / Meniscus */}
              {simRpm > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `${Math.min(110, 30 + (simRpm / 1000) * 80)}px`,
                  height: `${vortexDepth}px`,
                  background: '#090d16',
                  borderRadius: '50%',
                  opacity: 0.65,
                  filter: 'blur(1px)'
                }}></div>
              )}

              {/* Magnetic Stir Bar (PTFE Flea) */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                width: '32px',
                height: '8px',
                background: '#ffffff',
                borderRadius: '4px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
                transform: 'translate(-50%, -50%)',
                animation: simRpm > 0 ? `magneticSpin ${spinDuration}s linear infinite` : 'none',
                transformOrigin: 'center center'
              }}>
                <div style={{ width: '4px', height: '8px', background: '#94a3b8', margin: '0 auto' }}></div>
              </div>
            </div>
          </div>

          {/* Hotplate Ceramic Top Surface */}
          <div style={{
            width: '210px',
            height: '24px',
            background: plateGlow,
            borderRadius: '6px 6px 2px 2px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: heatFactor > 0.1 ? `0 0 ${20 + heatFactor * 30}px rgba(239, 68, 68, ${0.4 + heatFactor * 0.4})` : '0 4px 12px rgba(0,0,0,0.6)',
            position: 'relative',
            zIndex: 1,
            transition: 'background 0.4s ease, box-shadow 0.4s ease'
          }}></div>

          {/* Hotplate Metal Base Chassis */}
          <div style={{
            width: '250px',
            height: '60px',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '4px 4px 12px 12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '8px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
          }}>
            {/* Status LEDs on hardware chassis */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: isRunning ? 'var(--accent-emerald)' : '#334155',
                  boxShadow: isRunning ? '0 0 8px var(--accent-emerald)' : 'none'
                }}></div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-subtle)' }}>RUN</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: heaterPwm > 0 ? 'var(--accent-rose)' : '#334155',
                  boxShadow: heaterPwm > 0 ? '0 0 8px var(--accent-rose)' : 'none'
                }}></div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-subtle)' }}>HEAT</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: simRpm > 0 ? 'var(--accent-cyan)' : '#334155',
                  boxShadow: simRpm > 0 ? '0 0 8px var(--accent-cyan)' : 'none'
                }}></div>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-subtle)' }}>STIR</span>
              </div>
            </div>

            {/* Hardware Branding */}
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              AUTOLAB-HW-ESP8266
            </div>
          </div>
        </div>

        {/* Right Side: Digital Instrument Readout Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* LCD 7-Segment style temperature readout */}
          <div style={{
            background: '#04070d',
            border: '2px solid rgba(0, 242, 254, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'inset 0 0 15px rgba(0, 242, 254, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PT100 RTD THERMOCOUPLE SENSOR
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
                PID LOOP: ACTIVE
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <span style={{
                  fontSize: '2.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: simTemp > 45 ? 'var(--accent-rose)' : 'var(--accent-cyan)',
                  letterSpacing: '-0.03em'
                }}>
                  {simTemp.toFixed(1)}
                </span>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginLeft: '4px', fontFamily: 'var(--font-mono)' }}>
                  °C
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>SETPOINT TARGET</div>
                <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 700 }}>
                  {targetTemp} °C
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              <span>HEATER PWM DUTY: <strong style={{ color: '#fff' }}>{heaterPwm}%</strong></span>
              <span>ERROR: <strong style={{ color: 'var(--accent-amber)' }}>{(targetTemp - simTemp).toFixed(1)} °C</strong></span>
            </div>
          </div>

          {/* Agitation Speed Readout */}
          <div style={{
            background: '#04070d',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'inset 0 0 15px rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                HALL EFFECT TACHOMETER (AGITATION)
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                OPTICAL TACH: LOCKED
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <span style={{
                  fontSize: '2.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: 'var(--accent-emerald)',
                  letterSpacing: '-0.03em'
                }}>
                  {simRpm}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                  RPM
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>TARGET SPEED</div>
                <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 700 }}>
                  {targetRpm} RPM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
