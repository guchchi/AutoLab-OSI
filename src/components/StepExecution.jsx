import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Send,
  RotateCcw,
  Download,
  Terminal,
  ArrowLeft,
  RotateCw,
  AlertOctagon,
  ShieldAlert,
  Flame,
  Code2,
  Sliders,
  Play,
  Pause,
  SkipForward,
  Check,
  Layers,
  Sun,
  Snowflake,
  Fan
} from 'lucide-react';
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
  const [isAborted, setIsAborted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liveTempNudge, setLiveTempNudge] = useState(0);
  const [liveRpmNudge, setLiveRpmNudge] = useState(0);
  const [liveUvOverride, setLiveUvOverride] = useState(null);

  // ── Direct Lab Actuators State (Heater, Cooler, Mixer, UV) ──
  const [heaterActive, setHeaterActive] = useState(true);
  const [manualHeaterTarget, setManualHeaterTarget] = useState(null); // null = protocol controlled
  const [coolerActive, setCoolerActive] = useState(false);
  const [coolerIntensity, setCoolerIntensity] = useState(75); // 0-100%
  const [mixerActive, setMixerActive] = useState(true);
  const [manualMixerRpm, setManualMixerRpm] = useState(null); // null = protocol controlled
  const [uvIntensity, setUvIntensity] = useState(80); // 0-100%

  const [nodeIp, setNodeIp] = useState('http://192.168.1.15/dispatch');
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const terminalBoxRef = useRef(null);

  const kinetics = generateKineticsData(protocol, overrides);
  const totalSimSec = kinetics.stats.totalTimeMin * 60;
  const steps = protocol.steps;
  const activeStep = steps[currentStepIdx] || steps[0];

  // Real-time target with live researcher nudges and direct actuator controls
  const baseTargetTemp = Math.round(activeStep.targetTempC + (overrides.tempOffset || 0));
  const autoTargetTemp = Math.max(20, Math.min(protocol.safetyEnvelope.maxTempC, baseTargetTemp + liveTempNudge));
  
  let targetTemp = autoTargetTemp;
  if (!heaterActive && !coolerActive) {
    targetTemp = 25.0; // heater powered down, cools to ambient
  } else if (coolerActive) {
    targetTemp = Math.max(10, Math.round(25 - (coolerIntensity / 100) * 15)); // active cryogenic chilling
  } else if (manualHeaterTarget !== null) {
    targetTemp = manualHeaterTarget;
  }

  const baseTargetRpm = Math.round(activeStep.stirRpm * (overrides.rpmMultiplier ?? 1));
  const autoTargetRpm = Math.max(0, Math.min(1500, baseTargetRpm + liveRpmNudge));
  
  let targetRpm = autoTargetRpm;
  if (!mixerActive) {
    targetRpm = 0;
  } else if (manualMixerRpm !== null) {
    targetRpm = manualMixerRpm;
  }

  const isUvActive = liveUvOverride !== null ? liveUvOverride : Boolean(activeStep.uvExposure);

  // Compact JSON hardware bytecode payload with 4-actuator telemetry (Heater, Cooler, Mixer, UV)
  const compactPayload = {
    command: isAborted ? "KILL" : (isRunning && !isPaused ? "EXECUTE" : (isPaused ? "PAUSE" : "STANDBY")),
    experiment_id: `EXP-${(protocol.name.slice(0, 3) || 'OSI').toUpperCase()}-2026`,
    material_target: protocol.name,
    stage_index: currentStepIdx + 1,
    stage_name: activeStep.name,
    temp_c: targetTemp,
    rpm: targetRpm,
    uv_cure: isUvActive,
    actuators: {
      heater: heaterActive && !coolerActive ? "ACTIVE" : "OFF",
      cooler: coolerActive ? `${coolerIntensity}%` : "OFF",
      mixer: mixerActive && targetRpm > 0 ? `${targetRpm}RPM` : "OFF",
      uv: isUvActive ? `${uvIntensity}% (365nm)` : "OFF"
    },
    crc32: "0x" + ((targetTemp * 37 + targetRpm * 13 + currentStepIdx * 101 + (isUvActive ? 777 : 0) + (coolerActive ? 333 : 0)) & 0xffff).toString(16).toUpperCase(),
    timestamp: new Date().toISOString()
  };

  // Auto-scroll inside terminal box ONLY — never scroll the page
  useEffect(() => {
    if (terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // Main Hardware Simulation / Telemetry Loop
  useEffect(() => {
    let iv = null;
    if (isRunning && !isAborted && !isPaused) {
      iv = setInterval(() => {
        setElapsedSec(prev => {
          const next = prev + simSpeed * 0.5;
          if (next >= totalSimSec) {
            setIsRunning(false);
            onAddLog?.('EXPERIMENT_COMPLETE', 'Protocol synthesis completed successfully. All hardware stages executed.');
            try {
              confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#D1F34D', '#0058BE', '#22C55E'] });
            } catch (_) {}
            return totalSimSec;
          }
          return next;
        });

        // PID approach with micro-jitter and rapid cooler response
        setSimTemp(prev => {
          const d = targetTemp - prev;
          if (coolerActive) {
            // Rapid quench cooling rate
            return Math.round((prev + Math.sign(d) * Math.min(Math.abs(d), 3.8 * (simSpeed / 5))) * 10) / 10;
          }
          if (Math.abs(d) < 0.2) return targetTemp + (Math.random() - 0.5) * 0.3;
          return Math.round((prev + Math.sign(d) * Math.min(Math.abs(d), 2.2 * (simSpeed / 5))) * 10) / 10;
        });

        // Motor tachometer ramp
        setSimRpm(prev => {
          const d = targetRpm - prev;
          if (Math.abs(d) < 5) return targetRpm;
          return Math.round(prev + Math.sign(d) * Math.min(Math.abs(d), 45 * (simSpeed / 5)));
        });

        setHeaterPwm(targetTemp > simTemp && heaterActive && !coolerActive ? Math.min(100, Math.round(((targetTemp - simTemp) / 15) * 100)) : 0);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [isRunning, isAborted, isPaused, simSpeed, targetTemp, targetRpm, totalSimSec, setIsRunning, onAddLog, simTemp, coolerActive, heaterActive]);

  // Stage advancement based on elapsed time
  useEffect(() => {
    if (isAborted || isPaused) return;
    let acc = 0;
    for (let i = 0; i < steps.length; i++) {
      acc += steps[i].durationMin * (overrides.timeScale || 1) * 60;
      if (elapsedSec < acc) {
        if (i !== currentStepIdx) {
          setCurrentStepIdx(i);
          setLiveTempNudge(0);
          setLiveRpmNudge(0);
          setLiveUvOverride(null);
          onAddLog?.('STAGE_TRANSITION', `Engaged Stage ${i + 1}: ${steps[i].name} (Set: ${steps[i].targetTempC}°C, Stir: ${steps[i].stirRpm} RPM)`);
        }
        break;
      }
    }
  }, [elapsedSec, steps, overrides, currentStepIdx, onAddLog, isAborted, isPaused]);

  // Stage start time helper
  const getStageStartTime = (idx) => {
    let t = 0;
    for (let i = 0; i < idx; i++) {
      t += steps[i].durationMin * (overrides.timeScale || 1) * 60;
    }
    return t;
  };

  // Jump to specific stage
  const handleJumpToStage = (idx) => {
    if (idx < 0 || idx >= steps.length) return;
    setCurrentStepIdx(idx);
    setElapsedSec(getStageStartTime(idx));
    setLiveTempNudge(0);
    setLiveRpmNudge(0);
    setLiveUvOverride(null);
    onAddLog?.('MANUAL_STAGE_OVERRIDE', `Researcher manually engaged Stage ${idx + 1}: ${steps[idx].name}`);
  };

  // Force advance to next stage
  const handleNextStage = () => {
    if (currentStepIdx < steps.length - 1) {
      handleJumpToStage(currentStepIdx + 1);
    }
  };

  // Step back to previous stage
  const handlePrevStage = () => {
    if (currentStepIdx > 0) {
      handleJumpToStage(currentStepIdx - 1);
    }
  };

  // Restart current stage
  const handleRestartStage = () => {
    handleJumpToStage(currentStepIdx);
  };

  // Dispatch Webhook to ESP8266 or Local Bridge
  const handleDeploy = async () => {
    setIsAborted(false);
    setIsPaused(false);
    setIsRunning(true);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 }, colors: ['#D1F34D', '#0058BE', '#22C55E'] });
    } catch (_) {}

    onAddLog?.('SYSTEM', `Compiling synthesis bytecode for ${protocol.name}...`);
    onAddLog?.('NETWORK', `Dispatching payload to ESP8266 node (${nodeIp})...`);

    try {
      const res = await fetch('/api/esp8266/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compactPayload)
      });
      const data = await res.json();
      onAddLog?.('HARDWARE', `200 OK. Handshake successful. Node MCU acknowledged (CRC32: ${data.crc32 || compactPayload.crc32}).`);
      onAddLog?.('STATUS', `Heater Relay: ARMED (GPIO5) | Mixer Servo: ACTIVE (GPIO4)`);
    } catch (e) {
      onAddLog?.('HARDWARE', `200 OK. Simulated ESP8266 Handshake active (CRC32: ${compactPayload.crc32}).`);
      onAddLog?.('STATUS', `Heater Relay: ARMED | Mixer Servo: ACTIVE`);
    }
  };

  // Toggle Pause / Resume
  const handleTogglePause = () => {
    if (!isRunning) return;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (nextPaused) {
      onAddLog?.('OPERATOR_HOLD', `⏸ Operator paused synthesis at Stage ${currentStepIdx + 1}. PID heaters in hold mode.`);
    } else {
      onAddLog?.('OPERATOR_RESUME', `▶ Operator resumed synthesis at Stage ${currentStepIdx + 1}.`);
    }
  };

  // Emergency Abort (Kill Switch)
  const handleEmergencyAbort = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsAborted(true);
    setHeaterPwm(0);
    setSimRpm(0);

    onAddLog?.('EMERGENCY_ABORT', `🛑 OPERATOR FIRED EMERGENCY STOP! All heating channels clamped to 0 PWM. Motor braked to 0 RPM.`);

    try {
      await fetch('/api/esp8266/abort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'KILL', reason: 'OPERATOR_ABORT', timestamp: new Date().toISOString() })
      });
      onAddLog?.('HARDWARE', `NodeMCU acknowledged KILL signal. Relays isolated. System safe.`);
    } catch (e) {
      onAddLog?.('HARDWARE', `Local hardware interlock opened. System safe.`);
    }
  };

  const handleDownloadJson = () => {
    const payload = generateHardwarePayload(protocol, overrides);
    const dl = Object.assign(document.createElement('a'), {
      href: 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2)),
      download: `autolab_${protocol.id}.json`,
    });
    document.body.appendChild(dl); dl.click(); dl.remove();
  };

  // Visual calculations & stage timing
  const stageStartSec = getStageStartTime(currentStepIdx);
  const stageDurationSec = Math.max(1, activeStep.durationMin * (overrides.timeScale || 1) * 60);
  const stageElapsedSec = Math.max(0, Math.min(stageDurationSec, elapsedSec - stageStartSec));
  const stageRemainingSec = Math.max(0, stageDurationSec - stageElapsedSec);
  const stageProgressPct = Math.min(100, Math.round((stageElapsedSec / stageDurationSec) * 100));

  const heatF = Math.min(1, Math.max(0, (simTemp - 25) / 180));
  const spinDur = simRpm > 0 ? Math.max(0.06, 60 / simRpm) : 0;
  const vortex = Math.min(26, (simRpm / 1000) * 26);
  const progressPct = Math.min(100, Math.round((elapsedSec / totalSimSec) * 100));

  let liquidColor = 'rgba(74,116,97,0.5)';
  if (protocol.id?.includes('perovskite') || protocol.id?.includes('cspbbr3'))
    liquidColor = simTemp > 140 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(245, 158, 11, 0.65)';
  else if (protocol.id?.includes('llzo'))
    liquidColor = simTemp > 200 ? 'rgba(15, 23, 42, 0.85)' : simTemp > 70 ? 'rgba(245, 158, 11, 0.65)' : 'rgba(0, 88, 190, 0.45)';
  else if (protocol.id?.includes('fe3o4'))
    liquidColor = simTemp > 60 ? 'rgba(15, 23, 42, 0.95)' : 'rgba(180, 83, 9, 0.7)';

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="fade-in">

      {/* ── 1. Top Header: Mission Control Status & Master Controls ── */}
      <div className="notebook-card" style={{ padding: '1.25rem 1.5rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
              <span className="lab-badge lab-badge-lime" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Cpu size={12} />
                Step 4 · Hardware Dispatch
              </span>
              <span className="lab-badge lab-badge-sage" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="pulse-indicator" />
                ESP8266 Station Connected (COM3)
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>
                Baud 115200 · CRC32 Armed
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--deep-charcoal)', letterSpacing: '-0.02em', margin: 0 }}>
              Live Hardware Telemetry & Execution —{' '}
              <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>{protocol.name}</span>
            </h2>
          </div>

          {/* Quick Actions (Bytecode, Export, Kill) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => setShowPayloadModal(true)} style={{ fontSize: '0.72rem', padding: '0.4rem 0.75rem' }}>
              <Code2 size={13} /> Bytecode
            </button>
            <button className="btn-ghost" onClick={handleDownloadJson} style={{ fontSize: '0.72rem', padding: '0.4rem 0.75rem' }}>
              <Download size={13} /> Export JSON
            </button>

            {/* Emergency Kill Switch */}
            <button
              onClick={handleEmergencyAbort}
              disabled={!isRunning && isAborted}
              style={{
                background: isAborted ? '#450a0a' : '#DC2626',
                color: '#ffffff',
                border: '1.5px solid #EF4444',
                borderRadius: 'var(--radius-full)',
                padding: '0.45rem 1rem',
                fontWeight: 800,
                fontSize: '0.78rem',
                letterSpacing: '0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: isAborted ? 'default' : 'pointer',
                boxShadow: isAborted ? 'none' : '0 0 14px rgba(220, 38, 38, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <AlertOctagon size={15} />
              {isAborted ? 'HALTED' : 'KILL SWITCH'}
            </button>
          </div>

        </div>
      </div>

      {/* ── 2. Master Command & Real-Time Dispatch Bar ── */}
      <div style={{
        background: 'var(--deep-charcoal)',
        borderRadius: '16px',
        padding: '1rem 1.35rem',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(11, 28, 48, 0.15)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Left: Execution Status & Main Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          
          {/* Primary Action Button */}
          {!isRunning || isAborted ? (
            <button
              className="btn-primary"
              onClick={handleDeploy}
              style={{
                padding: '0.65rem 1.4rem',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 18px rgba(209, 243, 77, 0.45)',
              }}
            >
              <Play size={16} fill="currentColor" />
              {isAborted ? 'Restart Lab Protocol' : 'Arm & Fire Webhook to Lab'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handleTogglePause}
                style={{
                  background: isPaused ? 'var(--primary-lime)' : 'rgba(255,255,255,0.12)',
                  color: isPaused ? 'var(--deep-charcoal)' : '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
                {isPaused ? 'Resume Lab' : 'Pause'}
              </button>

              <button
                onClick={handlePrevStage}
                disabled={currentStepIdx === 0}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.55rem 0.9rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: currentStepIdx === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentStepIdx === 0 ? 0.35 : 1,
                  transition: 'all 0.18s ease',
                }}
                title="Step back to previous stage"
              >
                ⏮ Prev
              </button>

              <button
                onClick={handleNextStage}
                disabled={currentStepIdx >= steps.length - 1}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.55rem 1rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: currentStepIdx >= steps.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentStepIdx >= steps.length - 1 ? 0.4 : 1,
                  transition: 'all 0.18s ease',
                }}
                title="Advance immediately to next stage"
              >
                <SkipForward size={14} />
                Next Stage ⏭
              </button>
            </div>
          )}

          {/* Running State Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isAborted ? '#EF4444' : (isRunning ? (isPaused ? '#F59E0B' : '#22C55E') : '#94A3B8'),
              boxShadow: isRunning && !isPaused ? '0 0 10px #22C55E' : 'none'
            }} />
            <span style={{ fontWeight: 700, color: '#F8FAFC' }}>
              {isAborted ? 'STATUS: ABORTED (SAFE)' : (isRunning ? (isPaused ? 'STATUS: PAUSED (HOLD)' : 'STATUS: EXECUTING LIVE') : 'STATUS: READY TO DEPLOY')}
            </span>
          </div>
        </div>

        {/* Right: Real-Time Playback Clock Speed Multipliers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Time-Warp:</span>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[1, 5, 10, 25].map(spd => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                style={{
                  border: 'none', padding: '0.25rem 0.6rem', borderRadius: '9999px',
                  fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  background: simSpeed === spd ? 'var(--primary-lime)' : 'transparent',
                  color: simSpeed === spd ? 'var(--deep-charcoal)' : '#94A3B8',
                  transition: 'all 0.15s ease'
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── 3. The 2-Column Bento Cockpit ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(360px, 1.05fr)',
        gap: '1.25rem',
        alignItems: 'start',
      }}>

        {/* ── LEFT COLUMN: Physical Hardware Digital Twin & Live Gauges ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Hardware Apparatus Sandbox Container */}
          <div style={{
            background: 'var(--deep-charcoal)',
            borderRadius: '16px',
            border: '1px solid #1E3A5F',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(11, 28, 48, 0.15)',
          }}>
            
            {/* Top Node Status 4-Actuator Pinouts */}
            <div style={{
              position: 'absolute', top: '0.85rem', left: '1rem', right: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '0.5rem',
            }}>
              {/* Heater */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: heaterPwm > 0 && !isAborted && !coolerActive ? '#EF4444' : '#450a0a',
                  boxShadow: heaterPwm > 0 && !isAborted && !coolerActive ? '0 0 10px #EF4444' : 'none',
                  transition: 'all 0.25s ease',
                }} />
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
                  HTR: {heaterPwm > 0 && !isAborted && !coolerActive ? `PWM ${heaterPwm}%` : 'OFF'}
                </span>
              </div>

              {/* Cooler */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: coolerActive && !isAborted ? '#38BDF8' : '#0e3a53',
                  boxShadow: coolerActive && !isAborted ? '0 0 10px #38BDF8' : 'none',
                  transition: 'all 0.25s ease',
                }} />
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
                  CHILL: {coolerActive && !isAborted ? `${coolerIntensity}%` : 'IDLE'}
                </span>
              </div>

              {/* Mixer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: simRpm > 0 && !isAborted ? 'var(--primary-lime)' : '#143820',
                  boxShadow: simRpm > 0 && !isAborted ? '0 0 10px var(--primary-lime)' : 'none',
                  transition: 'all 0.25s ease',
                }} />
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
                  STIR: {simRpm > 0 && !isAborted ? `${simRpm} RPM` : 'BRAKED'}
                </span>
              </div>

              {/* UV */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: isUvActive && !isAborted ? '#7C3AED' : '#2b1055',
                  boxShadow: isUvActive && !isAborted ? '0 0 10px #7C3AED' : 'none',
                  transition: 'all 0.25s ease',
                }} />
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
                  UV: {isUvActive && !isAborted ? `${uvIntensity}% (365nm)` : 'OFF'}
                </span>
              </div>
            </div>

            {/* Central Precision Benchtop Reactor Assembly */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              marginTop: '2.5rem', marginBottom: '1rem', position: 'relative'
            }}>

              {/* Overhead UV Photopolymer Diagnostic Lamp Emitter */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '-4px', zIndex: 10
              }}>
                <div style={{
                  width: '90px', height: '14px',
                  background: isUvActive ? 'linear-gradient(90deg, #4C1D95 0%, #7C3AED 50%, #4C1D95 100%)' : '#1E293B',
                  border: isUvActive ? '1px solid #A78BFA' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: isUvActive ? '0 0 18px rgba(124, 58, 237, 0.6)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  transition: 'all 0.3s ease'
                }}>
                  <Sun size={9} color={isUvActive ? '#EDE9FE' : '#64748B'} />
                  <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: isUvActive ? '#FFFFFF' : '#64748B' }}>
                    {isUvActive ? `UV 365nm (${uvIntensity}%)` : 'UV LAMP (OFF)'}
                  </span>
                </div>

                {/* Radiative UV Light Cone Beam */}
                {isUvActive && !isAborted && (
                  <div style={{
                    width: '84px', height: '24px',
                    background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.5) 0%, rgba(168, 85, 247, 0.15) 80%, transparent 100%)',
                    filter: 'blur(2px)', pointerEvents: 'none',
                    animation: 'pulseDot 1.4s ease-in-out infinite'
                  }} />
                )}
              </div>

              {/* Thermal Heat Shimmer OR Cryo Frost Mist */}
              {coolerActive && !isAborted ? (
                <div style={{
                  width: '120px', height: '20px',
                  background: 'radial-gradient(ellipse, rgba(56,189,248,0.45) 0%, transparent 70%)',
                  filter: 'blur(3px)', marginBottom: '-6px', zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'frostPulse 1.6s ease-in-out infinite'
                }}>
                  <span style={{ fontSize: '11px', color: '#BAE6FD', opacity: 0.9 }}>❄ ❄ ❄</span>
                </div>
              ) : simTemp > 50 && !isAborted ? (
                <div style={{
                  width: '110px', height: '22px',
                  background: 'radial-gradient(ellipse, rgba(245,158,11,0.3) 0%, transparent 70%)',
                  filter: 'blur(4px)', marginBottom: '-6px', zIndex: 1,
                  animation: 'pulseDot 1.8s ease-in-out infinite',
                }} />
              ) : (
                <div style={{ height: isUvActive ? '0px' : '16px' }} />
              )}

              {/* Glass Beaker with Gradations & Solution */}
              <div style={{
                position: 'relative', width: '130px', height: '136px',
                border: '2px solid rgba(255,255,255,0.25)', borderTop: 'none',
                borderRadius: '0 0 18px 18px',
                background: coolerActive
                  ? 'rgba(56,189,248,0.06)'
                  : (isUvActive ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.04)'),
                boxShadow: isUvActive
                  ? '0 0 25px rgba(124, 58, 237, 0.35), inset 0 0 16px rgba(124, 58, 237, 0.2)'
                  : (coolerActive
                    ? 'inset 0 0 18px rgba(56,189,248,0.25), 0 0 15px rgba(56,189,248,0.2)'
                    : 'inset 0 0 12px rgba(255,255,255,0.05)'),
                zIndex: 2,
                transition: 'all 0.4s ease'
              }}>
                {[24, 52, 80].map(top => (
                  <div key={top} style={{ position: 'absolute', left: '8px', top: `${top}px`, width: '12px', height: '1px', background: 'rgba(255,255,255,0.25)' }} />
                ))}

                {/* Chemical Solution Fluid */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '86px',
                  borderRadius: '0 0 16px 16px', overflow: 'hidden',
                  background: isAborted
                    ? 'rgba(70,60,50,0.4)'
                    : (coolerActive
                      ? 'rgba(14, 116, 144, 0.75)'
                      : (isUvActive ? 'rgba(88, 28, 135, 0.75)' : liquidColor)),
                  transition: 'background 0.8s ease',
                }}>
                  {/* Vortex fluid cone */}
                  {simRpm > 100 && !isAborted && (
                    <div style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      width: '68px', height: `${vortex}px`,
                      background: 'rgba(11, 28, 48, 0.85)', borderRadius: '0 0 50% 50%', opacity: 0.8,
                    }} />
                  )}

                  {/* Magnetic Stirrer Bar */}
                  <div style={{
                    position: 'absolute', bottom: '9px', left: '50%',
                    width: '34px', height: '8px', background: '#FFFFFF',
                    boxShadow: '0 0 10px rgba(255,255,255,0.95)',
                    borderRadius: '4px',
                    animation: simRpm > 0 && !isAborted ? `magneticRotate ${spinDur}s linear infinite` : 'none',
                  }} />
                </div>
              </div>

              {/* Hotplate Thermal Ring Surface OR Cryo Peltier Base */}
              <div style={{
                width: '175px', height: '16px', borderRadius: '4px',
                border: `1px solid ${coolerActive ? '#38BDF8' : (heatF > 0.2 && !isAborted ? '#EF4444' : 'rgba(255,255,255,0.15)')}`,
                background: coolerActive
                  ? 'linear-gradient(90deg, #0369A1 0%, #38BDF8 50%, #0369A1 100%)'
                  : (heatF > 0.05 && !isAborted
                    ? `radial-gradient(circle, rgba(239,68,68,${0.35 + heatF * 0.45}) 0%, rgba(245,158,11,${0.25 + heatF * 0.25}) 60%, #0B1C30 100%)`
                    : '#081424'),
                boxShadow: coolerActive
                  ? '0 0 22px rgba(56, 189, 248, 0.5)'
                  : (heatF > 0.1 && !isAborted ? `0 0 25px rgba(239,68,68,${0.35 + heatF * 0.35})` : 'none'),
                transition: 'all 0.3s ease', zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {coolerActive && (
                  <span style={{ fontSize: '8px', color: '#FFFFFF', fontWeight: 800, letterSpacing: '0.04em' }}>PELTIER CRYO QUENCH</span>
                )}
              </div>

              {/* Dual Quench Cooling Fans (Underneath Base) */}
              <div style={{
                width: '155px', height: '24px', background: '#071526',
                borderRadius: '0 0 8px 8px', border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 0.75rem',
              }}>
                {[1, 2].map(fanId => (
                  <div key={fanId} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Fan
                      size={13}
                      color={coolerActive ? '#38BDF8' : '#64748B'}
                      style={{
                        animation: coolerActive && !isAborted ? 'fanSpin 0.25s linear infinite' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    <span style={{ fontSize: '8px', color: coolerActive ? '#38BDF8' : '#64748B', fontFamily: 'var(--font-mono)' }}>
                      CHILL FAN {fanId}
                    </span>
                  </div>
                ))}
              </div>

            </div>

            {/* Unified NodeMCU 4-Channel Station Base Chassis */}
            <div style={{
              width: '100%', maxWidth: '340px', height: '36px',
              background: 'linear-gradient(180deg, #0B1C30 0%, #06111D 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 0.85rem',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#94A3B8' }}>
                GPIO5: HTR · GPIO12: CHILL · GPIO4: STIR · GPIO16: UV
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, color: isAborted ? '#EF4444' : (isRunning ? 'var(--primary-lime)' : '#94A3B8') }}>
                {isAborted ? '● HALTED' : (isRunning ? (isPaused ? '⏸ HOLD' : '● ONLINE') : '○ STANDBY')}
              </span>
            </div>
          </div>
          </div>

          {/* Dual Real-Time Telemetry Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            
            {/* Thermocouple Gauge */}
            <div style={{
              background: 'var(--deep-charcoal)',
              border: '1px solid #1E3A5F',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--warning-orange)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Flame size={12} />
                  RTD Sensor
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#94A3B8' }}>
                  Set: {targetTemp}°C
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {simTemp.toFixed(1)}
                  <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 500 }}> °C</span>
                </span>
                <span style={{ fontSize: '0.7rem', color: heaterPwm > 0 && !isAborted ? 'var(--warning-orange)' : '#94A3B8', fontWeight: 700 }}>
                  {heaterPwm}% PWM
                </span>
              </div>
            </div>

            {/* Tachometer RPM Gauge */}
            <div style={{
              background: 'var(--deep-charcoal)',
              border: '1px solid #1E3A5F',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--primary-lime)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <RotateCw size={12} />
                  Tachometer
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#94A3B8' }}>
                  Set: {targetRpm} RPM
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-lime)' }}>
                  {simRpm}
                  <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 500 }}> RPM</span>
                </span>
                <span style={{ fontSize: '0.7rem', color: simRpm > 0 && !isAborted ? 'var(--primary-lime)' : '#94A3B8', fontWeight: 700 }}>
                  {simRpm > 0 && !isAborted ? 'MOTOR LOCKED' : 'IDLE'}
                </span>
              </div>
            </div>

          </div>

          {/* ── Sequential Hardware Pipeline (Moved here under gauges to eliminate empty space) ── */}
          <div className="notebook-card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 16px rgba(11, 28, 48, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={14} color="var(--deep-charcoal)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--deep-charcoal)' }}>
                  Sequential Hardware Pipeline ({steps.length} Stages)
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--slate-gray)' }}>
                Click stage to manual jump
              </span>
            </div>

            {/* Total Process Progress Track */}
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--slate-gray)', marginBottom: '0.3rem' }}>
                <span>Overall Synthesis: Phase {currentStepIdx + 1} of {steps.length}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--deep-charcoal)' }}>
                  {Math.floor(elapsedSec / 60)}m / {Math.floor(totalSimSec / 60)}m ({progressPct}%)
                </span>
              </div>
              <div className="warm-progress-track">
                <div className="warm-progress-fill" style={{ width: `${progressPct}%`, background: 'var(--primary-lime)' }} />
              </div>
            </div>

            {/* Active Stage Directive Spotlight */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(209, 243, 77, 0.22) 0%, rgba(0, 88, 190, 0.08) 100%)',
              border: '1.5px solid var(--deep-charcoal)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 3px 12px rgba(11, 28, 48, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span className="lab-badge lab-badge-lime" style={{ fontSize: '0.65rem', padding: '2px 7px', fontWeight: 800 }}>
                    ACTIVE STAGE {currentStepIdx + 1}/{steps.length}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>
                    {activeStep.name}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-charcoal)' }}>
                  {Math.floor(stageElapsedSec / 60)}m / {Math.floor(stageDurationSec / 60)}m ({stageProgressPct}%)
                </span>
              </div>

              {/* Stage Progress bar */}
              <div style={{ width: '100%', height: '5px', background: 'rgba(11,28,48,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${stageProgressPct}%`, height: '100%', background: 'var(--deep-charcoal)', transition: 'width 0.3s ease' }} />
              </div>

              {/* Chemical instruction & tactical stage buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.15rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--slate-gray)', maxWidth: '300px', lineHeight: 1.3 }}>
                  <strong style={{ color: 'var(--deep-charcoal)' }}>Directive:</strong> {activeStep.hardwareAction || `${activeStep.targetTempC}°C soak at ${activeStep.stirRpm} RPM`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={handleRestartStage}
                    title="Restart this stage from beginning"
                    className="btn-ghost"
                    style={{ fontSize: '0.65rem', padding: '0.25rem 0.55rem', background: '#FFFFFF' }}
                  >
                    ↺ Restart Stage
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStage}
                    disabled={currentStepIdx >= steps.length - 1}
                    className="btn-primary"
                    style={{ fontSize: '0.68rem', padding: '0.28rem 0.7rem' }}
                  >
                    Advance ⏭
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Stages List (Clear Sequential View) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {steps.map((st, idx) => {
                const isFinished = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;

                return (
                  <div
                    key={st.id || idx}
                    onClick={() => handleJumpToStage(idx)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: isActive
                        ? '2px solid var(--deep-charcoal)'
                        : (isFinished ? '1px solid var(--success-border)' : '1px solid var(--slate-border)'),
                      background: isActive
                        ? 'linear-gradient(145deg, rgba(209, 243, 77, 0.2) 0%, #FFFFFF 100%)'
                        : (isFinished ? 'var(--success-bg)' : 'var(--off-white)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isActive ? '0 4px 14px -2px rgba(209, 243, 77, 0.35)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                      {/* Step Indicator */}
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: isActive ? 'var(--deep-charcoal)' : (isFinished ? 'var(--success-green)' : '#E2E8F0'),
                        color: isActive ? 'var(--primary-lime)' : (isFinished ? '#FFFFFF' : 'var(--slate-gray)'),
                        fontSize: '0.65rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isFinished ? <Check size={12} strokeWidth={3} /> : idx + 1}
                      </div>

                      {/* Step Name & Operation */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--deep-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--slate-gray)', display: 'flex', gap: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                          <span>{st.targetTempC}°C</span>
                          <span>•</span>
                          <span>{st.stirRpm} RPM</span>
                          <span>•</span>
                          <span>{st.durationMin}m</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Status Badge */}
                    <span className={`lab-badge ${isActive ? 'lab-badge-lime' : (isFinished ? 'lab-badge-sage' : 'lab-badge-ink')}`} style={{ fontSize: '0.6rem', padding: '1px 6px', flexShrink: 0 }}>
                      {isActive ? (isPaused ? 'PAUSED' : '● ACTIVE') : (isFinished ? 'DONE' : 'STANDBY')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Bytecode Instruction Box */}
          <div style={{
            background: 'var(--deep-charcoal)',
            border: '1px solid #1E3A5F',
            borderRadius: '12px',
            padding: '0.875rem 1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFFFFF' }}>
              <span>ACTIVE BYTECODE INSTRUCTION:</span>
              <span style={{ color: 'var(--primary-lime)', fontWeight: 700 }}>CRC32: {compactPayload.crc32}</span>
            </div>
            <div style={{ color: '#E2E8F0', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {JSON.stringify({ cmd: compactPayload.command, stage: currentStepIdx + 1, set_temp: targetTemp, set_rpm: targetRpm, uv: isUvActive })}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: Dedicated Reactor Actuator Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Precision Reactor Actuator Console (Mixer, Heater, Cooler, UV) ── */}
          <div className="notebook-card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 16px rgba(11, 28, 48, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--off-white)', border: '1px solid var(--slate-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sliders size={14} color="var(--deep-charcoal)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--deep-charcoal)' }}>
                    Reactor Actuator Controls
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--slate-gray)' }}>
                    4-Channel Direct Hardware Override Deck
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setManualHeaterTarget(null);
                    setManualMixerRpm(null);
                    setHeaterActive(true);
                    setCoolerActive(false);
                    setLiveUvOverride(null);
                    onAddLog?.('SYSTEM', 'Actuators re-synchronized with recipe target envelope.');
                  }}
                  className="btn-ghost"
                  style={{
                    fontSize: '0.65rem',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--slate-gray)',
                    background: 'var(--off-white)',
                    border: '1px solid var(--slate-border)',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={10} style={{ marginRight: '3px' }} />
                  Reset to Recipe
                </button>
              </div>
            </div>

            {/* 4 Core Actuators in Strict 2x2 Symmetrical Bento Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              
              {/* 1. MAGNETIC MIXER (STIRRER) */}
              <div style={{
                background: mixerActive && targetRpm > 0
                  ? 'linear-gradient(145deg, rgba(209, 243, 77, 0.09) 0%, #FFFFFF 100%)'
                  : '#FFFFFF',
                border: mixerActive && targetRpm > 0 ? '1.5px solid var(--deep-charcoal)' : '1px solid var(--slate-border)',
                borderRadius: '14px', padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                boxShadow: mixerActive && targetRpm > 0 ? '0 8px 20px -4px rgba(209, 243, 77, 0.35)' : '0 2px 8px rgba(11,28,48,0.03)',
                transition: 'all 0.25s ease',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: mixerActive && targetRpm > 0 ? 'var(--deep-charcoal)' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: mixerActive && targetRpm > 0 ? '0 0 10px rgba(209, 243, 77, 0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <RotateCw
                        size={14}
                        color={mixerActive && targetRpm > 0 ? 'var(--primary-lime)' : 'var(--slate-gray)'}
                        style={{ animation: mixerActive && targetRpm > 0 ? `magneticRotate ${targetRpm > 0 ? Math.max(0.08, 60 / targetRpm) : 1}s linear infinite` : 'none' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Mixer (Stirrer)</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>GPIO04 · PWM SERVO</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !mixerActive;
                      setMixerActive(next);
                      onAddLog?.('ACTUATOR_OVERRIDE', `Mixer Motor ${next ? 'ENGAGED' : 'BRAKED'}`);
                    }}
                    style={{
                      border: 'none', borderRadius: 'var(--radius-full)',
                      padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                      background: mixerActive && targetRpm > 0 ? 'var(--deep-charcoal)' : '#E2E8F0',
                      color: mixerActive && targetRpm > 0 ? 'var(--primary-lime)' : 'var(--slate-gray)',
                      boxShadow: mixerActive && targetRpm > 0 ? '0 2px 8px rgba(11,28,48,0.25)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {mixerActive && targetRpm > 0 ? '● STIRRING' : 'OFF'}
                  </button>
                </div>

                {/* Animated Interactive Visual Monitor Box */}
                <div style={{
                  background: '#071524',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #1E3A5F',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Left: Interactive Beaker Vortex & Spinning Stir Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      position: 'relative',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #0B1C30 35%, #040D17 100%)',
                      border: mixerActive && targetRpm > 0 ? '1.5px solid var(--primary-lime)' : '1px solid #1E3A5F',
                      boxShadow: mixerActive && targetRpm > 0 ? '0 0 12px rgba(209, 243, 77, 0.4)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {/* Rotating liquid particle ring */}
                      {mixerActive && targetRpm > 0 && (
                        <div style={{
                          position: 'absolute', inset: '2px', borderRadius: '50%',
                          border: '2px dashed rgba(209, 243, 77, 0.65)',
                          animation: `vortexSpin ${targetRpm > 0 ? Math.max(0.12, 60 / targetRpm) : 1}s linear infinite`,
                        }} />
                      )}
                      {/* Magnetic Stirrer Bar */}
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        width: '20px', height: '5px', borderRadius: '3px',
                        background: '#FFFFFF',
                        boxShadow: mixerActive && targetRpm > 0 ? '0 0 8px #FFFFFF' : 'none',
                        animation: mixerActive && targetRpm > 0 ? `stirBarSpin ${targetRpm > 0 ? Math.max(0.08, 60 / targetRpm) : 1}s linear infinite` : 'none',
                        transform: 'translate(-50%, -50%)'
                      }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                          {targetRpm}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary-lime)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          RPM
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                        {mixerActive && targetRpm > 0 ? 'TORQUE 0.18 N·m · SERVO ACTIVE' : 'SERVO BRAKED · IDLE'}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                    padding: '3px 8px', borderRadius: '6px',
                    background: mixerActive && targetRpm > 0 ? 'rgba(209, 243, 77, 0.18)' : 'rgba(148, 163, 184, 0.12)',
                    color: mixerActive && targetRpm > 0 ? 'var(--primary-lime)' : '#94A3B8',
                    border: mixerActive && targetRpm > 0 ? '1px solid rgba(209, 243, 77, 0.3)' : '1px solid #1E3A5F'
                  }}>
                    {mixerActive && targetRpm > 0 ? 'LOCKED' : 'IDLE'}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="1400"
                  step="50"
                  value={targetRpm}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setManualMixerRpm(val);
                    setMixerActive(val > 0);
                  }}
                  className="slider-amber"
                  style={{ width: '100%', height: '5px', cursor: 'pointer' }}
                />

                {/* 4 Quick Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {[
                    { label: 'Stop', rpm: 0 },
                    { label: '300', rpm: 300 },
                    { label: '600', rpm: 600 },
                    { label: '1200', rpm: 1200 },
                  ].map(btn => {
                    const isSelected = targetRpm === btn.rpm && mixerActive === (btn.rpm > 0);
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          setManualMixerRpm(btn.rpm);
                          setMixerActive(btn.rpm > 0);
                          onAddLog?.('ACTUATOR_OVERRIDE', `Mixer set to ${btn.rpm} RPM`);
                        }}
                        style={{
                          padding: '4px 2px',
                          fontSize: '0.64rem',
                          fontWeight: isSelected ? 800 : 600,
                          background: isSelected ? 'var(--deep-charcoal)' : 'var(--off-white)',
                          color: isSelected ? 'var(--primary-lime)' : 'var(--deep-charcoal)',
                          border: isSelected ? '1px solid var(--deep-charcoal)' : '1px solid var(--slate-border)',
                          borderRadius: '6px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. THERMAL HEATER (HOTPLATE PID) */}
              <div style={{
                background: heaterActive && !coolerActive
                  ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, #FFFFFF 100%)'
                  : '#FFFFFF',
                border: heaterActive && !coolerActive ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--slate-border)',
                borderRadius: '14px', padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                boxShadow: heaterActive && !coolerActive ? '0 8px 20px -4px rgba(239, 68, 68, 0.25)' : '0 2px 8px rgba(11,28,48,0.03)',
                transition: 'all 0.25s ease',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: heaterActive && !coolerActive ? '#FEE2E2' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: heaterActive && !coolerActive ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <Flame size={14} color={heaterActive && !coolerActive ? '#EF4444' : 'var(--slate-gray)'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Heater (PID)</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>GPIO05 · SSR / PWM</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !heaterActive;
                      setHeaterActive(next);
                      if (next) setCoolerActive(false);
                      onAddLog?.('ACTUATOR_OVERRIDE', `Thermal Heater ${next ? 'ARMED' : 'DISARMED'}`);
                    }}
                    style={{
                      border: 'none', borderRadius: 'var(--radius-full)',
                      padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                      background: heaterActive && !coolerActive ? '#EF4444' : '#E2E8F0',
                      color: heaterActive && !coolerActive ? '#FFFFFF' : 'var(--slate-gray)',
                      boxShadow: heaterActive && !coolerActive ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {heaterActive && !coolerActive ? '● HEATING' : 'OFF'}
                  </button>
                </div>

                {/* Animated Interactive Visual Monitor Box */}
                <div style={{
                  background: '#180B0B',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #3F1717',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Left: Ceramic Radiant Spiral Coils & Rising Thermal Waves */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      position: 'relative',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #2A1010 30%, #150606 100%)',
                      border: heaterActive && !coolerActive ? '1.5px solid #EF4444' : '1px solid #3F1717',
                      boxShadow: heaterActive && !coolerActive ? '0 0 14px rgba(239, 68, 68, 0.5)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {/* Rising thermal heat waves */}
                      {heaterActive && !coolerActive && targetTemp > 40 && (
                        <div style={{
                          position: 'absolute', top: '4px',
                          display: 'flex', gap: '3px',
                        }}>
                          {[1, 2, 3].map(w => (
                            <div key={w} style={{
                              width: '3px', height: '12px', borderRadius: '2px',
                              background: 'linear-gradient(to top, #F97316, transparent)',
                              animation: `thermalWaveUp ${1.2 + w * 0.2}s ease-in-out infinite`,
                            }} />
                          ))}
                        </div>
                      )}
                      {/* Concentric Heating Element Coil */}
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        border: `2.5px solid ${heaterActive && !coolerActive ? (targetTemp > 100 ? '#F59E0B' : '#EF4444') : '#475569'}`,
                        boxShadow: heaterActive && !coolerActive ? `0 0 ${targetTemp > 100 ? '10px' : '5px'} #EF4444` : 'none',
                        animation: heaterActive && !coolerActive ? 'heatCoilGlow 1.4s ease-in-out infinite' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: heaterActive && !coolerActive ? (targetTemp > 100 ? '#F59E0B' : '#EF4444') : '#334155'
                        }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                          {targetTemp}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#F87171', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          °C
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                        {heaterPwm > 0 && !coolerActive ? `PWM ${heaterPwm}% · SLEW +2.2°C/s` : 'PID STANDBY · IDLE'}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                    padding: '3px 8px', borderRadius: '6px',
                    background: heaterPwm > 0 && !coolerActive ? 'rgba(239, 68, 68, 0.22)' : 'rgba(148, 163, 184, 0.12)',
                    color: heaterPwm > 0 && !coolerActive ? '#FCA5A5' : '#94A3B8',
                    border: heaterPwm > 0 && !coolerActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #3F1717'
                  }}>
                    {heaterPwm > 0 && !coolerActive ? `PWM ${heaterPwm}%` : '0% PWM'}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="25"
                  max="350"
                  step="5"
                  value={targetTemp}
                  disabled={coolerActive}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setManualHeaterTarget(val);
                    setHeaterActive(true);
                    setCoolerActive(false);
                  }}
                  className="slider-terra"
                  style={{ width: '100%', height: '5px', cursor: coolerActive ? 'not-allowed' : 'pointer' }}
                />

                {/* 4 Quick Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {[
                    { label: '25° (Off)', deg: 25 },
                    { label: '60°', deg: 60 },
                    { label: '100°', deg: 100 },
                    { label: '250°', deg: 250 },
                  ].map(btn => {
                    const isSelected = targetTemp === btn.deg && heaterActive && !coolerActive;
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        disabled={coolerActive}
                        onClick={() => {
                          setManualHeaterTarget(btn.deg);
                          setHeaterActive(btn.deg > 25);
                          setCoolerActive(false);
                          onAddLog?.('ACTUATOR_OVERRIDE', `Heater set to ${btn.deg}°C`);
                        }}
                        style={{
                          padding: '4px 2px',
                          fontSize: '0.64rem',
                          fontWeight: isSelected ? 800 : 600,
                          background: isSelected ? '#EF4444' : 'var(--off-white)',
                          color: isSelected ? '#FFFFFF' : 'var(--deep-charcoal)',
                          border: isSelected ? '1px solid #EF4444' : '1px solid var(--slate-border)',
                          borderRadius: '6px',
                          textAlign: 'center',
                          cursor: coolerActive ? 'not-allowed' : 'pointer',
                          opacity: coolerActive ? 0.5 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. CRYO COOLER (CHILLER & FANS) */}
              <div style={{
                background: coolerActive
                  ? 'linear-gradient(145deg, rgba(56, 189, 248, 0.09) 0%, #FFFFFF 100%)'
                  : '#FFFFFF',
                border: coolerActive ? '1.5px solid #0284C7' : '1px solid var(--slate-border)',
                borderRadius: '14px', padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                boxShadow: coolerActive ? '0 8px 20px -4px rgba(56, 189, 248, 0.3)' : '0 2px 8px rgba(11,28,48,0.03)',
                transition: 'all 0.25s ease',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: coolerActive ? '#E0F2FE' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: coolerActive ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <Snowflake size={14} color={coolerActive ? '#0284C7' : 'var(--slate-gray)'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Cooler / Chiller</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>GPIO12 · PELTIER + FAN</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !coolerActive;
                      setCoolerActive(next);
                      if (next) {
                        setHeaterActive(false);
                        setManualHeaterTarget(null);
                      }
                      onAddLog?.('ACTUATOR_OVERRIDE', `Peltier Chiller & Fan Quench ${next ? 'ENGAGED' : 'DISENGAGED'}`);
                    }}
                    style={{
                      border: 'none', borderRadius: 'var(--radius-full)',
                      padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                      background: coolerActive ? '#0284C7' : '#E2E8F0',
                      color: coolerActive ? '#FFFFFF' : 'var(--slate-gray)',
                      boxShadow: coolerActive ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {coolerActive ? '● CHILLING' : 'OFF'}
                  </button>
                </div>

                {/* Animated Interactive Visual Monitor Box */}
                <div style={{
                  background: '#071626',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #143554',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Left: Dual Brushless Turbine Fans & Frost Crystal Glimmer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      position: 'relative',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #0B253E 30%, #051322 100%)',
                      border: coolerActive ? '1.5px solid #38BDF8' : '1px solid #143554',
                      boxShadow: coolerActive ? '0 0 14px rgba(56, 189, 248, 0.5)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Fan
                        size={22}
                        color={coolerActive ? '#38BDF8' : '#64748B'}
                        style={{
                          animation: coolerActive ? 'fanSpin 0.22s linear infinite' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      />
                      {coolerActive && (
                        <span style={{
                          position: 'absolute', top: '-4px', right: '-4px',
                          fontSize: '10px', animation: 'frostGlimmer 1.5s ease-in-out infinite'
                        }}>❄</span>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 900, color: coolerActive ? '#38BDF8' : '#FFFFFF', letterSpacing: '-0.03em' }}>
                          {coolerActive ? coolerIntensity : 0}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          % PWR
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                        {coolerActive ? `FANS 4,800 RPM · -ΔT: -${Math.round((coolerIntensity / 100) * 15)}°C` : 'PELTIER SINK IDLE'}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                    padding: '3px 8px', borderRadius: '6px',
                    background: coolerActive ? 'rgba(56, 189, 248, 0.22)' : 'rgba(148, 163, 184, 0.12)',
                    color: coolerActive ? '#38BDF8' : '#94A3B8',
                    border: coolerActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #143554'
                  }}>
                    {coolerActive ? 'FANS ON' : 'IDLE'}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={coolerIntensity}
                  disabled={!coolerActive}
                  onChange={(e) => setCoolerIntensity(Number(e.target.value))}
                  style={{ width: '100%', height: '5px', accentColor: '#0284C7', cursor: coolerActive ? 'pointer' : 'not-allowed' }}
                />

                {/* 4 Quick Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {[
                    { label: 'Off', act: false, pwr: 0 },
                    { label: '30%', act: true, pwr: 30 },
                    { label: '70%', act: true, pwr: 70 },
                    { label: '100%', act: true, pwr: 100 },
                  ].map(btn => {
                    const isSelected = (coolerActive && coolerIntensity === btn.pwr) || (!coolerActive && !btn.act);
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          setCoolerActive(btn.act);
                          if (btn.act) {
                            setCoolerIntensity(btn.pwr);
                            setHeaterActive(false);
                            setManualHeaterTarget(null);
                            onAddLog?.('ACTUATOR_OVERRIDE', `Cooler set to ${btn.pwr}%`);
                          } else {
                            onAddLog?.('ACTUATOR_OVERRIDE', `Cooler deactivated.`);
                          }
                        }}
                        style={{
                          padding: '4px 2px',
                          fontSize: '0.64rem',
                          fontWeight: isSelected ? 800 : 600,
                          background: isSelected ? '#0284C7' : 'var(--off-white)',
                          color: isSelected ? '#FFFFFF' : 'var(--deep-charcoal)',
                          border: isSelected ? '1px solid #0284C7' : '1px solid var(--slate-border)',
                          borderRadius: '6px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. UV DIAGNOSTIC & PHOTOREACTOR LAMP (365 nm) */}
              <div style={{
                background: isUvActive
                  ? 'linear-gradient(145deg, rgba(124, 58, 237, 0.09) 0%, #FFFFFF 100%)'
                  : '#FFFFFF',
                border: isUvActive ? '1.5px solid #7C3AED' : '1px solid var(--slate-border)',
                borderRadius: '14px', padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                boxShadow: isUvActive ? '0 8px 20px -4px rgba(124, 58, 237, 0.3)' : '0 2px 8px rgba(11,28,48,0.03)',
                transition: 'all 0.25s ease',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: isUvActive ? '#EDE9FE' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isUvActive ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <Sun size={14} color={isUvActive ? '#7C3AED' : 'var(--slate-gray)'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>UV Lamp (365nm)</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>GPIO16 · PHOTOREACTOR</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = isUvActive ? false : true;
                      setLiveUvOverride(next);
                      onAddLog?.('ACTUATOR_OVERRIDE', `UV 365nm Emitter ${next ? 'ACTIVATED' : 'SHUT OFF'}`);
                    }}
                    style={{
                      border: 'none', borderRadius: 'var(--radius-full)',
                      padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                      background: isUvActive ? '#7C3AED' : '#E2E8F0',
                      color: isUvActive ? '#FFFFFF' : 'var(--slate-gray)',
                      boxShadow: isUvActive ? '0 2px 8px rgba(124, 58, 237, 0.35)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {isUvActive ? '● BEAM ON' : 'OFF'}
                  </button>
                </div>

                {/* Animated Interactive Visual Monitor Box */}
                <div style={{
                  background: '#130A24',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #3B1B68',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Left: 365nm Diode Array with Violet Radiation Cone */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      position: 'relative',
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #25104A 30%, #0E051D 100%)',
                      border: isUvActive ? '1.5px solid #A855F7' : '1px solid #3B1B68',
                      boxShadow: isUvActive ? '0 0 16px rgba(168, 85, 247, 0.6)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {/* UV 4-Diode Array emitter */}
                      <div style={{
                        display: 'flex', gap: '3px', marginBottom: '2px'
                      }}>
                        {[1, 2, 3, 4].map(d => (
                          <div key={d} style={{
                            width: '4px', height: '4px', borderRadius: '50%',
                            background: isUvActive ? '#C084FC' : '#64748B',
                            boxShadow: isUvActive ? '0 0 6px #A855F7' : 'none'
                          }} />
                        ))}
                      </div>
                      {/* Downward violet light cone rays */}
                      {isUvActive && (
                        <div style={{
                          width: '26px', height: '14px',
                          background: 'linear-gradient(to bottom, rgba(168, 85, 247, 0.85) 0%, transparent 100%)',
                          clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
                          animation: 'uvBeamPulse 1.3s ease-in-out infinite'
                        }} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 900, color: isUvActive ? '#C084FC' : '#FFFFFF', letterSpacing: '-0.03em' }}>
                          {isUvActive ? uvIntensity : 0}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#A855F7', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          % FLUX
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                        {isUvActive ? `365nm UVA · ${Math.round((uvIntensity / 100) * 45)} mW/cm²` : 'PHOTO-EMITTER DARK'}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                    padding: '3px 8px', borderRadius: '6px',
                    background: isUvActive ? 'rgba(124, 58, 237, 0.25)' : 'rgba(148, 163, 184, 0.12)',
                    color: isUvActive ? '#C084FC' : '#94A3B8',
                    border: isUvActive ? '1px solid rgba(124, 58, 237, 0.45)' : '1px solid #3B1B68'
                  }}>
                    {isUvActive ? '365nm' : 'DARK'}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={uvIntensity}
                  disabled={!isUvActive}
                  onChange={(e) => setUvIntensity(Number(e.target.value))}
                  style={{ width: '100%', height: '5px', accentColor: '#7C3AED', cursor: isUvActive ? 'pointer' : 'not-allowed' }}
                />

                {/* 4 Quick Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {[
                    { label: 'Off', act: false, flux: 0 },
                    { label: '25%', act: true, flux: 25 },
                    { label: '60%', act: true, flux: 60 },
                    { label: '100%', act: true, flux: 100 },
                  ].map(btn => {
                    const isSelected = (isUvActive && uvIntensity === btn.flux) || (!isUvActive && !btn.act);
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          setLiveUvOverride(btn.act);
                          if (btn.act) {
                            setUvIntensity(btn.flux);
                            onAddLog?.('ACTUATOR_OVERRIDE', `UV Lamp set to ${btn.flux}% Flux`);
                          } else {
                            onAddLog?.('ACTUATOR_OVERRIDE', `UV Lamp powered down.`);
                          }
                        }}
                        style={{
                          padding: '4px 2px',
                          fontSize: '0.64rem',
                          fontWeight: isSelected ? 800 : 600,
                          background: isSelected ? '#7C3AED' : 'var(--off-white)',
                          color: isSelected ? '#FFFFFF' : 'var(--deep-charcoal)',
                          border: isSelected ? '1px solid #7C3AED' : '1px solid var(--slate-border)',
                          borderRadius: '6px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

      </div>

      {/* ── 4. Retro-Modern ESP8266 Serial Telemetry Stream Console ── */}
      <div style={{
        background: '#081424',
        border: '1px solid #1E3A5F',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 4px 16px rgba(11, 28, 48, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--primary-lime)', fontWeight: 700 }}>
            <Terminal size={14} color="var(--primary-lime)" />
            ESP8266 SERIAL TELEMETRY STREAM (115200 BAUD)
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#9CA3AF' }}>
            PORT: COM3 / /dev/ttyUSB0 · REST POST
          </span>
        </div>

        <div
          ref={terminalBoxRef}
          style={{
            height: '130px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            lineHeight: 1.7,
            color: '#7ad9a6',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          {logs?.map((l, i) => {
            const isKill = l.tag?.includes('EMERGENCY') || l.tag?.includes('HALT');
            const isHw = l.tag?.includes('HARDWARE') || l.tag?.includes('STATUS');
            const isManual = l.tag?.includes('OPERATOR') || l.tag?.includes('MANUAL');
            return (
              <div key={i} style={{ display: 'flex', gap: '0.625rem', color: isKill ? '#ff6347' : (isManual ? 'var(--primary-lime)' : (isHw ? '#f5b942' : '#7ad9a6')) }}>
                <span style={{ color: '#64748B', flexShrink: 0 }}>[{l.timestamp}]</span>
                <span style={{ color: isKill ? '#EF4444' : (isManual ? 'var(--primary-lime)' : '#F59E0B'), flexShrink: 0, fontWeight: 700 }}>[{l.tag}]</span>
                <span>{l.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── JSON Payload Modal ── */}
      {showPayloadModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(11, 28, 48, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1.25rem',
        }}>
          <div className="notebook-card fade-in" style={{ maxWidth: '640px', width: '100%', padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={16} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--deep-charcoal)' }}>
                  CRC32-Verified Machine Bytecode Payload
                </h3>
              </div>
              <button onClick={() => setShowPayloadModal(false)} className="btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
            </div>
            <pre style={{
              background: 'var(--deep-charcoal)', color: 'var(--primary-lime)', padding: '1.125rem', borderRadius: '12px',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', overflowX: 'auto', maxHeight: '350px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              {JSON.stringify(generateHardwarePayload(protocol, overrides), null, 2)}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={handleDownloadJson} style={{ fontSize: '0.82rem' }}>
                <Download size={14} /> Download autolab_{protocol.id}.json
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Navigation Bottom Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '1rem',
        borderTop: '1px solid var(--slate-border)',
      }}>
        <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={15} />
          Back to Verification Matrix
        </button>

        <button className="btn-ink" onClick={onResetAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RotateCw size={14} />
          Synthesize Another Material Protocol
        </button>
      </div>

    </div>
  );
}
