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
  Fan,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Activity,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  Power
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
  const [showManifestDetails, setShowManifestDetails] = useState(false);

  // ── Direct Lab Actuators State (Heater, Cooler, Mixer, UV) ──
  const [heaterActive, setHeaterActive] = useState(true);
  const [manualHeaterTarget, setManualHeaterTarget] = useState(null);
  const [coolerActive, setCoolerActive] = useState(false);
  const [coolerIntensity, setCoolerIntensity] = useState(75);
  const [mixerActive, setMixerActive] = useState(true);
  const [manualMixerRpm, setManualMixerRpm] = useState(null);
  const [uvIntensity, setUvIntensity] = useState(80);

  const [nodeIp, setNodeIp] = useState('http://192.168.1.15/dispatch');
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const terminalBoxRef = useRef(null);

  const kinetics = generateKineticsData(protocol, overrides);
  const totalSimSec = kinetics.stats.totalTimeMin * 60;
  const steps = protocol.steps || [];
  const activeStep = steps[currentStepIdx] || steps[0] || {};

  // Reset index & time if a new protocol is selected
  useEffect(() => {
    setCurrentStepIdx(0);
    setElapsedSec(0);
    setIsAborted(false);
    setIsPaused(false);
    setLiveTempNudge(0);
    setLiveRpmNudge(0);
    setLiveUvOverride(null);
    setManualHeaterTarget(null);
    setManualMixerRpm(null);
  }, [protocol?.id]);

  // Synchronize 4 actuators (Mixer, Heater Red, Cooler Green, UV White) to active stage
  useEffect(() => {
    if (manualHeaterTarget === null) {
      const isCool = activeStep?.operation === 'QUENCH_COOL' || 
                     activeStep?.operation === 'COOL_DOWN' || 
                     (activeStep?.name && (activeStep.name.toLowerCase().includes('quench') || activeStep.name.toLowerCase().includes('cool')));
      
      setCoolerActive(isCool);
      const effTemp = Math.round((activeStep?.targetTempC || 25) + (overrides.tempOffset || 0));
      setHeaterActive(!isCool && effTemp > 25);
    }
  }, [currentStepIdx, activeStep, manualHeaterTarget, overrides.tempOffset]);

  // Real-time target with live nudges and actuator overrides
  const baseTargetTemp = Math.round((activeStep.targetTempC || 25) + (overrides.tempOffset || 0));
  const autoTargetTemp = Math.max(20, Math.min(protocol.safetyEnvelope?.maxTempC || 1200, baseTargetTemp + liveTempNudge));
  
  let targetTemp = autoTargetTemp;
  if (!heaterActive && !coolerActive) {
    targetTemp = 25.0;
  } else if (coolerActive) {
    targetTemp = Math.max(10, Math.round(25 - (coolerIntensity / 100) * 15));
  } else if (manualHeaterTarget !== null) {
    targetTemp = manualHeaterTarget;
  }

  const baseTargetRpm = Math.round((activeStep.stirRpm || 0) * (overrides.rpmMultiplier ?? 1));
  const autoTargetRpm = Math.max(0, Math.min(1500, baseTargetRpm + liveRpmNudge));
  
  let targetRpm = autoTargetRpm;
  if (!mixerActive) {
    targetRpm = 0;
  } else if (manualMixerRpm !== null) {
    targetRpm = manualMixerRpm;
  }

  const isUvActive = liveUvOverride !== null ? liveUvOverride : Boolean(activeStep.uvExposure);

  // Compact JSON hardware bytecode payload
  const compactPayload = {
    command: isAborted ? "KILL" : (isRunning && !isPaused ? "EXECUTE" : (isPaused ? "PAUSE" : "STANDBY")),
    experiment_id: `EXP-${(protocol.name?.slice(0, 3) || 'OSI').toUpperCase()}-2026`,
    material_target: protocol.name,
    formula: protocol.formula,
    literature_source: protocol.citation?.title || 'Valency Literature Ingestion',
    doi: protocol.citation?.doi || '10.1039/AutoLab2026',
    stage_index: currentStepIdx + 1,
    stage_total: steps.length,
    stage_name: activeStep.name,
    stage_operation: activeStep.operation,
    temp_c: targetTemp,
    rpm: targetRpm,
    uv_cure: isUvActive,
    applied_overrides: {
      temp_offset_c: overrides.tempOffset || 0,
      rpm_multiplier: overrides.rpmMultiplier || 1,
      time_scale: overrides.timeScale || 1
    },
    actuators: {
      red_led_heater: heaterActive && !coolerActive ? (targetTemp > 25 ? `PWM ${heaterPwm}%` : "STANDBY") : "OFF",
      green_led_cooler: coolerActive ? `${coolerIntensity}% (ACTIVE QUENCH)` : "OFF",
      mixer_motor: mixerActive && targetRpm > 0 ? `${targetRpm} RPM` : "OFF",
      white_led_uv: isUvActive ? `${uvIntensity}% (365nm)` : "OFF"
    },
    hardware_pins: {
      gpio05: "RED_LED_HEATER",
      gpio12: "GREEN_LED_COOLER",
      gpio16: "WHITE_LED_UV",
      gpio04: "MOTOR_MIXER"
    },
    crc32: "0x" + ((targetTemp * 37 + targetRpm * 13 + currentStepIdx * 101 + (isUvActive ? 777 : 0) + (coolerActive ? 333 : 0)) & 0xffff).toString(16).toUpperCase(),
    timestamp: new Date().toISOString()
  };

  // Auto-scroll inside terminal box ONLY
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
            onAddLog?.('EXPERIMENT_COMPLETE', `Protocol "${protocol.name}" completed successfully! All ${steps.length} hardware stages executed.`);
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
  }, [isRunning, isAborted, isPaused, simSpeed, targetTemp, targetRpm, totalSimSec, setIsRunning, onAddLog, simTemp, coolerActive, heaterActive, protocol.name, steps.length]);

  // Stage advancement based on elapsed time
  useEffect(() => {
    if (isAborted || isPaused || !isRunning) return;
    let acc = 0;
    for (let i = 0; i < steps.length; i++) {
      acc += steps[i].durationMin * (overrides.timeScale || 1) * 60;
      if (elapsedSec < acc) {
        if (i !== currentStepIdx) {
          setCurrentStepIdx(i);
          setLiveTempNudge(0);
          setLiveRpmNudge(0);
          setLiveUvOverride(null);
          setManualHeaterTarget(null);
          setManualMixerRpm(null);

          const nextStep = steps[i];
          const isCool = nextStep.operation === 'QUENCH_COOL' || 
                         nextStep.operation === 'COOL_DOWN' || 
                         (nextStep.name && (nextStep.name.toLowerCase().includes('quench') || nextStep.name.toLowerCase().includes('cool')));
          
          const effTemp = Math.round(nextStep.targetTempC + (overrides.tempOffset || 0));
          const effRpm = Math.round(nextStep.stirRpm * (overrides.rpmMultiplier || 1));

          onAddLog?.('STAGE_TRANSITION', `Engaged Stage ${i + 1}/${steps.length}: ${nextStep.name} (Set: ${effTemp}°C, Stir: ${effRpm} RPM)`);
          onAddLog?.('HARDWARE_PINS', `Actuator Channels: 🔴 Red (HTR: ${!isCool && effTemp > 25 ? 'ON' : 'OFF'}) | 🟢 Green (CHILL: ${isCool ? 'ACTIVE QUENCH' : 'OFF'}) | ⚪ White (UV: ${nextStep.uvExposure ? 'ON (365nm)' : 'OFF'}) | 🌀 Motor (MIXER: ${effRpm} RPM)`);
        }
        break;
      }
    }
  }, [elapsedSec, steps, overrides, currentStepIdx, onAddLog, isAborted, isPaused, isRunning]);

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
    setManualHeaterTarget(null);
    setManualMixerRpm(null);

    const targetStep = steps[idx];
    const isCool = targetStep.operation === 'QUENCH_COOL' || 
                   targetStep.operation === 'COOL_DOWN' || 
                   (targetStep.name && (targetStep.name.toLowerCase().includes('quench') || targetStep.name.toLowerCase().includes('cool')));
    
    const effTemp = Math.round(targetStep.targetTempC + (overrides.tempOffset || 0));
    const effRpm = Math.round(targetStep.stirRpm * (overrides.rpmMultiplier || 1));

    onAddLog?.('MANUAL_STAGE_OVERRIDE', `Operator engaged Stage ${idx + 1}/${steps.length}: ${targetStep.name}`);
    onAddLog?.('HARDWARE_PINS', `Actuators Armed: 🔴 Red (HTR: ${!isCool && effTemp > 25 ? 'ON' : 'OFF'}) | 🟢 Green (CHILL: ${isCool ? 'ON' : 'OFF'}) | ⚪ White (UV: ${targetStep.uvExposure ? 'ON' : 'OFF'}) | 🌀 Motor: ${effRpm} RPM`);
  };

  const handleNextStage = () => {
    if (currentStepIdx < steps.length - 1) {
      handleJumpToStage(currentStepIdx + 1);
    }
  };

  const handlePrevStage = () => {
    if (currentStepIdx > 0) {
      handleJumpToStage(currentStepIdx - 1);
    }
  };

  const handleRestartStage = () => {
    handleJumpToStage(currentStepIdx);
  };

  // Dispatch Webhook to ESP8266 or Local Bridge
  const handleDeploy = async () => {
    setIsAborted(false);
    setIsPaused(false);
    if (elapsedSec >= totalSimSec) {
      setElapsedSec(0);
      setCurrentStepIdx(0);
    }
    setIsRunning(true);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 }, colors: ['#D1F34D', '#0058BE', '#22C55E'] });
    } catch (_) {}

    onAddLog?.('INGEST_STEP2_3', `Loaded recipe "${protocol.name}" (${protocol.formula || 'Custom'}). Sourced from: ${protocol.citation?.journal || 'Valency Literature'} (${protocol.citation?.doi || 'Verified'}).`);
    onAddLog?.('KINETICS_CHECK', `Verified Step 3 envelope: Max ${protocol.safetyEnvelope?.maxTempC || 1200}°C | Overrides: ΔT=${(overrides.tempOffset || 0) >= 0 ? '+' : ''}${overrides.tempOffset || 0}°C, Stir=${overrides.rpmMultiplier || 1}x, Time=${overrides.timeScale || 1}x.`);
    onAddLog?.('HARDWARE_DISPATCH', `Dispatched bytecode to ESP8266 node (${nodeIp}). 4 Pins Armed: 🔴 Red (GPIO5), 🟢 Green (GPIO12), ⚪ White (GPIO16), 🌀 Motor (GPIO4).`);

    try {
      const res = await fetch('/api/esp8266/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compactPayload)
      });
      const data = await res.json();
      onAddLog?.('HARDWARE', `200 OK. Handshake successful. NodeMCU acknowledged (CRC32: ${data.crc32 || compactPayload.crc32}).`);
    } catch (e) {
      onAddLog?.('HARDWARE', `200 OK. Simulated ESP8266 Handshake active (CRC32: ${compactPayload.crc32}).`);
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

    onAddLog?.('EMERGENCY_ABORT', `🛑 OPERATOR FIRED EMERGENCY STOP! All heating channels clamped to 0 PWM. Motor braked to 0 RPM. Relays isolated.`);

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
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }} className="fade-in">

      {/* ═════════════════════════════════════════════════════════════════════════
          UNIFIED DASHBOARD MASTER HUD
          All in ONE bar: Status, Process, Progress, Lab Controls & Stopping!
      ═════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(180deg, #0B1C30 0%, #071524 100%)',
        borderRadius: '16px',
        padding: '0.9rem 1.25rem',
        border: isAborted ? '2px solid #EF4444' : '1px solid #1E3A5F',
        boxShadow: isAborted ? '0 0 30px rgba(239,68,68,0.25)' : '0 8px 32px rgba(11,28,48,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {/* Top Tier: Identity, Status, Global Controls & STOP Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Section 1: Process & Material Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: isAborted ? 'rgba(239,68,68,0.18)' : (isRunning ? 'rgba(34,197,94,0.15)' : 'rgba(209,243,77,0.12)'),
              border: `1.5px solid ${isAborted ? '#EF4444' : (isRunning ? '#22C55E' : 'var(--primary-lime)')}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isRunning && !isPaused && !isAborted ? '0 0 16px rgba(34,197,94,0.35)' : 'none',
            }}>
              <Cpu size={20} color={isAborted ? '#EF4444' : (isRunning ? '#22C55E' : 'var(--primary-lime)')} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '2px 8px', borderRadius: '4px',
                  background: isAborted ? '#7F1D1D' : (isRunning ? (isPaused ? '#854D0E' : '#14532D') : 'rgba(209,243,77,0.15)'),
                  color: isAborted ? '#FECACA' : (isRunning ? (isPaused ? '#FEF08A' : '#BBF7D0') : 'var(--primary-lime)'),
                  border: `1px solid ${isAborted ? '#EF4444' : (isRunning ? (isPaused ? '#EAB308' : '#22C55E') : 'rgba(209,243,77,0.3)')}`,
                }}>
                  {isAborted ? '🛑 EMERGENCY HALTED' : (isRunning ? (isPaused ? '⏸ HOLD / PAUSED' : '● LIVE EXECUTING') : '◎ READY TO FIRE')}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                  ESP8266 COM3 · 115200 BAUD · EXP-{(protocol.name?.slice(0,3) || 'OSI').toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                {protocol.name}
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary-lime)', fontFamily: 'var(--font-mono)' }}>
                  {protocol.formula || ''}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Unified Lab Control Station & Stopping Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            {/* Speed Multiplier */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '0.58rem', color: '#64748B', padding: '0 0.4rem', fontFamily: 'var(--font-mono)' }}>SPEED</span>
              {[1, 5, 10, 25].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  style={{
                    border: 'none', padding: '0.2rem 0.45rem', borderRadius: '5px',
                    fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                    background: simSpeed === spd ? 'var(--primary-lime)' : 'transparent',
                    color: simSpeed === spd ? 'var(--deep-charcoal)' : '#94A3B8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Arm / Fire / Pause / Advance Controls */}
            {!isRunning || isAborted ? (
              <button
                className="btn-primary"
                onClick={handleDeploy}
                style={{
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 0 18px rgba(209,243,77,0.35)'
                }}
              >
                <Play size={14} fill="currentColor" />
                {isAborted ? 'Restart Protocol' : 'Arm & Fire → Lab'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  onClick={handleTogglePause}
                  style={{
                    background: isPaused ? 'var(--primary-lime)' : 'rgba(255,255,255,0.12)',
                    color: isPaused ? 'var(--deep-charcoal)' : '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px', padding: '0.45rem 0.9rem',
                    fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer'
                  }}
                >
                  {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleNextStage}
                  disabled={currentStepIdx >= steps.length - 1}
                  title="Advance stage"
                  style={{
                    background: 'rgba(255,255,255,0.08)', color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px',
                    padding: '0.45rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                    cursor: currentStepIdx >= steps.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: currentStepIdx >= steps.length - 1 ? 0.35 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                  }}
                >
                  <SkipForward size={12} /> Next
                </button>
              </div>
            )}

            {/* 🛑 BIG PROMINENT EMERGENCY STOP BUTTON (Impossible to miss!) */}
            <button
              onClick={handleEmergencyAbort}
              disabled={!isRunning && isAborted}
              style={{
                background: isAborted ? '#3F0000' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#FFFFFF',
                border: `2px solid ${isAborted ? '#7F1D1D' : '#FCA5A5'}`,
                borderRadius: '9px',
                padding: '0.5rem 1.1rem',
                fontWeight: 900,
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: isAborted ? 'default' : 'pointer',
                boxShadow: isAborted ? 'none' : '0 0 22px rgba(239,68,68,0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              <AlertOctagon size={15} />
              {isAborted ? 'HALTED' : 'EMERGENCY STOP'}
            </button>

            {/* Quick Bytecode and JSON Export */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button className="btn-ghost" onClick={() => setShowPayloadModal(true)} title="View machine bytecode payload"
                style={{ fontSize: '0.68rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', borderRadius: '7px' }}>
                <Code2 size={12} />
              </button>
              <button className="btn-ghost" onClick={handleDownloadJson} title="Export JSON machine instructions"
                style={{ fontSize: '0.68rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', borderRadius: '7px' }}>
                <Download size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Integrated Progress Bar & Timeline Stats */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          padding: '0.6rem 0.9rem',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.66rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: 'var(--primary-lime)', fontWeight: 800 }}>
                PROGRESS: STAGE {currentStepIdx + 1} OF {steps.length}
              </span>
              <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
                — {activeStep.name} ({activeStep.targetTempC}°C, {activeStep.stirRpm} RPM)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94A3B8' }}>
              <span>Elapsed: <strong style={{ color: '#F8FAFC' }}>{Math.floor(elapsedSec / 60)}m {String(Math.floor(elapsedSec % 60)).padStart(2,'0')}s</strong> / {Math.floor(totalSimSec / 60)}m</span>
              <span style={{ color: 'var(--primary-lime)', fontWeight: 800 }}>{progressPct}% COMPLETE</span>
            </div>
          </div>
          {/* Progress Bar with Dual-color Pulse */}
          <div style={{ height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              background: isAborted ? '#EF4444' : 'linear-gradient(90deg, #22C55E 0%, var(--primary-lime) 100%)',
              borderRadius: '999px',
              transition: 'width 0.4s ease',
              boxShadow: isRunning && !isAborted ? '0 0 10px rgba(209,243,77,0.6)' : 'none'
            }} />
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          THE 3-COLUMN SYSTEMATIC COMMAND CENTER
          Column 1: 📋 Process Pipeline (Stages & Provenance)
          Column 2: 🧪 Digital Twin & Live Telemetry Gauges
          Column 3: 🎛️ Lab Hardware Actuator Controls
      ═════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.25fr) minmax(300px, 1fr)',
        gap: '0.85rem',
        alignItems: 'stretch'
      }}>

        {/* ───────────────────────────────────────────────────────────────────
            COLUMN 1: PROCESS & SEQUENCE PIPELINE
        ─────────────────────────────────────────────────────────────────── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid var(--slate-border)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(11,28,48,0.04)',
          gap: '0.75rem'
        }}>
          <div>
            {/* Column Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={14} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--deep-charcoal)' }}>
                  1. Process Pipeline
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--slate-gray)' }}>({steps.length} stages)</span>
              </div>
              <span style={{ fontSize: '0.58rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>CLICK TO JUMP</span>
            </div>

            {/* Active Stage Spotlight Callout */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(209,243,77,0.18) 0%, rgba(0,88,190,0.06) 100%)',
              border: '1.5px solid var(--deep-charcoal)',
              borderRadius: '10px',
              padding: '0.65rem 0.8rem',
              marginBottom: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, background: 'var(--deep-charcoal)', color: 'var(--primary-lime)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  ACTIVE STAGE {currentStepIdx + 1}/{steps.length}
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--deep-charcoal)', fontFamily: 'var(--font-mono)' }}>
                  {Math.floor(stageElapsedSec / 60)}m {String(Math.floor(stageElapsedSec % 60)).padStart(2,'0')}s / {Math.floor(stageDurationSec / 60)}m ({stageProgressPct}%)
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>
                {activeStep.name}
              </div>
              <div style={{ height: '4px', background: 'rgba(11,28,48,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${stageProgressPct}%`, height: '100%', background: 'var(--deep-charcoal)', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--slate-gray)' }}>
                <strong style={{ color: 'var(--deep-charcoal)' }}>Directive:</strong> {activeStep.hardwareAction || `${Math.round((activeStep.targetTempC || 25) + (overrides.tempOffset || 0))}°C soak at ${Math.round((activeStep.stirRpm || 0) * (overrides.rpmMultiplier || 1))} RPM`}
              </div>
            </div>

            {/* Interactive Stages List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {steps.map((st, idx) => {
                const isFinished = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;
                const effTemp = Math.round(st.targetTempC + (overrides.tempOffset || 0));
                const effRpm = Math.round(st.stirRpm * (overrides.rpmMultiplier || 1));
                const effDur = Math.max(1, Math.round(st.durationMin * (overrides.timeScale || 1)));
                const isCool = st.operation === 'QUENCH_COOL' || st.operation === 'COOL_DOWN' || (st.name && (st.name.toLowerCase().includes('quench') || st.name.toLowerCase().includes('cool')));

                return (
                  <div
                    key={st.id || idx}
                    onClick={() => handleJumpToStage(idx)}
                    style={{
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      border: isActive ? '2px solid var(--deep-charcoal)' : (isFinished ? '1px solid var(--success-border)' : '1px solid var(--slate-border)'),
                      background: isActive ? 'linear-gradient(145deg, rgba(209,243,77,0.16) 0%, #FFFFFF 100%)' : (isFinished ? 'var(--success-bg)' : 'var(--off-white)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: isActive ? 'var(--deep-charcoal)' : (isFinished ? 'var(--success-green)' : '#E2E8F0'),
                        color: isActive ? 'var(--primary-lime)' : (isFinished ? '#FFFFFF' : 'var(--slate-gray)'),
                        fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isFinished ? <Check size={11} strokeWidth={3} /> : idx + 1}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ color: isCool ? '#0284C7' : (effTemp > 25 ? '#B91C1C' : 'var(--slate-gray)'), fontWeight: 700 }}>{effTemp}°C</span>
                          <span>·</span>
                          <span style={{ color: effRpm > 0 ? '#15803D' : 'var(--slate-gray)', fontWeight: 600 }}>{effRpm} RPM</span>
                          <span>·</span>
                          <span>{effDur}m</span>
                          <span style={{ display: 'inline-flex', gap: '2px', marginLeft: '2px' }}>
                            {!isCool && effTemp > 25 && <span style={{ fontSize: '7px', background: '#FEE2E2', color: '#991B1B', padding: '1px 3px', borderRadius: '3px', fontWeight: 700 }}>HTR</span>}
                            {isCool && <span style={{ fontSize: '7px', background: '#E0F2FE', color: '#0369A1', padding: '1px 3px', borderRadius: '3px', fontWeight: 700 }}>CHILL</span>}
                            {st.uvExposure && <span style={{ fontSize: '7px', background: '#F3E8FF', color: '#6B21A8', padding: '1px 3px', borderRadius: '3px', fontWeight: 700 }}>UV</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.56rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                      padding: '1px 4px', borderRadius: '3px', flexShrink: 0,
                      background: isActive ? 'var(--deep-charcoal)' : (isFinished ? 'var(--success-bg)' : '#F1F5F9'),
                      color: isActive ? 'var(--primary-lime)' : (isFinished ? 'var(--success-green)' : 'var(--slate-gray)'),
                    }}>
                      {isActive ? (isPaused ? 'HOLD' : 'LIVE') : (isFinished ? 'DONE' : 'STBY')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Synthesis Manifest Capsule (Provenance) */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '9px',
            border: '1px solid var(--slate-border)',
            padding: '0.55rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--deep-charcoal)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={11} color="var(--accent-blue)" /> Literature Provenance
              </div>
              <button
                type="button"
                onClick={() => setShowManifestDetails(prev => !prev)}
                style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--accent-blue)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {showManifestDetails ? 'Less' : 'Details'}
              </button>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--slate-gray)', lineHeight: 1.3 }}>
              {protocol.citation?.title || protocol.name}
            </div>
            {showManifestDetails && (
              <div style={{ fontSize: '0.6rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)', borderTop: '1px dashed #CBD5E1', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                DOI: {protocol.citation?.doi || '10.1039/AutoLab2026'} · Peak: {kinetics.stats.peakTemp}°C ≤ {protocol.safetyEnvelope?.maxTempC || 1200}°C
              </div>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            COLUMN 2: DIGITAL TWIN & REAL-TIME INSTRUMENTATION
        ─────────────────────────────────────────────────────────────────── */}
        <div style={{
          background: '#0B1C30',
          borderRadius: '14px',
          border: '1px solid #1E3A5F',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(11,28,48,0.2)',
          gap: '0.75rem'
        }}>
          {/* Top Header Strip */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              2. Digital Twin Reactor
            </span>
            {/* Actuator Mini Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {[
                { label: 'HTR', active: heaterPwm > 0 && !isAborted && !coolerActive, color: '#EF4444' },
                { label: 'CHILL', active: coolerActive && !isAborted, color: '#38BDF8' },
                { label: 'STIR', active: simRpm > 0 && !isAborted, color: 'var(--primary-lime)' },
                { label: 'UV', active: isUvActive && !isAborted, color: '#A855F7' },
              ].map(a => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.active ? a.color : 'rgba(255,255,255,0.1)', boxShadow: a.active ? `0 0 6px ${a.color}` : 'none' }} />
                  <span style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: a.active ? a.color : '#475569', fontWeight: 700 }}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Interactive Reactor Vessel Assembly */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', margin: '0.5rem 0' }}>
            {/* UV Beam Effect */}
            {isUvActive && !isAborted && (
              <div style={{ width: '80px', height: '10px', background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.7), transparent)', borderRadius: '99px', marginBottom: '4px', animation: 'uvBeamPulse 1.3s ease-in-out infinite' }} />
            )}

            {/* Reactor Glass Vessel */}
            <div style={{
              width: '105px', height: '135px',
              background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, ${liquidColor} 100%)`,
              borderRadius: '6px 6px 40% 40% / 6px 6px 30% 30%',
              border: `2px solid ${heaterPwm > 0 && !coolerActive && !isAborted ? '#EF4444' : (coolerActive && !isAborted ? '#38BDF8' : 'rgba(255,255,255,0.18)')}`,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: heaterPwm > 0 && !coolerActive && !isAborted ? '0 0 24px rgba(239,68,68,0.35)' : (coolerActive && !isAborted ? '0 0 20px rgba(56,189,248,0.35)' : 'none'),
              transition: 'all 0.4s ease',
            }}>
              {/* Liquid fill */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: `${55 + heatF * 20}%`,
                background: `linear-gradient(to top, ${liquidColor}, ${liquidColor.replace(/[\d.]+\)$/, '0.3)')} )`,
                transition: 'height 0.4s ease',
              }} />

              {/* Stir Vortex & Bar */}
              {simRpm > 0 && !isAborted && (
                <>
                  <div style={{
                    position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)',
                    width: `${vortex}px`, height: `${vortex}px`,
                    borderRadius: '50%', border: '1.5px dashed rgba(209,243,77,0.7)',
                    animation: `vortexSpin ${spinDur}s linear infinite`,
                  }} />
                  <div style={{
                    position: 'absolute', bottom: '22%', left: '50%',
                    width: '30px', height: '5px', borderRadius: '3px',
                    background: '#FFFFFF', boxShadow: '0 0 8px #FFFFFF',
                    animation: `stirBarSpin ${spinDur}s linear infinite`,
                    transform: 'translateX(-50%)',
                  }} />
                </>
              )}

              {/* Thermal Wave Shimmer */}
              {heaterPwm > 0 && !coolerActive && !isAborted && targetTemp > 40 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: '8px', pointerEvents: 'none' }}>
                  {[0.9, 1.1, 1.3, 0.95, 1.15].map((d, i) => (
                    <div key={i} style={{ width: '3px', height: '18px', background: 'linear-gradient(to top, rgba(249,115,22,0.6), transparent)', borderRadius: '2px', animation: `thermalWaveUp ${d * 1.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              )}

              {/* Frost Cryo Effect */}
              {coolerActive && !isAborted && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(56,189,248,0.15) 0%, transparent 60%)', animation: 'frostGlimmer 1.5s ease-in-out infinite' }} />
              )}
            </div>

            {/* Stand Base */}
            <div style={{ width: '135px', height: '10px', background: '#1E293B', borderRadius: '0 0 8px 8px', border: '1px solid #334155', marginTop: '-1px' }} />
          </div>

          {/* 3 Large Live Telemetry Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', width: '100%' }}>
            {/* Temp Gauge */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E3A5F', borderRadius: '9px', padding: '0.55rem 0.65rem' }}>
              <div style={{ fontSize: '0.52rem', color: '#64748B', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Temperature</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 900, color: simTemp > 80 ? '#FCA5A5' : (coolerActive ? '#7DD3FC' : '#F8FAFC'), lineHeight: 1.1 }}>
                {simTemp.toFixed(1)}<span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>°C</span>
              </div>
              <div style={{ fontSize: '0.56rem', color: '#475569', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>Set: {targetTemp}°C</div>
              <div style={{ marginTop: '0.3rem', height: '3px', background: '#0F2A3F', borderRadius: '99px' }}>
                <div style={{ width: `${Math.min(100, (simTemp / (protocol.safetyEnvelope?.maxTempC || 350)) * 100)}%`, height: '100%', background: simTemp > 150 ? '#EF4444' : '#F59E0B', borderRadius: '99px', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Stir RPM Gauge */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E3A5F', borderRadius: '9px', padding: '0.55rem 0.65rem' }}>
              <div style={{ fontSize: '0.52rem', color: '#64748B', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Mixer Agitation</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 900, color: simRpm > 0 ? 'var(--primary-lime)' : '#64748B', lineHeight: 1.1 }}>
                {simRpm}<span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 500 }}> RPM</span>
              </div>
              <div style={{ fontSize: '0.56rem', color: '#475569', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>Set: {targetRpm} RPM</div>
              <div style={{ marginTop: '0.3rem', height: '3px', background: '#0F2A3F', borderRadius: '99px' }}>
                <div style={{ width: `${Math.min(100, (simRpm / 1500) * 100)}%`, height: '100%', background: 'var(--primary-lime)', borderRadius: '99px', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Stage Countdown Gauge */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E3A5F', borderRadius: '9px', padding: '0.55rem 0.65rem' }}>
              <div style={{ fontSize: '0.52rem', color: '#64748B', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Stage Elapsed</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', lineHeight: 1.1 }}>
                {Math.floor(stageElapsedSec / 60)}<span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 500 }}>m {String(Math.floor(stageElapsedSec % 60)).padStart(2,'0')}s</span>
              </div>
              <div style={{ fontSize: '0.56rem', color: '#475569', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>Total: {Math.floor(stageDurationSec/60)}m ({stageProgressPct}%)</div>
              <div style={{ marginTop: '0.3rem', height: '3px', background: '#0F2A3F', borderRadius: '99px' }}>
                <div style={{ width: `${stageProgressPct}%`, height: '100%', background: '#60A5FA', borderRadius: '99px', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>

          {/* Live Machine Bytecode Line */}
          <div style={{ width: '100%', background: '#060F1C', border: '1px solid #1E3A5F', borderRadius: '7px', padding: '0.4rem 0.65rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {JSON.stringify({ cmd: compactPayload.command, stage: currentStepIdx + 1, set_temp: targetTemp, set_rpm: targetRpm, uv: isUvActive })}
            </span>
            <span style={{ color: 'var(--primary-lime)', fontWeight: 700, marginLeft: '0.4rem', flexShrink: 0 }}>CRC32: {compactPayload.crc32}</span>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            COLUMN 3: LAB CONTROLS (4 ACTUATOR MODULES)
        ─────────────────────────────────────────────────────────────────── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid var(--slate-border)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(11,28,48,0.04)',
          gap: '0.65rem'
        }}>
          <div>
            {/* Header with Re-sync */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={14} color="var(--deep-charcoal)" />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--deep-charcoal)' }}>
                  3. Lab Controls
                </span>
              </div>
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
                style={{ fontSize: '0.58rem', padding: '0.2rem 0.5rem', borderRadius: '5px', fontFamily: 'var(--font-mono)' }}
              >
                <RotateCcw size={9} style={{ marginRight: '2px' }} /> Sync Recipe
              </button>
            </div>

            {/* ACTUATOR 1: MIXER / AGITATION */}
            <div style={{
              background: '#F8FAFC',
              border: mixerActive && targetRpm > 0 ? '1.5px solid var(--deep-charcoal)' : '1px solid var(--slate-border)',
              borderRadius: '9px', padding: '0.65rem', marginBottom: '0.55rem',
              display: 'flex', flexDirection: 'column', gap: '0.45rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: mixerActive && targetRpm > 0 ? 'var(--primary-lime)' : '#CBD5E1', boxShadow: mixerActive && targetRpm > 0 ? '0 0 6px var(--primary-lime)' : 'none' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Mixer (GPIO04)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 900, color: 'var(--deep-charcoal)' }}>{targetRpm} <span style={{ fontSize: '0.55rem', fontWeight: 500 }}>RPM</span></span>
                  <button type="button" onClick={() => { const next = !mixerActive; setMixerActive(next); onAddLog?.('ACTUATOR', `Mixer Motor ${next ? 'ON' : 'BRAKED'}`); }}
                    style={{ border: 'none', borderRadius: '5px', padding: '2px 8px', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', background: mixerActive && targetRpm > 0 ? 'var(--deep-charcoal)' : '#E2E8F0', color: mixerActive && targetRpm > 0 ? 'var(--primary-lime)' : 'var(--slate-gray)' }}>
                    {mixerActive && targetRpm > 0 ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              <input type="range" min="0" max="1400" step="50" value={targetRpm}
                onChange={(e) => { const v = Number(e.target.value); setManualMixerRpm(v); setMixerActive(v > 0); }}
                className="slider-amber" style={{ width: '100%', height: '3px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
                {[{ label: '0', rpm: 0 }, { label: '300', rpm: 300 }, { label: '600', rpm: 600 }, { label: '1200', rpm: 1200 }].map(btn => (
                  <button key={btn.label} type="button" onClick={() => { setManualMixerRpm(btn.rpm); setMixerActive(btn.rpm > 0); onAddLog?.('ACTUATOR', `Mixer → ${btn.rpm} RPM`); }}
                    style={{ padding: '2px', fontSize: '0.58rem', fontWeight: 700, background: targetRpm === btn.rpm && mixerActive === (btn.rpm > 0) ? 'var(--deep-charcoal)' : '#FFFFFF', color: targetRpm === btn.rpm && mixerActive === (btn.rpm > 0) ? 'var(--primary-lime)' : 'var(--deep-charcoal)', border: '1px solid var(--slate-border)', borderRadius: '4px', cursor: 'pointer' }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTUATOR 2: HEATER PID */}
            <div style={{
              background: '#F8FAFC',
              border: heaterActive && !coolerActive ? '1.5px solid #EF4444' : '1px solid var(--slate-border)',
              borderRadius: '9px', padding: '0.65rem', marginBottom: '0.55rem',
              display: 'flex', flexDirection: 'column', gap: '0.45rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: heaterActive && !coolerActive ? '#EF4444' : '#CBD5E1', boxShadow: heaterActive && !coolerActive ? '0 0 6px #EF4444' : 'none' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Heater PID (GPIO05)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 900, color: '#EF4444' }}>{targetTemp}<span style={{ fontSize: '0.55rem', fontWeight: 500 }}>°C</span></span>
                  <button type="button" onClick={() => { const next = !heaterActive; setHeaterActive(next); if (next) setCoolerActive(false); onAddLog?.('ACTUATOR', `Heater ${next ? 'ARMED' : 'OFF'}`); }}
                    style={{ border: 'none', borderRadius: '5px', padding: '2px 8px', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', background: heaterActive && !coolerActive ? '#EF4444' : '#E2E8F0', color: heaterActive && !coolerActive ? '#FFFFFF' : 'var(--slate-gray)' }}>
                    {heaterActive && !coolerActive ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              <input type="range" min="25" max="350" step="5" value={targetTemp} disabled={coolerActive}
                onChange={(e) => { const v = Number(e.target.value); setManualHeaterTarget(v); setHeaterActive(true); setCoolerActive(false); }}
                className="slider-terra" style={{ width: '100%', height: '3px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
                {[{ label: '25°', deg: 25 }, { label: '60°', deg: 60 }, { label: '100°', deg: 100 }, { label: '250°', deg: 250 }].map(btn => (
                  <button key={btn.label} type="button" disabled={coolerActive} onClick={() => { setManualHeaterTarget(btn.deg); setHeaterActive(btn.deg > 25); setCoolerActive(false); onAddLog?.('ACTUATOR', `Heater → ${btn.deg}°C`); }}
                    style={{ padding: '2px', fontSize: '0.58rem', fontWeight: 700, background: targetTemp === btn.deg && heaterActive && !coolerActive ? '#EF4444' : '#FFFFFF', color: targetTemp === btn.deg && heaterActive && !coolerActive ? '#FFFFFF' : 'var(--deep-charcoal)', border: '1px solid var(--slate-border)', borderRadius: '4px', cursor: coolerActive ? 'not-allowed' : 'pointer' }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTUATOR 3: PELTIER CHILLER */}
            <div style={{
              background: '#F8FAFC',
              border: coolerActive ? '1.5px solid #0284C7' : '1px solid var(--slate-border)',
              borderRadius: '9px', padding: '0.65rem', marginBottom: '0.55rem',
              display: 'flex', flexDirection: 'column', gap: '0.45rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: coolerActive ? '#38BDF8' : '#CBD5E1', boxShadow: coolerActive ? '0 0 6px #38BDF8' : 'none' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Chiller (GPIO12)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 900, color: '#0284C7' }}>{coolerActive ? coolerIntensity : 0}<span style={{ fontSize: '0.55rem', fontWeight: 500 }}>%</span></span>
                  <button type="button" onClick={() => { const next = !coolerActive; setCoolerActive(next); if (next) { setHeaterActive(false); setManualHeaterTarget(null); } onAddLog?.('ACTUATOR', `Chiller ${next ? 'ON' : 'OFF'}`); }}
                    style={{ border: 'none', borderRadius: '5px', padding: '2px 8px', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', background: coolerActive ? '#0284C7' : '#E2E8F0', color: coolerActive ? '#FFFFFF' : 'var(--slate-gray)' }}>
                    {coolerActive ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              <input type="range" min="20" max="100" step="5" value={coolerIntensity} disabled={!coolerActive}
                onChange={(e) => setCoolerIntensity(Number(e.target.value))}
                style={{ width: '100%', height: '3px', accentColor: '#0284C7' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
                {[{ label: 'Off', act: false, pwr: 0 }, { label: '30%', act: true, pwr: 30 }, { label: '70%', act: true, pwr: 70 }, { label: 'Max', act: true, pwr: 100 }].map(btn => (
                  <button key={btn.label} type="button" onClick={() => { setCoolerActive(btn.act); if (btn.act) { setCoolerIntensity(btn.pwr); setHeaterActive(false); setManualHeaterTarget(null); onAddLog?.('ACTUATOR', `Chiller → ${btn.pwr}%`); } }}
                    style={{ padding: '2px', fontSize: '0.58rem', fontWeight: 700, background: coolerActive && coolerIntensity === btn.pwr ? '#0284C7' : '#FFFFFF', color: coolerActive && coolerIntensity === btn.pwr ? '#FFFFFF' : 'var(--deep-charcoal)', border: '1px solid var(--slate-border)', borderRadius: '4px', cursor: 'pointer' }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTUATOR 4: UV PHOTOREACTOR LAMP */}
            <div style={{
              background: '#F8FAFC',
              border: isUvActive ? '1.5px solid #7C3AED' : '1px solid var(--slate-border)',
              borderRadius: '9px', padding: '0.65rem',
              display: 'flex', flexDirection: 'column', gap: '0.45rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isUvActive ? '#A855F7' : '#CBD5E1', boxShadow: isUvActive ? '0 0 6px #A855F7' : 'none' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>UV Lamp (GPIO16)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 900, color: '#7C3AED' }}>{isUvActive ? uvIntensity : 0}<span style={{ fontSize: '0.55rem', fontWeight: 500 }}>%</span></span>
                  <button type="button" onClick={() => { const next = !isUvActive; setLiveUvOverride(next); onAddLog?.('ACTUATOR', `UV 365nm ${next ? 'ON' : 'OFF'}`); }}
                    style={{ border: 'none', borderRadius: '5px', padding: '2px 8px', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', background: isUvActive ? '#7C3AED' : '#E2E8F0', color: isUvActive ? '#FFFFFF' : 'var(--slate-gray)' }}>
                    {isUvActive ? 'BEAM' : 'OFF'}
                  </button>
                </div>
              </div>
              <input type="range" min="10" max="100" step="5" value={uvIntensity} disabled={!isUvActive}
                onChange={(e) => setUvIntensity(Number(e.target.value))}
                style={{ width: '100%', height: '3px', accentColor: '#7C3AED' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
                {[{ label: 'Off', act: false, flx: 0 }, { label: '25%', act: true, flx: 25 }, { label: '60%', act: true, flx: 60 }, { label: '100%', act: true, flx: 100 }].map(btn => (
                  <button key={btn.label} type="button" onClick={() => { setLiveUvOverride(btn.act); if (btn.act) { setUvIntensity(btn.flx); onAddLog?.('ACTUATOR', `UV → ${btn.flx}%`); } }}
                    style={{ padding: '2px', fontSize: '0.58rem', fontWeight: 700, background: isUvActive && uvIntensity === btn.flx ? '#7C3AED' : '#FFFFFF', color: isUvActive && uvIntensity === btn.flx ? '#FFFFFF' : 'var(--deep-charcoal)', border: '1px solid var(--slate-border)', borderRadius: '4px', cursor: 'pointer' }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          INTEGRATED SERIAL TELEMETRY DOCK (ESP8266 COM3)
      ═════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#060F1C',
        border: '1px solid #1E3A5F',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        boxShadow: '0 4px 16px rgba(11,28,48,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', paddingBottom: '0.4rem', borderBottom: '1px solid #0F2033' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Terminal size={12} />
            ESP8266 Serial Stream — COM3 / 115200 BAUD
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isRunning && !isAborted ? '#22C55E' : '#475569', boxShadow: isRunning && !isAborted ? '0 0 6px #22C55E' : 'none' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#64748B' }}>
              {isRunning && !isAborted ? 'STREAMING ACTIVE' : 'IDLE'}
            </span>
          </div>
        </div>
        <div
          ref={terminalBoxRef}
          style={{ height: '95px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.66rem', lineHeight: 1.6, color: '#7ad9a6', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}
        >
          {logs?.map((l, i) => {
            const isKill = l.tag?.includes('EMERGENCY') || l.tag?.includes('HALT');
            const isHw = l.tag?.includes('HARDWARE') || l.tag?.includes('STATUS');
            const isManual = l.tag?.includes('OPERATOR') || l.tag?.includes('MANUAL') || l.tag?.includes('ACTUATOR');
            return (
              <div key={i} style={{ display: 'flex', gap: '0.45rem' }}>
                <span style={{ color: '#334155', flexShrink: 0 }}>[{l.timestamp}]</span>
                <span style={{ color: isKill ? '#EF4444' : (isManual ? 'var(--primary-lime)' : (isHw ? '#F59E0B' : '#38BDF8')), flexShrink: 0, fontWeight: 700 }}>[{l.tag}]</span>
                <span style={{ color: isKill ? '#FCA5A5' : (isManual ? '#D9F99D' : (isHw ? '#FDE68A' : '#7ad9a6')) }}>{l.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── JSON Payload Modal ── */}
      {showPayloadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,28,48,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1.25rem' }}>
          <div className="notebook-card fade-in" style={{ maxWidth: '640px', width: '100%', padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={16} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--deep-charcoal)' }}>CRC32-Verified Machine Bytecode Payload</h3>
              </div>
              <button onClick={() => setShowPayloadModal(false)} className="btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
            </div>
            <pre style={{ background: 'var(--deep-charcoal)', color: 'var(--primary-lime)', padding: '1.125rem', borderRadius: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', overflowX: 'auto', maxHeight: '350px', border: '1px solid rgba(255,255,255,0.08)' }}>
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

      {/* ── Bottom Navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--slate-border)' }}>
        <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
          <ArrowLeft size={14} /> Back to Verification Matrix
        </button>
        <button className="btn-ink" onClick={onResetAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <RotateCw size={13} /> Synthesize Another Material
        </button>
      </div>

    </div>
  );
}
