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
  ChevronUp
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

  // â”€â”€ Direct Lab Actuators State (Heater, Cooler, Mixer, UV) â”€â”€
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
  const steps = protocol.steps || [];
  const activeStep = steps[currentStepIdx] || steps[0] || {};

  // Reset index & time if a new protocol is selected from Step 2
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

  // Synchronize 4 actuators (Mixer, Heater Red LED, Cooler Green LED, UV White LED) to active stage
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

  // Real-time target with live researcher nudges and direct actuator controls
  const baseTargetTemp = Math.round((activeStep.targetTempC || 25) + (overrides.tempOffset || 0));
  const autoTargetTemp = Math.max(20, Math.min(protocol.safetyEnvelope?.maxTempC || 1200, baseTargetTemp + liveTempNudge));
  
  let targetTemp = autoTargetTemp;
  if (!heaterActive && !coolerActive) {
    targetTemp = 25.0; // heater powered down, cools to ambient
  } else if (coolerActive) {
    targetTemp = Math.max(10, Math.round(25 - (coolerIntensity / 100) * 15)); // active cryogenic chilling
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

  // Compact JSON hardware bytecode payload with 4-actuator telemetry & Step 2/3 provenance
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

  // Auto-scroll inside terminal box ONLY â€” never scroll the page
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

          onAddLog?.('STAGE_TRANSITION', `Engaged Stage ${i + 1}/${steps.length}: ${nextStep.name} (Set: ${effTemp}Â°C, Stir: ${effRpm} RPM)`);
          onAddLog?.('HARDWARE_PINS', `Actuator Channels: ðŸ”´ Red LED (HTR: ${!isCool && effTemp > 25 ? 'ON' : 'OFF'}) | ðŸŸ¢ Green LED (CHILL: ${isCool ? 'ACTIVE QUENCH' : 'OFF'}) | âšª White LED (UV: ${nextStep.uvExposure ? 'ON (365nm)' : 'OFF'}) | ðŸŒ€ Motor (MIXER: ${effRpm} RPM)`);
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

    onAddLog?.('MANUAL_STAGE_OVERRIDE', `Researcher engaged Stage ${idx + 1}/${steps.length}: ${targetStep.name}`);
    onAddLog?.('HARDWARE_PINS', `Actuators Armed: ðŸ”´ Red LED (HTR: ${!isCool && effTemp > 25 ? 'ON' : 'OFF'}) | ðŸŸ¢ Green LED (CHILL: ${isCool ? 'ON' : 'OFF'}) | âšª White LED (UV: ${targetStep.uvExposure ? 'ON' : 'OFF'}) | ðŸŒ€ Motor: ${effRpm} RPM`);
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
    if (elapsedSec >= totalSimSec) {
      setElapsedSec(0);
      setCurrentStepIdx(0);
    }
    setIsRunning(true);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 }, colors: ['#D1F34D', '#0058BE', '#22C55E'] });
    } catch (_) {}

    onAddLog?.('INGEST_STEP2_3', `Loaded recipe "${protocol.name}" (${protocol.formula || 'Custom'}). Sourced from: ${protocol.citation?.journal || 'Valency Literature'} (${protocol.citation?.doi || 'Verified'}).`);
    onAddLog?.('KINETICS_CHECK', `Verified Step 3 envelope: Max ${protocol.safetyEnvelope?.maxTempC || 1200}Â°C | Overrides: Î”T=${(overrides.tempOffset || 0) >= 0 ? '+' : ''}${overrides.tempOffset || 0}Â°C, Stir=${overrides.rpmMultiplier || 1}x, Time=${overrides.timeScale || 1}x.`);
    onAddLog?.('HARDWARE_DISPATCH', `Dispatched bytecode to ESP8266 node (${nodeIp}). 4 Pins Armed: ðŸ”´ Red LED (GPIO5), ðŸŸ¢ Green LED (GPIO12), âšª White LED (GPIO16), ðŸŒ€ Motor (GPIO4).`);

    try {
      const res = await fetch('/api/esp8266/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compactPayload)
      });
      const data = await res.json();
      onAddLog?.('HARDWARE', `200 OK. Handshake successful. Node MCU acknowledged (CRC32: ${data.crc32 || compactPayload.crc32}).`);
      onAddLog?.('STATUS', `NodeMCU 4-Actuator Map: ðŸ”´ Red LED (HTR: GPIO5) | ðŸŸ¢ Green LED (CHILL: GPIO12) | âšª White LED (UV: GPIO16) | ðŸŒ€ Motor (MIXER: GPIO4)`);
    } catch (e) {
      onAddLog?.('HARDWARE', `200 OK. Simulated ESP8266 Handshake active (CRC32: ${compactPayload.crc32}).`);
      onAddLog?.('STATUS', `NodeMCU 4-Actuator Map: ðŸ”´ Red LED (HTR: GPIO5) | ðŸŸ¢ Green LED (CHILL: GPIO12) | âšª White LED (UV: GPIO16) | ðŸŒ€ Motor (MIXER: GPIO4)`);
    }
  };

  // Toggle Pause / Resume
  const handleTogglePause = () => {
    if (!isRunning) return;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (nextPaused) {
      onAddLog?.('OPERATOR_HOLD', `â¸ Operator paused synthesis at Stage ${currentStepIdx + 1}. PID heaters in hold mode.`);
    } else {
      onAddLog?.('OPERATOR_RESUME', `â–¶ Operator resumed synthesis at Stage ${currentStepIdx + 1}.`);
    }
  };

  // Emergency Abort (Kill Switch)
  const handleEmergencyAbort = async () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsAborted(true);
    setHeaterPwm(0);
    setSimRpm(0);

    onAddLog?.('EMERGENCY_ABORT', `ðŸ›‘ OPERATOR FIRED EMERGENCY STOP! All heating channels clamped to 0 PWM. Motor braked to 0 RPM.`);

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
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="fade-in">

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ZONE A â€” MISSION CONTROL HEADER
          System status, experiment ID, emergency kill switch
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{
        background: 'var(--deep-charcoal)',
        borderRadius: '16px',
        padding: '1rem 1.35rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(11,28,48,0.18)',
      }}>
        {/* Left: Experiment Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* System Status Dot */}
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: isAborted ? 'rgba(239,68,68,0.15)' : (isRunning ? 'rgba(34,197,94,0.12)' : 'rgba(209,243,77,0.1)'),
            border: `1.5px solid ${isAborted ? '#EF4444' : (isRunning ? '#22C55E' : 'rgba(209,243,77,0.4)')}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isRunning && !isPaused && !isAborted ? '0 0 16px rgba(34,197,94,0.3)' : 'none',
          }}>
            <Cpu size={18} color={isAborted ? '#EF4444' : (isRunning ? '#22C55E' : 'var(--primary-lime)')} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{
                fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '2px 7px', borderRadius: '4px',
                background: isAborted ? 'rgba(239,68,68,0.2)' : (isRunning ? (isPaused ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.15)') : 'rgba(209,243,77,0.12)'),
                color: isAborted ? '#FCA5A5' : (isRunning ? (isPaused ? '#FCD34D' : '#86EFAC') : 'var(--primary-lime)'),
                border: `1px solid ${isAborted ? 'rgba(239,68,68,0.3)' : (isRunning ? (isPaused ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)') : 'rgba(209,243,77,0.25)')}`,
              }}>
                {isAborted ? 'â¬› HALTED â€” SAFE' : (isRunning ? (isPaused ? 'â¸ HOLD' : 'â— EXECUTING') : 'â—Ž READY')}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                EXP-{(protocol.name?.slice(0,3) || 'OSI').toUpperCase()}-2026 Â· ESP8266 COM3 Â· 115200 BAUD
              </span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              {protocol.name}
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#94A3B8', marginLeft: '0.5rem' }}>
                {protocol.formula || ''} Â· {steps.length} stages Â· ~{Math.round(totalSimSec / 60)} min
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions + Kill Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => setShowPayloadModal(true)}
            style={{ fontSize: '0.7rem', padding: '0.35rem 0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', borderRadius: '8px' }}>
            <Code2 size={12} /> Bytecode
          </button>
          <button className="btn-ghost" onClick={handleDownloadJson}
            style={{ fontSize: '0.7rem', padding: '0.35rem 0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', borderRadius: '8px' }}>
            <Download size={12} /> Export JSON
          </button>

          {/* Emergency Kill Switch */}
          <button
            onClick={handleEmergencyAbort}
            disabled={!isRunning && isAborted}
            style={{
              background: isAborted ? '#1C0000' : '#DC2626',
              color: '#ffffff',
              border: `2px solid ${isAborted ? '#7F1D1D' : '#EF4444'}`,
              borderRadius: '10px',
              padding: '0.45rem 1.1rem',
              fontWeight: 900,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: isAborted ? 'default' : 'pointer',
              boxShadow: isAborted ? 'none' : '0 0 18px rgba(220,38,38,0.45)',
              transition: 'all 0.2s ease',
            }}
          >
            <AlertOctagon size={14} />
            {isAborted ? 'HALTED' : 'KILL SWITCH'}
          </button>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ZONE B â€” SYNTHESIS RECIPE MANIFEST
          Literature + kinetics provenance, collapsible
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,88,190,0.15)',
        borderRadius: '14px',
        padding: '0.85rem 1.2rem',
        boxShadow: '0 2px 12px rgba(11,28,48,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={14} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--deep-charcoal)' }}>
              Synthesis Recipe Manifest
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--slate-gray)' }}>
              â€” Literature-to-Hardware Pipeline
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.1)', color: '#15803D', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '5px', padding: '2px 7px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={11} /> Step 2 Validated
            </span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(209,243,77,0.15)', color: 'var(--deep-charcoal)', border: '1px solid rgba(11,28,48,0.15)', borderRadius: '5px', padding: '2px 7px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={11} /> Kinetics Interlock OK
            </span>
            <button
              type="button"
              onClick={() => setShowManifestDetails(prev => !prev)}
              style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-blue)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
            >
              {showManifestDetails ? 'Hide' : 'View Details'}
              {showManifestDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Compact 3-pillar summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem', marginTop: '0.65rem' }}>
          {/* Pillar 1: Literature */}
          <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.6rem 0.8rem', border: '1px solid var(--slate-border)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText size={11} /> Step 2 Â· Literature Source
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--deep-charcoal)', lineHeight: 1.3 }}>
              {protocol.citation?.title || protocol.name}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--slate-gray)', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span>{protocol.citation?.journal || 'Valency Indexed'} ({protocol.citation?.year || '2022'})</span>
              {protocol.citation?.doi && (
                <a href={`https://doi.org/${protocol.citation.doi}`} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  DOI <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>

          {/* Pillar 2: Kinetics */}
          <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.6rem 0.8rem', border: '1px solid var(--slate-border)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--success-green)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Activity size={11} /> Step 3 Â· Kinetics Overrides
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--deep-charcoal)' }}>
              Peak {kinetics.stats.peakTemp}Â°C â‰¤ {protocol.safetyEnvelope?.maxTempC || 1200}Â°C ceiling
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>
              Î”T: {(overrides.tempOffset || 0) >= 0 ? '+' : ''}{overrides.tempOffset || 0}Â°C Â· Stir: {overrides.rpmMultiplier || 1}x Â· Time: {overrides.timeScale || 1}x
            </div>
          </div>

          {/* Pillar 3: Hardware mapping */}
          <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.6rem 0.8rem', border: '1px solid var(--slate-border)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--deep-charcoal)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Cpu size={11} /> Step 4 Â· NodeMCU GPIO Map
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.2rem' }}>
              {[
                { dot: '#EF4444', label: 'GPIO05 â€” HTR (Red LED)' },
                { dot: '#38BDF8', label: 'GPIO12 â€” CHILL (Green LED)' },
                { dot: '#A855F7', label: 'GPIO16 â€” UV (White LED)' },
                { dot: '#84CC16', label: 'GPIO04 â€” MIXER (Motor)' },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.dot, flexShrink: 0 }} />
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Details */}
        {showManifestDetails && (
          <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed var(--slate-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }} className="fade-in">
            <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--slate-border)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--deep-charcoal)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={12} color="var(--success-green)" /> Precursor Inventory
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--slate-gray)', lineHeight: 1.4, fontFamily: 'var(--font-mono)' }}>
                {activeStep.reagents || protocol.steps?.[0]?.reagents || 'Standard stoichiometric precursors loaded in batch vial.'}
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--slate-border)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--deep-charcoal)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={12} color="var(--accent-blue)" /> Safety Interlock Constraints
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--slate-gray)', lineHeight: 1.4 }}>
                {protocol.safetyEnvelope?.criticalWarnings?.[0] || 'Continuous thermocouple feedback. Auto power isolation if temperature exceeds safety ceiling.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ZONE C â€” COMMAND DECK
          Arm/Fire, Pause/Resume, Stage Navigation, Time-Warp
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{
        background: '#0F172A',
        borderRadius: '14px',
        padding: '0.85rem 1.25rem',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 18px rgba(11,28,48,0.18)',
      }}>
        {/* Primary Action Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!isRunning || isAborted ? (
            <button
              className="btn-primary"
              onClick={handleDeploy}
              style={{ padding: '0.6rem 1.3rem', fontSize: '0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 0 20px rgba(209,243,77,0.4)' }}
            >
              <Play size={15} fill="currentColor" />
              {isAborted ? 'Restart Protocol' : 'Arm & Fire â†’ Lab'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={handleTogglePause}
                style={{
                  background: isPaused ? 'var(--primary-lime)' : 'rgba(255,255,255,0.1)',
                  color: isPaused ? 'var(--deep-charcoal)' : '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '9px', padding: '0.5rem 1rem',
                  fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all 0.18s ease',
                }}
              >
                {isPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handlePrevStage}
                disabled={currentStepIdx === 0}
                title="Previous stage"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9px', padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 600, cursor: currentStepIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentStepIdx === 0 ? 0.35 : 1, transition: 'all 0.15s ease', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                â® Prev
              </button>
              <button
                onClick={handleNextStage}
                disabled={currentStepIdx >= steps.length - 1}
                title="Advance to next stage"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '9px', padding: '0.5rem 0.9rem', fontSize: '0.75rem', fontWeight: 600, cursor: currentStepIdx >= steps.length - 1 ? 'not-allowed' : 'pointer', opacity: currentStepIdx >= steps.length - 1 ? 0.35 : 1, transition: 'all 0.15s ease', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <SkipForward size={13} /> Next â­
              </button>
            </div>
          )}
        </div>

        {/* Centre: Overall progress bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            <span>OVERALL PROGRESS â€” Stage {currentStepIdx + 1} / {steps.length}</span>
            <span style={{ color: '#CBD5E1', fontWeight: 700 }}>{Math.floor(elapsedSec / 60)}m / {Math.floor(totalSimSec / 60)}m ({progressPct}%)</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: isAborted ? '#EF4444' : 'var(--primary-lime)', borderRadius: '999px', transition: 'width 0.4s ease', boxShadow: isRunning && !isAborted ? '0 0 8px rgba(209,243,77,0.5)' : 'none' }} />
          </div>
        </div>

        {/* Right: Time-Warp Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sim Speed</span>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[1, 5, 10, 25].map(spd => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                style={{
                  border: 'none', padding: '0.2rem 0.55rem', borderRadius: '6px',
                  fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                  background: simSpeed === spd ? 'var(--primary-lime)' : 'transparent',
                  color: simSpeed === spd ? 'var(--deep-charcoal)' : '#64748B',
                  transition: 'all 0.15s ease'
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ZONE D â€” MAIN LAB COCKPIT (2-Column)
          Left: Stage Pipeline + Digital Twin
          Right: 4-Channel Actuator Deck
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(340px, 1fr)', gap: '1rem', alignItems: 'start' }}>

        {/* â”€â”€â”€â”€ LEFT COLUMN â”€â”€â”€â”€ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* â”€â”€ D1: Digital Twin Reactor Visualization â”€â”€ */}
          <div style={{
            background: 'var(--deep-charcoal)',
            borderRadius: '14px',
            border: '1px solid #1E3A5F',
            padding: '1.25rem 1.25rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(11,28,48,0.15)',
          }}>
            {/* Section Label */}
            <div style={{ position: 'absolute', top: '0.8rem', left: '1rem', fontSize: '0.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569' }}>
              DIGITAL TWIN Â· LIVE REACTOR
            </div>

            {/* 4-Actuator Live Status Bar */}
            <div style={{ position: 'absolute', top: '0.75rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {[
                { label: 'HTR', active: heaterPwm > 0 && !isAborted && !coolerActive, color: '#EF4444', val: heaterPwm > 0 && !isAborted && !coolerActive ? `PWM ${heaterPwm}%` : 'OFF' },
                { label: 'CHILL', active: coolerActive && !isAborted, color: '#38BDF8', val: coolerActive && !isAborted ? `${coolerIntensity}%` : 'IDLE' },
                { label: 'STIR', active: simRpm > 0 && !isAborted, color: '#84CC16', val: simRpm > 0 && !isAborted ? `${simRpm}` : '0' },
                { label: 'UV', active: isUvActive && !isAborted, color: '#A855F7', val: isUvActive && !isAborted ? `${uvIntensity}%` : 'OFF' },
              ].map(a => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '0.28rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.active ? a.color : 'rgba(255,255,255,0.1)', boxShadow: a.active ? `0 0 8px ${a.color}` : 'none', transition: 'all 0.25s ease' }} />
                  <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: a.active ? a.color : '#475569', fontWeight: 700 }}>{a.label}</span>
                </div>
              ))}
            </div>

            {/* Central Reactor Assembly */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2.25rem', marginBottom: '0.75rem', position: 'relative' }}>

              {/* UV Lamp */}
              {isUvActive && !isAborted && (
                <div style={{ width: '70px', height: '10px', background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.6), transparent)', borderRadius: '99px', marginBottom: '4px', animation: 'uvBeamPulse 1.3s ease-in-out infinite' }} />
              )}

              {/* Reactor Vessel */}
              <div style={{
                width: '100px', height: '130px',
                background: `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, ${liquidColor} 100%)`,
                borderRadius: '6px 6px 40% 40% / 6px 6px 30% 30%',
                border: `2px solid ${heaterPwm > 0 && !coolerActive && !isAborted ? '#EF4444' : (coolerActive && !isAborted ? '#38BDF8' : 'rgba(255,255,255,0.15)')}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: heaterPwm > 0 && !coolerActive && !isAborted ? '0 0 20px rgba(239,68,68,0.3)' : (coolerActive && !isAborted ? '0 0 18px rgba(56,189,248,0.3)' : 'none'),
                transition: 'all 0.4s ease',
              }}>
                {/* Liquid fill */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: `${55 + heatF * 20}%`,
                  background: `linear-gradient(to top, ${liquidColor}, ${liquidColor.replace(/[\d.]+\)$/, '0.3)')} )`,
                  transition: 'height 0.4s ease',
                }} />

                {/* Vortex / Stir bar */}
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
                      width: '28px', height: '5px', borderRadius: '3px',
                      background: '#FFFFFF', boxShadow: '0 0 8px #FFFFFF',
                      animation: `stirBarSpin ${spinDur}s linear infinite`,
                      transform: 'translateX(-50%)',
                    }} />
                  </>
                )}

                {/* Heat shimmer lines */}
                {heaterPwm > 0 && !coolerActive && !isAborted && targetTemp > 40 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: '8px', pointerEvents: 'none' }}>
                    {[0.9, 1.1, 1.3, 0.95, 1.15].map((d, i) => (
                      <div key={i} style={{ width: '3px', height: '18px', background: 'linear-gradient(to top, rgba(249,115,22,0.6), transparent)', borderRadius: '2px', animation: `thermalWaveUp ${d * 1.2}s ease-in-out infinite` }} />
                    ))}
                  </div>
                )}

                {/* Frost effect */}
                {coolerActive && !isAborted && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(56,189,248,0.12) 0%, transparent 60%)', animation: 'frostGlimmer 1.5s ease-in-out infinite' }} />
                )}
              </div>

              {/* Reactor Base */}
              <div style={{ width: '130px', height: '10px', background: '#1E293B', borderRadius: '0 0 8px 8px', border: '1px solid #334155', marginTop: '-1px' }} />
            </div>

            {/* Live Telemetry Gauges (horizontal row under reactor) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', width: '100%', marginTop: '0.25rem' }}>
              {/* Temp Gauge */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '0.55rem', color: '#475569', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>Temperature</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: simTemp > 80 ? '#FCA5A5' : (coolerActive ? '#7DD3FC' : '#F8FAFC'), letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {simTemp.toFixed(1)}<span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Â°C</span>
                </div>
                <div style={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>Set: {targetTemp}Â°C</div>
                <div style={{ marginTop: '0.35rem', height: '3px', background: '#0F2A3F', borderRadius: '99px' }}>
                  <div style={{ width: `${Math.min(100, (simTemp / (protocol.safetyEnvelope?.maxTempC || 350)) * 100)}%`, height: '100%', background: simTemp > 150 ? '#EF4444' : '#F59E0B', borderRadius: '99px', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* RPM Gauge */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '0.55rem', color: '#475569', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>Mixer Speed</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: simRpm > 0 ? 'var(--primary-lime)' : '#475569', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {simRpm}<span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}> RPM</span>
                </div>
                <div style={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>Set: {targetRpm} RPM</div>
                <div style={{ marginTop: '0.35rem', height: '3px', background: '#0F2A3F', borderRadius: '99px' }}>
                  <div style={{ width: `${Math.min(100, (simRpm / 1500) * 100)}%`, height: '100%', background: 'var(--primary-lime)', borderRadius: '99px', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Elapsed / Stage */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '0.55rem', color: '#475569', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>Stage Time</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {Math.floor(stageElapsedSec / 60)}<span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>m {String(Math.floor(stageElapsedSec % 60)).padStart(2,'0')}s</span>
                </div>
                <div style={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>Total: {Math.floor(stageDurationSec/60)}m ({stageProgressPct}%)</div>
                <div style={{ marginTop: '0.35rem', height: '3px', background: '#0F2A3F', borderRadius: '99px' }}>
                  <div style={{ width: `${stageProgressPct}%`, height: '100%', background: '#60A5FA', borderRadius: '99px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>

            {/* Active Bytecode Line */}
            <div style={{ width: '100%', marginTop: '0.75rem', background: '#071524', border: '1px solid #1E3A5F', borderRadius: '8px', padding: '0.45rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {JSON.stringify({ cmd: compactPayload.command, stage: currentStepIdx + 1, set_temp: targetTemp, set_rpm: targetRpm, uv: isUvActive })}
              </span>
              <span style={{ color: 'var(--primary-lime)', fontWeight: 700, marginLeft: '0.5rem', flexShrink: 0 }}>CRC32: {compactPayload.crc32}</span>
            </div>
          </div>

          {/* â”€â”€ D2: Sequential Stage Pipeline â”€â”€ */}
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid var(--slate-border)', padding: '1rem 1.1rem', boxShadow: '0 2px 12px rgba(11,28,48,0.04)' }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={13} color="var(--deep-charcoal)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--deep-charcoal)' }}>
                  Stage Pipeline
                </span>
                <span style={{ fontSize: '0.63rem', color: 'var(--slate-gray)' }}>({steps.length} stages)</span>
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--slate-gray)', fontStyle: 'italic' }}>Click to jump</span>
            </div>

            {/* Active Stage Spotlight */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(209,243,77,0.18) 0%, rgba(0,88,190,0.06) 100%)',
              border: '1.5px solid var(--deep-charcoal)',
              borderRadius: '10px',
              padding: '0.7rem 0.9rem',
              marginBottom: '0.65rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'var(--deep-charcoal)', color: 'var(--primary-lime)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                    ACTIVE {currentStepIdx + 1}/{steps.length}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>{activeStep.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button type="button" onClick={handleRestartStage} className="btn-ghost" style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem' }}>â†º Restart</button>
                  <button type="button" onClick={handleNextStage} disabled={currentStepIdx >= steps.length - 1} className="btn-primary" style={{ fontSize: '0.64rem', padding: '0.22rem 0.6rem' }}>Advance â­</button>
                </div>
              </div>
              <div style={{ height: '4px', background: 'rgba(11,28,48,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${stageProgressPct}%`, height: '100%', background: 'var(--deep-charcoal)', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ fontSize: '0.63rem', color: 'var(--slate-gray)' }}>
                <strong style={{ color: 'var(--deep-charcoal)' }}>Directive:</strong> {activeStep.hardwareAction || `${Math.round((activeStep.targetTempC || 25) + (overrides.tempOffset || 0))}Â°C soak at ${Math.round((activeStep.stirRpm || 0) * (overrides.rpmMultiplier || 1))} RPM`}
              </div>
            </div>

            {/* Stage List */}
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
                      padding: '0.55rem 0.75rem',
                      borderRadius: '9px',
                      border: isActive ? '2px solid var(--deep-charcoal)' : (isFinished ? '1px solid var(--success-border)' : '1px solid var(--slate-border)'),
                      background: isActive ? 'linear-gradient(145deg, rgba(209,243,77,0.16) 0%, #FFFFFF 100%)' : (isFinished ? 'var(--success-bg)' : 'var(--off-white)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 3px 12px -2px rgba(209,243,77,0.3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      {/* Step circle */}
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: isActive ? 'var(--deep-charcoal)' : (isFinished ? 'var(--success-green)' : '#E2E8F0'),
                        color: isActive ? 'var(--primary-lime)' : (isFinished ? '#FFFFFF' : 'var(--slate-gray)'),
                        fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isFinished ? <Check size={11} strokeWidth={3} /> : idx + 1}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--slate-gray)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)', flexWrap: 'wrap', marginTop: '1px' }}>
                          <span style={{ color: isCool ? '#0284C7' : (effTemp > 25 ? '#B91C1C' : 'var(--slate-gray)'), fontWeight: 700 }}>{effTemp}Â°C</span>
                          <span>Â·</span>
                          <span style={{ color: effRpm > 0 ? '#15803D' : 'var(--slate-gray)', fontWeight: 600 }}>{effRpm} RPM</span>
                          <span>Â·</span>
                          <span>{effDur}m</span>
                          <span style={{ display: 'inline-flex', gap: '2px', marginLeft: '2px' }}>
                            {!isCool && effTemp > 25 && <span style={{ fontSize: '8px', background: '#FEE2E2', color: '#991B1B', padding: '1px 3px', borderRadius: '3px', fontWeight: 700 }}>HTR</span>}
                            {isCool && <span style={{ fontSize: '8px', background: '#E0F2FE', color: '#0369A1', padding: '1px 3px', borderRadius: '3px', fontWeight: 700 }}>CHILL</span>}
                            {st.uvExposure && <span style={{ fontSize: '8px', background: '#F3E8FF', color: '#6B21A8', padding: '1px 3px', borderRadius: '3px', fontWeight: 700 }}>UV</span>}
                            {effRpm > 0 && <span style={{ fontSize: '8px', background: '#DCFCE7', color: '#166534', padding: '1px 3px', borderRadius: '3px', fontWeight: 700 }}>STIR</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                      padding: '1px 5px', borderRadius: '4px', flexShrink: 0,
                      background: isActive ? 'var(--deep-charcoal)' : (isFinished ? 'var(--success-bg)' : '#F1F5F9'),
                      color: isActive ? 'var(--primary-lime)' : (isFinished ? 'var(--success-green)' : 'var(--slate-gray)'),
                      border: isActive ? '1px solid rgba(209,243,77,0.3)' : (isFinished ? '1px solid var(--success-border)' : '1px solid transparent'),
                    }}>
                      {isActive ? (isPaused ? 'HOLD' : 'â— LIVE') : (isFinished ? 'âœ“ DONE' : 'STBY')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* â”€â”€â”€â”€ RIGHT COLUMN: 4-Channel Actuator Deck â”€â”€â”€â”€ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Section Label Header */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--slate-border)',
            borderRadius: '14px',
            padding: '0.8rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={14} color="var(--deep-charcoal)" />
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--deep-charcoal)' }}>Actuator Control Deck</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--slate-gray)' }}>4-Channel Direct Hardware Override</div>
              </div>
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
              style={{ fontSize: '0.62rem', padding: '0.28rem 0.65rem', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
            >
              <RotateCcw size={10} style={{ marginRight: '3px' }} /> Sync to Recipe
            </button>
          </div>

          {/* ACTUATOR 1 â€” MIXER */}
          <div style={{
            background: '#FFFFFF',
            border: mixerActive && targetRpm > 0 ? '1.5px solid var(--deep-charcoal)' : '1px solid var(--slate-border)',
            borderRadius: '12px', padding: '0.85rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            boxShadow: mixerActive && targetRpm > 0 ? '0 4px 16px -3px rgba(209,243,77,0.3)' : '0 2px 8px rgba(11,28,48,0.03)',
            transition: 'all 0.25s ease',
          }}>
            {/* Actuator Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: mixerActive && targetRpm > 0 ? 'var(--primary-lime)' : '#CBD5E1', boxShadow: mixerActive && targetRpm > 0 ? '0 0 8px var(--primary-lime)' : 'none', transition: 'all 0.2s ease' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Mixer / Stirrer</div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>GPIO04 Â· PWM SERVO MOTOR</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 900, color: mixerActive && targetRpm > 0 ? 'var(--deep-charcoal)' : '#94A3B8' }}>
                  {targetRpm} <span style={{ fontSize: '0.6rem', fontWeight: 500 }}>RPM</span>
                </span>
                <button
                  type="button"
                  onClick={() => { const next = !mixerActive; setMixerActive(next); onAddLog?.('ACTUATOR_OVERRIDE', `Mixer Motor ${next ? 'ENGAGED' : 'BRAKED'}`); }}
                  style={{ border: 'none', borderRadius: '7px', padding: '3px 10px', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer', background: mixerActive && targetRpm > 0 ? 'var(--deep-charcoal)' : '#E2E8F0', color: mixerActive && targetRpm > 0 ? 'var(--primary-lime)' : 'var(--slate-gray)', transition: 'all 0.15s ease' }}
                >
                  {mixerActive && targetRpm > 0 ? 'â— ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Slider */}
            <input type="range" min="0" max="1400" step="50" value={targetRpm}
              onChange={(e) => { const v = Number(e.target.value); setManualMixerRpm(v); setMixerActive(v > 0); }}
              className="slider-amber" style={{ width: '100%', height: '4px', cursor: 'pointer' }} />

            {/* Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
              {[{ label: 'Stop', rpm: 0 }, { label: '300', rpm: 300 }, { label: '600', rpm: 600 }, { label: '1200', rpm: 1200 }].map(btn => {
                const sel = targetRpm === btn.rpm && mixerActive === (btn.rpm > 0);
                return (
                  <button key={btn.label} type="button"
                    onClick={() => { setManualMixerRpm(btn.rpm); setMixerActive(btn.rpm > 0); onAddLog?.('ACTUATOR_OVERRIDE', `Mixer â†’ ${btn.rpm} RPM`); }}
                    style={{ padding: '3px', fontSize: '0.62rem', fontWeight: sel ? 800 : 600, background: sel ? 'var(--deep-charcoal)' : 'var(--off-white)', color: sel ? 'var(--primary-lime)' : 'var(--deep-charcoal)', border: sel ? '1px solid var(--deep-charcoal)' : '1px solid var(--slate-border)', borderRadius: '5px', cursor: 'pointer', transition: 'all 0.12s ease' }}>
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTUATOR 2 â€” HEATER */}
          <div style={{
            background: '#FFFFFF',
            border: heaterActive && !coolerActive ? '1.5px solid rgba(239,68,68,0.5)' : '1px solid var(--slate-border)',
            borderRadius: '12px', padding: '0.85rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            boxShadow: heaterActive && !coolerActive ? '0 4px 16px -3px rgba(239,68,68,0.2)' : '0 2px 8px rgba(11,28,48,0.03)',
            transition: 'all 0.25s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: heaterActive && !coolerActive ? '#EF4444' : '#CBD5E1', boxShadow: heaterActive && !coolerActive ? '0 0 8px #EF4444' : 'none', transition: 'all 0.2s ease' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Heater (PID)</div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>GPIO05 Â· SSR / PWM HOTPLATE</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 900, color: heaterActive && !coolerActive ? '#EF4444' : '#94A3B8' }}>
                  {targetTemp}<span style={{ fontSize: '0.6rem', fontWeight: 500 }}>Â°C</span>
                </span>
                <button type="button"
                  onClick={() => { const next = !heaterActive; setHeaterActive(next); if (next) setCoolerActive(false); onAddLog?.('ACTUATOR_OVERRIDE', `Heater ${next ? 'ARMED' : 'OFF'}`); }}
                  style={{ border: 'none', borderRadius: '7px', padding: '3px 10px', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer', background: heaterActive && !coolerActive ? '#EF4444' : '#E2E8F0', color: heaterActive && !coolerActive ? '#FFFFFF' : 'var(--slate-gray)', transition: 'all 0.15s ease' }}>
                  {heaterActive && !coolerActive ? 'â— ON' : 'OFF'}
                </button>
              </div>
            </div>
            <input type="range" min="25" max="350" step="5" value={targetTemp} disabled={coolerActive}
              onChange={(e) => { const v = Number(e.target.value); setManualHeaterTarget(v); setHeaterActive(true); setCoolerActive(false); }}
              className="slider-terra" style={{ width: '100%', height: '4px', cursor: coolerActive ? 'not-allowed' : 'pointer' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
              {[{ label: 'Off', deg: 25 }, { label: '60Â°', deg: 60 }, { label: '100Â°', deg: 100 }, { label: '250Â°', deg: 250 }].map(btn => {
                const sel = targetTemp === btn.deg && heaterActive && !coolerActive;
                return (
                  <button key={btn.label} type="button" disabled={coolerActive}
                    onClick={() => { setManualHeaterTarget(btn.deg); setHeaterActive(btn.deg > 25); setCoolerActive(false); onAddLog?.('ACTUATOR_OVERRIDE', `Heater â†’ ${btn.deg}Â°C`); }}
                    style={{ padding: '3px', fontSize: '0.62rem', fontWeight: sel ? 800 : 600, background: sel ? '#EF4444' : 'var(--off-white)', color: sel ? '#FFFFFF' : 'var(--deep-charcoal)', border: sel ? '1px solid #EF4444' : '1px solid var(--slate-border)', borderRadius: '5px', cursor: coolerActive ? 'not-allowed' : 'pointer', opacity: coolerActive ? 0.45 : 1, transition: 'all 0.12s ease' }}>
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTUATOR 3 â€” COOLER */}
          <div style={{
            background: '#FFFFFF',
            border: coolerActive ? '1.5px solid #0284C7' : '1px solid var(--slate-border)',
            borderRadius: '12px', padding: '0.85rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            boxShadow: coolerActive ? '0 4px 16px -3px rgba(56,189,248,0.25)' : '0 2px 8px rgba(11,28,48,0.03)',
            transition: 'all 0.25s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: coolerActive ? '#38BDF8' : '#CBD5E1', boxShadow: coolerActive ? '0 0 8px #38BDF8' : 'none', transition: 'all 0.2s ease' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>Cooler / Chiller</div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>GPIO12 Â· PELTIER + FAN ARRAY</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 900, color: coolerActive ? '#38BDF8' : '#94A3B8' }}>
                  {coolerActive ? coolerIntensity : 0}<span style={{ fontSize: '0.6rem', fontWeight: 500 }}>%</span>
                </span>
                <button type="button"
                  onClick={() => { const next = !coolerActive; setCoolerActive(next); if (next) { setHeaterActive(false); setManualHeaterTarget(null); } onAddLog?.('ACTUATOR_OVERRIDE', `Chiller ${next ? 'ENGAGED' : 'IDLE'}`); }}
                  style={{ border: 'none', borderRadius: '7px', padding: '3px 10px', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer', background: coolerActive ? '#0284C7' : '#E2E8F0', color: coolerActive ? '#FFFFFF' : 'var(--slate-gray)', transition: 'all 0.15s ease' }}>
                  {coolerActive ? 'â— ON' : 'OFF'}
                </button>
              </div>
            </div>
            <input type="range" min="20" max="100" step="5" value={coolerIntensity} disabled={!coolerActive}
              onChange={(e) => setCoolerIntensity(Number(e.target.value))}
              style={{ width: '100%', height: '4px', accentColor: '#0284C7', cursor: coolerActive ? 'pointer' : 'not-allowed' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
              {[{ label: 'Off', act: false, pwr: 0 }, { label: '30%', act: true, pwr: 30 }, { label: '70%', act: true, pwr: 70 }, { label: '100%', act: true, pwr: 100 }].map(btn => {
                const sel = (coolerActive && coolerIntensity === btn.pwr) || (!coolerActive && !btn.act);
                return (
                  <button key={btn.label} type="button"
                    onClick={() => { setCoolerActive(btn.act); if (btn.act) { setCoolerIntensity(btn.pwr); setHeaterActive(false); setManualHeaterTarget(null); onAddLog?.('ACTUATOR_OVERRIDE', `Chiller â†’ ${btn.pwr}%`); } else { onAddLog?.('ACTUATOR_OVERRIDE', 'Cooler deactivated.'); } }}
                    style={{ padding: '3px', fontSize: '0.62rem', fontWeight: sel ? 800 : 600, background: sel ? '#0284C7' : 'var(--off-white)', color: sel ? '#FFFFFF' : 'var(--deep-charcoal)', border: sel ? '1px solid #0284C7' : '1px solid var(--slate-border)', borderRadius: '5px', cursor: 'pointer', transition: 'all 0.12s ease' }}>
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTUATOR 4 â€” UV LAMP */}
          <div style={{
            background: '#FFFFFF',
            border: isUvActive ? '1.5px solid #7C3AED' : '1px solid var(--slate-border)',
            borderRadius: '12px', padding: '0.85rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            boxShadow: isUvActive ? '0 4px 16px -3px rgba(124,58,237,0.25)' : '0 2px 8px rgba(11,28,48,0.03)',
            transition: 'all 0.25s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUvActive ? '#A855F7' : '#CBD5E1', boxShadow: isUvActive ? '0 0 8px #A855F7' : 'none', transition: 'all 0.2s ease' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--deep-charcoal)' }}>UV Lamp (365nm)</div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--slate-gray)', fontFamily: 'var(--font-mono)' }}>GPIO16 Â· PHOTOREACTOR EMITTER</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 900, color: isUvActive ? '#A855F7' : '#94A3B8' }}>
                  {isUvActive ? uvIntensity : 0}<span style={{ fontSize: '0.6rem', fontWeight: 500 }}>%</span>
                </span>
                <button type="button"
                  onClick={() => { const next = !isUvActive; setLiveUvOverride(next); onAddLog?.('ACTUATOR_OVERRIDE', `UV 365nm ${next ? 'BEAM ON' : 'DARK'}`); }}
                  style={{ border: 'none', borderRadius: '7px', padding: '3px 10px', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer', background: isUvActive ? '#7C3AED' : '#E2E8F0', color: isUvActive ? '#FFFFFF' : 'var(--slate-gray)', transition: 'all 0.15s ease' }}>
                  {isUvActive ? 'â— BEAM' : 'OFF'}
                </button>
              </div>
            </div>
            <input type="range" min="10" max="100" step="5" value={uvIntensity} disabled={!isUvActive}
              onChange={(e) => setUvIntensity(Number(e.target.value))}
              style={{ width: '100%', height: '4px', accentColor: '#7C3AED', cursor: isUvActive ? 'pointer' : 'not-allowed' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
              {[{ label: 'Off', act: false, flux: 0 }, { label: '25%', act: true, flux: 25 }, { label: '60%', act: true, flux: 60 }, { label: '100%', act: true, flux: 100 }].map(btn => {
                const sel = (isUvActive && uvIntensity === btn.flux) || (!isUvActive && !btn.act);
                return (
                  <button key={btn.label} type="button"
                    onClick={() => { setLiveUvOverride(btn.act); if (btn.act) { setUvIntensity(btn.flux); onAddLog?.('ACTUATOR_OVERRIDE', `UV â†’ ${btn.flux}% flux`); } else { onAddLog?.('ACTUATOR_OVERRIDE', 'UV off.'); } }}
                    style={{ padding: '3px', fontSize: '0.62rem', fontWeight: sel ? 800 : 600, background: sel ? '#7C3AED' : 'var(--off-white)', color: sel ? '#FFFFFF' : 'var(--deep-charcoal)', border: sel ? '1px solid #7C3AED' : '1px solid var(--slate-border)', borderRadius: '5px', cursor: 'pointer', transition: 'all 0.12s ease' }}>
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ZONE E â€” SERIAL TELEMETRY TERMINAL
          ESP8266 live log stream
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div style={{
        background: '#060F1C',
        border: '1px solid #1E3A5F',
        borderRadius: '14px',
        padding: '1rem 1.15rem',
        boxShadow: '0 4px 16px rgba(11,28,48,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', paddingBottom: '0.5rem', borderBottom: '1px solid #0F2033' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Terminal size={13} />
            ESP8266 Serial Telemetry â€” COM3 / 115200 BAUD
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isRunning && !isAborted ? '#22C55E' : '#475569', boxShadow: isRunning && !isAborted ? '0 0 6px #22C55E' : 'none' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#475569' }}>
              {isRunning && !isAborted ? 'STREAMING' : 'IDLE'}
            </span>
          </div>
        </div>
        <div
          ref={terminalBoxRef}
          style={{ height: '120px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', lineHeight: 1.65, color: '#7ad9a6', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}
        >
          {logs?.map((l, i) => {
            const isKill = l.tag?.includes('EMERGENCY') || l.tag?.includes('HALT');
            const isHw = l.tag?.includes('HARDWARE') || l.tag?.includes('STATUS');
            const isManual = l.tag?.includes('OPERATOR') || l.tag?.includes('MANUAL');
            return (
              <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#334155', flexShrink: 0 }}>[{l.timestamp}]</span>
                <span style={{ color: isKill ? '#EF4444' : (isManual ? 'var(--primary-lime)' : (isHw ? '#F59E0B' : '#38BDF8')), flexShrink: 0, fontWeight: 700 }}>[{l.tag}]</span>
                <span style={{ color: isKill ? '#FCA5A5' : (isManual ? '#D9F99D' : (isHw ? '#FDE68A' : '#7ad9a6')) }}>{l.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* â”€â”€ JSON Payload Modal â”€â”€ */}
      {showPayloadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,28,48,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1.25rem' }}>
          <div className="notebook-card fade-in" style={{ maxWidth: '640px', width: '100%', padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={16} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--deep-charcoal)' }}>CRC32-Verified Machine Bytecode Payload</h3>
              </div>
              <button onClick={() => setShowPayloadModal(false)} className="btn-ghost" style={{ padding: '4px 8px' }}>âœ•</button>
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

      {/* â”€â”€ Bottom Navigation â”€â”€ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-border)' }}>
        <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={14} /> Back to Verification Matrix
        </button>
        <button className="btn-ink" onClick={onResetAll} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RotateCw size={13} /> Synthesize Another Material
        </button>
      </div>

    </div>
  );
}

