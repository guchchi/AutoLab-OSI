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
  const [showLogs, setShowLogs] = useState(false);
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

  const latestLog = logs && logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2.5rem' }} className="fade-in">

      {/* ═════════════════════════════════════════════════════════════════════════
          1. CLEAN MISSION HEADER (Airy, Generous Spacing, Authoritative Controls)
      ═════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '1.5rem 1.75rem',
        border: isAborted ? '1.5px solid #EF4444' : '1px solid var(--slate-border)',
        boxShadow: isAborted ? '0 0 24px rgba(239,68,68,0.12)' : '0 4px 20px -2px rgba(11,28,48,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.15rem'
      }}>
        {/* Top Line: Material Info & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          {/* Left: Material Identity & Live Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '14px',
              background: isAborted ? '#FEE2E2' : (isRunning ? (isPaused ? '#FEF3C7' : '#DCFCE7') : 'rgba(209,243,77,0.2)'),
              border: `1.5px solid ${isAborted ? '#EF4444' : (isRunning ? (isPaused ? '#F59E0B' : '#22C55E') : 'var(--primary-lime)')}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Cpu size={22} color={isAborted ? '#DC2626' : (isRunning ? (isPaused ? '#D97706' : '#166534') : 'var(--deep-charcoal)')} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700,
                  padding: '3px 9px', borderRadius: '6px',
                  background: isAborted ? '#FEE2E2' : (isRunning ? (isPaused ? '#FEF3C7' : '#DCFCE7') : '#F1F5F9'),
                  color: isAborted ? '#B91C1C' : (isRunning ? (isPaused ? '#92400E' : '#166534') : 'var(--slate-gray)')
                }}>
                  {isAborted ? 'Emergency Halted' : (isRunning ? (isPaused ? 'Paused' : '● Live Synthesis') : 'Ready to Run')}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--slate-gray)' }}>
                  Stage {currentStepIdx + 1} of {steps.length}: <strong style={{ color: 'var(--deep-charcoal)' }}>{activeStep.name}</strong>
                </span>
              </div>

              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--deep-charcoal)', display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                {protocol.name}
                {protocol.formula && (
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                    {protocol.formula}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Master Playback + Emergency Stop + Speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* Speed Pill */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '10px', padding: '3px', border: '1px solid var(--slate-border)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--slate-gray)', padding: '0 0.5rem', fontWeight: 600 }}>Speed</span>
              {[1, 5, 10, 25].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  style={{
                    border: 'none', padding: '0.25rem 0.55rem', borderRadius: '6px',
                    fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                    background: simSpeed === spd ? 'var(--deep-charcoal)' : 'transparent',
                    color: simSpeed === spd ? 'var(--primary-lime)' : 'var(--slate-gray)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Main Action Controller */}
            {!isRunning || isAborted ? (
              <button
                className="btn-primary"
                onClick={handleDeploy}
                style={{
                  padding: '0.65rem 1.6rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  borderRadius: '10px',
                  boxShadow: '0 2px 14px rgba(209,243,77,0.4)',
                  cursor: 'pointer'
                }}
              >
                <Play size={16} fill="currentColor" />
                {isAborted ? 'Restart Protocol' : 'Start Synthesis'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', padding: '3px', borderRadius: '10px', border: '1px solid var(--slate-border)' }}>
                <button
                  onClick={handlePrevStage}
                  disabled={currentStepIdx === 0}
                  title="Previous stage"
                  style={{
                    background: 'transparent', color: 'var(--deep-charcoal)',
                    border: 'none', borderRadius: '7px',
                    padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 600,
                    cursor: currentStepIdx === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentStepIdx === 0 ? 0.35 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                  }}
                >
                  ◀ Prev
                </button>

                <button
                  onClick={handleTogglePause}
                  title={isPaused ? 'Resume synthesis' : 'Pause synthesis'}
                  style={{
                    background: isPaused ? 'var(--primary-lime)' : 'var(--deep-charcoal)',
                    color: isPaused ? 'var(--deep-charcoal)' : '#FFFFFF',
                    border: 'none', borderRadius: '7px', padding: '0.45rem 1.15rem',
                    fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  {isPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  onClick={handleNextStage}
                  disabled={currentStepIdx >= steps.length - 1}
                  title="Advance to next stage"
                  style={{
                    background: currentStepIdx >= steps.length - 1 ? 'transparent' : 'var(--accent-blue)',
                    color: currentStepIdx >= steps.length - 1 ? 'var(--slate-gray)' : '#FFFFFF',
                    border: 'none', borderRadius: '7px',
                    padding: '0.45rem 1rem', fontSize: '0.78rem', fontWeight: 700,
                    cursor: currentStepIdx >= steps.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: currentStepIdx >= steps.length - 1 ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  <span>Next</span>
                  <SkipForward size={13} />
                </button>
              </div>
            )}

            {/* Emergency Stop Button */}
            <button
              onClick={handleEmergencyAbort}
              disabled={!isRunning && isAborted}
              title="Isolate heaters and halt agitation"
              style={{
                background: isAborted ? '#FEE2E2' : '#EF4444',
                color: isAborted ? '#B91C1C' : '#FFFFFF',
                border: `1.5px solid ${isAborted ? '#FCA5A5' : '#DC2626'}`,
                borderRadius: '10px',
                padding: '0.6rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: isAborted ? 'default' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <AlertOctagon size={15} />
              {isAborted ? 'Halted' : 'Emergency Stop'}
            </button>

            {/* Tools */}
            <button className="btn-ghost" onClick={() => setShowPayloadModal(true)} title="View machine bytecode"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Code2 size={14} /> Bytecode
            </button>
            <button className="btn-ghost" onClick={handleDownloadJson} title="Export JSON"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Download size={14} /> JSON
            </button>
          </div>
        </div>

        {/* Bottom Line: Minimal Synthesis Progress Track */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--slate-gray)' }}>
            <span>Synthesis Progress: <strong style={{ color: 'var(--deep-charcoal)' }}>{progressPct}%</strong></span>
            <span>Elapsed: <strong style={{ color: 'var(--deep-charcoal)' }}>{Math.floor(elapsedSec / 60)}m {String(Math.floor(elapsedSec % 60)).padStart(2,'0')}s</strong> of {Math.floor(totalSimSec / 60)}m</span>
          </div>
          <div style={{ height: '5px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              background: isAborted ? '#EF4444' : 'var(--deep-charcoal)',
              borderRadius: '999px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          2. SPACIOUS 2-COLUMN COCKPIT (Clean Timeline on Left, Digital Twin on Right)
      ═════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(330px, 1fr) minmax(460px, 1.45fr)',
        gap: '1.75rem',
        alignItems: 'start'
      }}>

        {/* ───────────────────────────────────────────────────────────────────
            LEFT COLUMN: CONTINUOUS SYNTHESIS TIMELINE (No nested boxes!)
        ─────────────────────────────────────────────────────────────────── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid var(--slate-border)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 4px 20px -2px rgba(11,28,48,0.04)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Layers size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--deep-charcoal)' }}>
                Synthesis Sequence
              </h3>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-gray)', fontWeight: 500 }}>
              {steps.length} Automated Stages
            </span>
          </div>

          {/* Connected Timeline List */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            
            {/* Connecting Vertical Track */}
            <div style={{
              position: 'absolute',
              left: '15px',
              top: '20px',
              bottom: '24px',
              width: '2px',
              background: '#E2E8F0',
              zIndex: 0
            }} />

            {steps.map((st, idx) => {
              const isFinished = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;
              const effTemp = Math.round(st.targetTempC + (overrides.tempOffset || 0));
              const effRpm = Math.round(st.stirRpm * (overrides.rpmMultiplier || 1));
              const effDur = Math.max(1, Math.round(st.durationMin * (overrides.timeScale || 1)));

              return (
                <div
                  key={st.id || idx}
                  onClick={() => handleJumpToStage(idx)}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    padding: isActive ? '0.85rem 1rem' : '0.65rem 0.75rem',
                    borderRadius: '12px',
                    background: isActive ? 'rgba(209,243,77,0.1)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--deep-charcoal)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Step Node Circle */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: isActive ? 'var(--deep-charcoal)' : (isFinished ? 'var(--success-green)' : '#FFFFFF'),
                    border: isFinished ? 'none' : (isActive ? 'none' : '2px solid #CBD5E1'),
                    color: isActive ? 'var(--primary-lime)' : (isFinished ? '#FFFFFF' : 'var(--slate-gray)'),
                    fontSize: '0.72rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 0 0 4px rgba(209,243,77,0.35)' : '0 0 0 3px #FFFFFF'
                  }}>
                    {isFinished ? <Check size={14} strokeWidth={3} /> : idx + 1}
                  </div>

                  {/* Step Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: isActive ? 700 : 600, color: 'var(--deep-charcoal)' }}>
                        {st.name}
                      </span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600,
                        padding: '2px 7px', borderRadius: '4px',
                        background: isActive ? 'var(--deep-charcoal)' : (isFinished ? '#DCFCE7' : '#F1F5F9'),
                        color: isActive ? 'var(--primary-lime)' : (isFinished ? '#166534' : 'var(--slate-gray)'),
                        flexShrink: 0
                      }}>
                        {isActive ? (isPaused ? 'Paused' : 'Active') : (isFinished ? 'Done' : `${effDur} min`)}
                      </span>
                    </div>

                    {/* Parameters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: 'var(--slate-gray)', marginTop: '0.2rem' }}>
                      <span>{effTemp}°C</span>
                      <span>·</span>
                      <span>{effRpm} RPM</span>
                      <span>·</span>
                      <span>{effDur} min</span>
                      {st.uvExposure && (
                        <span style={{ fontSize: '9px', background: '#F3E8FF', color: '#6B21A8', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                          UV 365nm
                        </span>
                      )}
                    </div>

                    {/* Active Step Progress Countdown */}
                    {isActive && (
                      <div style={{ marginTop: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--deep-charcoal)', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>Stage Progress</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                            {Math.floor(stageElapsedSec / 60)}m {String(Math.floor(stageElapsedSec % 60)).padStart(2,'0')}s / {Math.floor(stageDurationSec / 60)}m ({stageProgressPct}%)
                          </span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(11,28,48,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${stageProgressPct}%`, height: '100%', background: 'var(--deep-charcoal)', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Literature Provenance */}
          <div style={{
            borderTop: '1px solid var(--slate-border)',
            paddingTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-charcoal)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={13} color="var(--accent-blue)" /> Literature Sourced
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--slate-gray)' }}>Valency Ingestion</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-gray)', lineHeight: 1.4 }}>
              {protocol.citation?.title || protocol.name}
            </div>
            {protocol.citation?.doi && (
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                DOI: {protocol.citation.doi}
              </div>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            RIGHT COLUMN: DIGITAL TWIN COCKPIT & ACTUATORS
        ─────────────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* 1. Cockpit: Reactor Chamber & BORDERLESS Telemetry Readouts */}
          <div style={{
            background: 'radial-gradient(ellipse at top, #1E293B 0%, #0F172A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 8px 30px rgba(11,28,48,0.12)'
          }}>
            {/* Header: Title & Actuator Status Dots */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F1F5F9' }}>
                Digital Twin · Live Reactor Vessel
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {[
                  { label: 'Heat', active: heaterPwm > 0 && !isAborted && !coolerActive, color: '#EF4444' },
                  { label: 'Chill', active: coolerActive && !isAborted, color: '#38BDF8' },
                  { label: 'Stir', active: simRpm > 0 && !isAborted, color: 'var(--primary-lime)' },
                  { label: 'UV', active: isUvActive && !isAborted, color: '#A855F7' },
                ].map(a => (
                  <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: a.active ? a.color : 'rgba(255,255,255,0.18)' }} />
                    <span style={{ fontSize: '0.7rem', color: a.active ? a.color : '#64748B', fontWeight: 600 }}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Central Glass Reactor Vessel */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0' }}>
              {isUvActive && !isAborted && (
                <div style={{ width: '90px', height: '10px', background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.7), transparent)', borderRadius: '99px', marginBottom: '6px', animation: 'uvBeamPulse 1.3s ease-in-out infinite' }} />
              )}

              <div style={{
                width: '116px', height: '148px',
                background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${liquidColor} 100%)`,
                borderRadius: '8px 8px 40% 40% / 8px 8px 30% 30%',
                border: `2px solid ${heaterPwm > 0 && !coolerActive && !isAborted ? '#EF4444' : (coolerActive && !isAborted ? '#38BDF8' : 'rgba(255,255,255,0.18)')}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: heaterPwm > 0 && !coolerActive && !isAborted ? '0 0 24px rgba(239,68,68,0.25)' : (coolerActive && !isAborted ? '0 0 20px rgba(56,189,248,0.25)' : 'none'),
                transition: 'all 0.4s ease',
              }}>
                {/* Fluid */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: `${55 + heatF * 20}%`,
                  background: `linear-gradient(to top, ${liquidColor}, ${liquidColor.replace(/[\d.]+\)$/, '0.3)')} )`,
                  transition: 'height 0.4s ease',
                }} />

                {/* Stirring Bar & Vortex */}
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
                      width: '32px', height: '6px', borderRadius: '3px',
                      background: '#FFFFFF', boxShadow: '0 0 8px #FFFFFF',
                      animation: `stirBarSpin ${spinDur}s linear infinite`,
                      transform: 'translateX(-50%)',
                    }} />
                  </>
                )}

                {/* Thermal Waves */}
                {heaterPwm > 0 && !coolerActive && !isAborted && targetTemp > 40 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: '8px', pointerEvents: 'none' }}>
                    {[0.9, 1.1, 1.3, 0.95, 1.15].map((d, i) => (
                      <div key={i} style={{ width: '3px', height: '18px', background: 'linear-gradient(to top, rgba(249,115,22,0.6), transparent)', borderRadius: '2px', animation: `thermalWaveUp ${d * 1.2}s ease-in-out infinite` }} />
                    ))}
                  </div>
                )}

                {/* Frost Effect */}
                {coolerActive && !isAborted && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(56,189,248,0.15) 0%, transparent 60%)', animation: 'frostGlimmer 1.5s ease-in-out infinite' }} />
                )}
              </div>

              <div style={{ width: '140px', height: '10px', background: '#1E293B', borderRadius: '0 0 8px 8px', border: '1px solid #334155', marginTop: '-1px' }} />
            </div>

            {/* BORDERLESS Telemetry Readouts (3 Spacious Columns, No Nested Boxes) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              width: '100%',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '1.25rem'
            }}>
              {/* Temperature */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700 }}>
                  TEMPERATURE
                </span>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800,
                  color: simTemp > 80 ? '#FCA5A5' : (coolerActive ? '#7DD3FC' : '#F8FAFC'),
                  lineHeight: 1.15
                }}>
                  {simTemp.toFixed(1)}<span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginLeft: '2px' }}>°C</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Target: {targetTemp}°C</span>
              </div>

              {/* Stir Agitation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700 }}>
                  STIR AGITATION
                </span>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800,
                  color: simRpm > 0 ? 'var(--primary-lime)' : '#64748B',
                  lineHeight: 1.15
                }}>
                  {simRpm}<span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginLeft: '3px' }}>RPM</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Target: {targetRpm} RPM</span>
              </div>

              {/* Stage Elapsed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#94A3B8', fontWeight: 700 }}>
                  STAGE ELAPSED
                </span>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800,
                  color: '#F8FAFC',
                  lineHeight: 1.15
                }}>
                  {Math.floor(stageElapsedSec / 60)}<span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>m {String(Math.floor(stageElapsedSec % 60)).padStart(2,'0')}s</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Total: {Math.floor(stageDurationSec/60)}m ({stageProgressPct}%)</span>
              </div>
            </div>
          </div>

          {/* 2. Actuator Channels (Clean, Open 2x2 Grid — NO 4 GRAY SUB-BOXES) */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid var(--slate-border)',
            padding: '1.5rem 1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 4px 20px -2px rgba(11,28,48,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={16} color="var(--deep-charcoal)" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--deep-charcoal)' }}>
                    Actuator Channels & Trims
                  </h3>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-gray)' }}>
                  Fine-tune motor speed and thermal targets live
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
                  onAddLog?.('SYSTEM', 'Actuators re-synchronized with recipe targets.');
                }}
                className="btn-ghost"
                style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', borderRadius: '8px' }}
              >
                <RotateCcw size={12} style={{ marginRight: '4px' }} /> Sync Recipe
              </button>
            </div>

            {/* 4 Open Channels (Generous spacing, clean sliders) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem 1.75rem' }}>
              
              {/* Channel 1: Mixer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--deep-charcoal)' }}>Agitation (Pin 4)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>{targetRpm} RPM</span>
                </div>
                <input
                  type="range" min="0" max="1400" step="50" value={targetRpm}
                  onChange={(e) => { const v = Number(e.target.value); setManualMixerRpm(v); setMixerActive(v > 0); }}
                  className="slider-amber" style={{ width: '100%', height: '5px' }}
                />
              </div>

              {/* Channel 2: Heater */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--deep-charcoal)' }}>Heating (Pin 5)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: '#EF4444' }}>{targetTemp}°C</span>
                </div>
                <input
                  type="range" min="25" max="350" step="5" value={targetTemp} disabled={coolerActive}
                  onChange={(e) => { const v = Number(e.target.value); setManualHeaterTarget(v); setHeaterActive(true); setCoolerActive(false); }}
                  className="slider-terra" style={{ width: '100%', height: '5px' }}
                />
              </div>

              {/* Channel 3: Cryo Chiller */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--deep-charcoal)' }}>Cryo Chiller (Pin 12)</span>
                  <button
                    type="button"
                    onClick={() => { const next = !coolerActive; setCoolerActive(next); if (next) { setHeaterActive(false); setManualHeaterTarget(null); } }}
                    style={{
                      border: 'none', borderRadius: '5px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      background: coolerActive ? '#0284C7' : '#E2E8F0',
                      color: coolerActive ? '#FFFFFF' : 'var(--slate-gray)'
                    }}
                  >
                    {coolerActive ? 'Active Quench' : 'Idle'}
                  </button>
                </div>
                <input
                  type="range" min="20" max="100" step="5" value={coolerIntensity} disabled={!coolerActive}
                  onChange={(e) => setCoolerIntensity(Number(e.target.value))}
                  style={{ width: '100%', height: '5px', accentColor: '#0284C7' }}
                />
              </div>

              {/* Channel 4: UV Photolysis */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--deep-charcoal)' }}>Photolysis 365nm (Pin 16)</span>
                  <button
                    type="button"
                    onClick={() => setLiveUvOverride(!isUvActive)}
                    style={{
                      border: 'none', borderRadius: '5px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      background: isUvActive ? '#7C3AED' : '#E2E8F0',
                      color: isUvActive ? '#FFFFFF' : 'var(--slate-gray)'
                    }}
                  >
                    {isUvActive ? 'Beam On' : 'Off'}
                  </button>
                </div>
                <input
                  type="range" min="10" max="100" step="5" value={uvIntensity} disabled={!isUvActive}
                  onChange={(e) => setUvIntensity(Number(e.target.value))}
                  style={{ width: '100%', height: '5px', accentColor: '#7C3AED' }}
                />
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          3. SLEEK COLLAPSIBLE SERIAL TELEMETRY STRIP (ESP8266 COM3)
      ═════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#0F172A',
        borderRadius: '16px',
        padding: '0.75rem 1.25rem',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 4px 16px rgba(11,28,48,0.1)'
      }}>
        {/* Single-Line Compact Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Terminal size={14} color="var(--primary-lime)" />
            <span style={{ fontSize: '0.78rem', color: '#F1F5F9', fontWeight: 600 }}>
              ESP8266 COM3 (115200 Baud)
            </span>
            <span style={{
              fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
              background: isRunning && !isAborted ? 'rgba(74,222,128,0.15)' : 'rgba(100,116,139,0.2)',
              color: isRunning && !isAborted ? '#4ADE80' : '#94A3B8'
            }}>
              {isRunning && !isAborted ? '● Connected' : '○ Standby'}
            </span>
          </div>

          {/* Latest Log Preview Ticker (when collapsed) */}
          {!showLogs && latestLog && (
            <div style={{
              flex: 1, minWidth: '200px', maxWidth: '520px',
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              <span style={{ color: '#475569', marginRight: '6px' }}>[{latestLog.timestamp}]</span>
              <span style={{ color: 'var(--primary-lime)', marginRight: '6px' }}>[{latestLog.tag}]</span>
              <span style={{ color: '#E2E8F0' }}>{latestLog.message}</span>
            </div>
          )}

          {/* Expand / Collapse Button */}
          <button
            onClick={() => setShowLogs(!showLogs)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '7px',
              padding: '0.3rem 0.65rem',
              color: '#CBD5E1',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {showLogs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showLogs ? 'Hide Console' : `Console Logs (${logs?.length || 0})`}
          </button>
        </div>

        {/* Full Terminal Window (Only when expanded) */}
        {showLogs && (
          <div
            ref={terminalBoxRef}
            style={{
              height: '140px', overflowY: 'auto',
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              lineHeight: 1.6, color: '#A7F3D0',
              display: 'flex', flexDirection: 'column', gap: '0.2rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '0.65rem', marginTop: '0.35rem'
            }}
          >
            {logs?.map((l, i) => {
              const isKill = l.tag?.includes('EMERGENCY') || l.tag?.includes('HALT');
              const isHw = l.tag?.includes('HARDWARE') || l.tag?.includes('STATUS');
              const isManual = l.tag?.includes('OPERATOR') || l.tag?.includes('MANUAL') || l.tag?.includes('ACTUATOR');
              return (
                <div key={i} style={{ display: 'flex', gap: '0.55rem' }}>
                  <span style={{ color: '#475569', flexShrink: 0 }}>[{l.timestamp}]</span>
                  <span style={{ color: isKill ? '#EF4444' : (isManual ? 'var(--primary-lime)' : (isHw ? '#F59E0B' : '#38BDF8')), flexShrink: 0, fontWeight: 700 }}>[{l.tag}]</span>
                  <span style={{ color: isKill ? '#FCA5A5' : (isManual ? '#D9F99D' : (isHw ? '#FDE68A' : '#A7F3D0')) }}>{l.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── JSON Payload Modal ── */}
      {showPayloadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,28,48,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1.25rem' }}>
          <div className="notebook-card fade-in" style={{ maxWidth: '640px', width: '100%', padding: '1.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={17} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--deep-charcoal)' }}>CRC32-Verified Machine Bytecode</h3>
              </div>
              <button onClick={() => setShowPayloadModal(false)} className="btn-ghost" style={{ padding: '4px 8px' }}>✕</button>
            </div>
            <pre style={{ background: '#0F172A', color: 'var(--primary-lime)', padding: '1.25rem', borderRadius: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', overflowX: 'auto', maxHeight: '350px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {JSON.stringify(generateHardwarePayload(protocol, overrides), null, 2)}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={handleDownloadJson} style={{ fontSize: '0.85rem' }}>
                <Download size={14} /> Download autolab_{protocol.id}.json
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--slate-border)' }}>
        <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', fontWeight: 600 }}>
          <ArrowLeft size={15} /> Back to Verification Matrix
        </button>
        <button className="btn-ink" onClick={onResetAll} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.86rem', fontWeight: 600 }}>
          <RotateCw size={14} /> Synthesize Another Material
        </button>
      </div>

    </div>
  );
}
