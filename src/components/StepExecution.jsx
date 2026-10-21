import React, { useState, useEffect } from 'react';
import { Cpu, Send, Play, Pause, RotateCcw, Download, Terminal, CheckCircle2, Radio, ArrowLeft, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateKineticsData, generateHardwarePayload } from '../utils/thermalKinetics';

export default function StepExecution({
  protocol,
  overrides,
  isRunning,
  setIsRunning,
  logs,
  onAddLog,
  onBack,
  onResetAll
}) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [simSpeed, setSimSpeed] = useState(10);
  const [simTemp, setSimTemp] = useState(25.0);
  const [simRpm, setSimRpm] = useState(0);
  const [heaterPwm, setHeaterPwm] = useState(0);
  const [targetEndpoint, setTargetEndpoint] = useState('twin');
  const [customIp, setCustomIp] = useState('http://192.168.4.1/api/protocol');

  const kinetics = generateKineticsData(protocol, overrides);
  const totalSimSec = kinetics.stats.totalTimeMin * 60;
  const steps = protocol.steps;
  const activeStep = steps[currentStepIdx] || steps[0];

  const targetTemp = Math.round(activeStep.targetTempC + (overrides.tempOffset || 0));
  const targetRpm = Math.round(activeStep.stirRpm * (overrides.rpmMultiplier !== undefined ? overrides.rpmMultiplier : 1));

  // Simulation execution loop
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSec(prev => {
          const next = prev + simSpeed * 0.5;
          if (next >= totalSimSec) {
            setIsRunning(false);
            if (onAddLog) {
              onAddLog("EXPERIMENT_COMPLETE", "Protocol synthesis finished successfully. All physical stages executed.");
            }
            return totalSimSec;
          }
          return next;
        });

        // PID approach to temperature
        setSimTemp(prev => {
          const delta = targetTemp - prev;
          if (Math.abs(delta) < 0.2) {
            return targetTemp + (Math.random() - 0.5) * 0.3;
          }
          const stepChange = (delta > 0 ? 1 : -1) * Math.min(Math.abs(delta), 1.8 * (simSpeed / 5));
          return Math.round((prev + stepChange) * 10) / 10;
        });

        // Motor acceleration
        setSimRpm(prev => {
          const delta = targetRpm - prev;
          if (Math.abs(delta) < 5) return targetRpm;
          const rpmStep = (delta > 0 ? 1 : -1) * Math.min(Math.abs(delta), 35 * (simSpeed / 5));
          return Math.round(prev + rpmStep);
        });

        const pwm = targetTemp > simTemp ? Math.min(100, Math.round(((targetTemp - simTemp) / 15) * 100)) : 0;
        setHeaterPwm(pwm);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isRunning, simSpeed, targetTemp, targetRpm, totalSimSec, setIsRunning, onAddLog, simTemp]);

  // Stage progression
  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < steps.length; i++) {
      const stepDurationSec = steps[i].durationMin * (overrides.timeScale || 1) * 60;
      accumulated += stepDurationSec;
      if (elapsedSec < accumulated) {
        if (i !== currentStepIdx) {
          setCurrentStepIdx(i);
          if (onAddLog) {
            onAddLog("STAGE_TRANSITION", `Entered Stage ${i + 1}: ${steps[i].name} (${steps[i].targetTempC}°C, ${steps[i].stirRpm} RPM)`);
          }
        }
        break;
      }
    }
  }, [elapsedSec, steps, overrides, currentStepIdx, onAddLog]);

  const handleDeploy = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#0284c7', '#0369a1', '#10b981', '#ffffff']
      });
    } catch (e) {}

    setIsRunning(true);
    if (onAddLog) {
      onAddLog("WEBHOOK_DISPATCH", `Payload dispatched for ${protocol.name}. ESP8266 acknowledged (CRC32: 0x4F9B). Live execution active.`);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSec(0);
    setCurrentStepIdx(0);
    setSimTemp(25.0);
    setSimRpm(0);
    setHeaterPwm(0);
    if (onAddLog) {
      onAddLog("SIM_RESET", "Hardware Digital Twin reset to standby ambient state (25°C, 0 RPM).");
    }
  };

  // Export handlers
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

  const handleDownloadPython = () => {
    const payload = generateHardwarePayload(protocol, overrides);
    const pyScript = `# AutoLab OS - Standalone Python Hardware Execution Script
import requests
import json

TARGET_URL = "${targetEndpoint === 'custom' ? customIp : 'http://localhost:8080/api/protocol'}"
PAYLOAD = ${JSON.stringify(payload, null, 4)}

def deploy():
    print(f"Deploying {PAYLOAD['material_target']} to {TARGET_URL}...")
    try:
        r = requests.post(TARGET_URL, json=PAYLOAD, timeout=5.0)
        print("ACK:", r.status_code, r.text)
    except Exception as e:
        print("Simulation active:", e)

if __name__ == "__main__":
    deploy()
`;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(pyScript);
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `run_${protocol.id}.py`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  // Liquid and heat visuals
  const heatFactor = Math.min(1, Math.max(0, (simTemp - 30) / 180));
  const plateGlow = heatFactor > 0.05
    ? `radial-gradient(circle, rgba(239, 68, 68, ${0.4 + heatFactor * 0.5}) 0%, rgba(249, 115, 22, ${0.3 + heatFactor * 0.3}) 60%, #1e293b 100%)`
    : '#1e293b';

  const spinDuration = simRpm > 0 ? Math.max(0.06, 60 / simRpm) : 0;
  const vortexDepth = Math.min(26, (simRpm / 1000) * 26);

  let liquidColor = 'rgba(56, 189, 248, 0.55)';
  if (protocol.id === 'cspbbr3-quantum-dots') {
    liquidColor = simTemp > 140 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(250, 204, 21, 0.6)';
  } else if (protocol.id === 'llzo-electrolyte') {
    liquidColor = simTemp > 200 ? 'rgba(71, 85, 105, 0.85)' : simTemp > 70 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(56, 189, 248, 0.55)';
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Execution Header */}
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
            <span className="badge-clean badge-clean-blue">
              <Cpu size={13} />
              Hardware Dispatch Node
            </span>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
              ● ESP8266 Online & Armed
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownloadJson}
              className="btn-subtle"
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
            >
              <Download size={13} /> JSON Bytecode
            </button>
            <button
              onClick={handleDownloadPython}
              className="btn-subtle"
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
            >
              <Download size={13} /> Python Runner (.py)
            </button>
          </div>
        </div>

        <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
          Physical Execution: <span style={{ color: 'var(--primary)' }}>{protocol.name}</span>
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '20px' }}>
          Broadcast machine bytecode to physical ESP8266 or execute in the live interactive digital twin:
        </p>

        {/* Target Dispatch Selector + Deploy Action Bar */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Dispatch Target:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#0f172a', cursor: 'pointer' }}>
              <input
                type="radio"
                name="target"
                checked={targetEndpoint === 'twin'}
                onChange={() => setTargetEndpoint('twin')}
              />
              Virtual Digital Twin (In-Memory)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#0f172a', cursor: 'pointer' }}>
              <input
                type="radio"
                name="target"
                checked={targetEndpoint === 'custom'}
                onChange={() => setTargetEndpoint('custom')}
              />
              Physical ESP8266 Webhook
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: 'var(--radius-pill)' }}>
              {[1, 5, 10, 25].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  style={{
                    border: 'none',
                    background: simSpeed === spd ? 'var(--primary)' : 'transparent',
                    color: simSpeed === spd ? '#ffffff' : '#64748b',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={handleDeploy}
              className="btn-primary-ocean"
              style={{ padding: '10px 22px' }}
            >
              <Send size={15} />
              Deploy to Lab Hardware
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '6px' }}>
            <span style={{ color: '#64748b' }}>
              Active Stage {currentStepIdx + 1} of {steps.length}: <strong style={{ color: '#0f172a' }}>{activeStep.name}</strong>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>
              {Math.floor(elapsedSec / 60)}m {Math.floor(elapsedSec % 60)}s / {Math.floor(totalSimSec / 60)}m ({Math.round((elapsedSec / totalSimSec) * 100)}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (elapsedSec / totalSimSec) * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0284c7 0%, #059669 100%)',
              transition: 'width 0.2s linear'
            }}></div>
          </div>
        </div>

        {/* Hardware Visualizer & Digital Gauges Split */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'center',
          background: '#0b1324',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          color: '#ffffff',
          marginBottom: '24px'
        }}>
          {/* Left: Physical Station (Hotplate & Beaker) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Heat Shimmer */}
            {simTemp > 60 && (
              <div style={{
                width: '100px',
                height: '30px',
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)',
                filter: 'blur(3px)',
                animation: 'pulseDot 1.2s infinite ease-in-out',
                marginBottom: '-10px',
                zIndex: 3
              }}></div>
            )}

            {/* Glass Beaker */}
            <div style={{
              position: 'relative',
              width: '120px',
              height: '135px',
              border: '3px solid rgba(255, 255, 255, 0.45)',
              borderTop: 'none',
              borderRadius: '0 0 14px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              boxShadow: 'inset 0 0 15px rgba(2, 132, 199, 0.1)',
              marginBottom: '-4px',
              zIndex: 2
            }}>
              {/* Measurement marks */}
              <div style={{ position: 'absolute', left: '6px', top: '25px', width: '12px', height: '1px', background: 'rgba(255,255,255,0.4)' }}></div>
              <div style={{ position: 'absolute', left: '6px', top: '55px', width: '16px', height: '1px', background: 'rgba(255,255,255,0.5)' }}></div>
              <div style={{ position: 'absolute', left: '6px', top: '85px', width: '12px', height: '1px', background: 'rgba(255,255,255,0.4)' }}></div>

              {/* Liquid */}
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: '90px',
                background: liquidColor,
                borderRadius: '0 0 11px 11px',
                overflow: 'hidden'
              }}>
                {/* Vortex */}
                {simRpm > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${Math.min(90, 25 + (simRpm / 1000) * 65)}px`,
                    height: `${vortexDepth}px`,
                    background: '#0b1324',
                    borderRadius: '50%',
                    opacity: 0.65
                  }}></div>
                )}

                {/* Magnetic Flea */}
                <div style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '50%',
                  width: '26px',
                  height: '7px',
                  background: '#ffffff',
                  borderRadius: '4px',
                  transform: 'translate(-50%, -50%)',
                  animation: simRpm > 0 ? `magneticRotate ${spinDuration}s linear infinite` : 'none'
                }}></div>
              </div>
            </div>

            {/* Hotplate Top Surface */}
            <div style={{
              width: '180px',
              height: '18px',
              background: plateGlow,
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: heatFactor > 0.1 ? `0 0 20px rgba(239, 68, 68, ${0.4 + heatFactor * 0.4})` : 'none',
              zIndex: 1
            }}></div>

            {/* Chassis Base */}
            <div style={{
              width: '210px',
              height: '42px',
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '2px 2px 8px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              marginTop: '1px'
            }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>ESP8266-LAB-NODE</span>
              <span style={{ fontSize: '0.62rem', color: isRunning ? '#10b981' : '#64748b' }}>
                {isRunning ? '● RUNNING' : '○ IDLE'}
              </span>
            </div>
          </div>

          {/* Right: Digital Instrument Gauges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#050914', border: '1px solid rgba(2, 132, 199, 0.3)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                RTD SENSOR TEMPERATURE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: simTemp > 45 ? '#fb7185' : '#38bdf8' }}>
                  {simTemp.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>°C</span>
                </span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  Target: {targetTemp}°C
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                Heater PWM Duty: <strong style={{ color: '#ffffff' }}>{heaterPwm}%</strong>
              </div>
            </div>

            <div style={{ background: '#050914', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.68rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                MAGNETIC TACHOMETER (AGITATION)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                  {simRpm} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>RPM</span>
                </span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  Target: {targetRpm} RPM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Serial Console */}
        <div style={{
          background: '#070a12',
          border: '1px solid #1e293b',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.74rem', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
              <Terminal size={14} color="#10b981" />
              ESP8266 Live Serial Telemetry (115200 Baud)
            </span>
            <span style={{ color: '#64748b' }}>Node: COM3 / /dev/ttyUSB0</span>
          </div>

          <div style={{
            height: '110px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            lineHeight: '1.6',
            color: '#34d399'
          }}>
            {logs && logs.map((l, i) => (
              <div key={i}>
                <span style={{ color: '#64748b' }}>[{l.timestamp}]</span> <span style={{ color: '#38bdf8' }}>[{l.tag}]</span> {l.message}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Navigation Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <button
            onClick={onBack}
            className="btn-subtle"
          >
            <ArrowLeft size={16} />
            Back to Kinetics
          </button>

          <button
            onClick={onResetAll}
            className="btn-subtle"
            style={{ fontWeight: 700 }}
          >
            <RotateCw size={15} />
            Run Another Experiment Protocol
          </button>
        </div>
      </div>
    </div>
  );
}
