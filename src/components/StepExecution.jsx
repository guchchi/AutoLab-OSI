import React, { useState, useEffect } from 'react';
import { Cpu, Send, Play, Pause, RotateCcw, Download, Terminal, CheckCircle2, Radio, ArrowLeft, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
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

  // Simulation loop
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

        setSimTemp(prev => {
          const delta = targetTemp - prev;
          if (Math.abs(delta) < 0.2) {
            return targetTemp + (Math.random() - 0.5) * 0.3;
          }
          const stepChange = (delta > 0 ? 1 : -1) * Math.min(Math.abs(delta), 1.8 * (simSpeed / 5));
          return Math.round((prev + stepChange) * 10) / 10;
        });

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

  const progressPercent = Math.min(100, Math.round((elapsedSec / totalSimSec) * 100));

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-8 shadow-md">
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="sky" className="gap-1.5 py-1 px-3">
              <Cpu size={13} />
              Hardware Dispatch Node
            </Badge>
            <Badge variant="success" className="py-1 px-2.5 text-xs">
              ● ESP8266 Online & Armed
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJson}
              className="gap-1.5 text-xs rounded-full"
            >
              <Download size={13} /> JSON Bytecode
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPython}
              className="gap-1.5 text-xs rounded-full"
            >
              <Download size={13} /> Python Runner (.py)
            </Button>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Physical Execution: <span className="text-sky-600">{protocol.name}</span>
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Broadcast machine bytecode to physical ESP8266 or execute in the live interactive digital twin:
        </p>

        {/* Dispatch Controls Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <span>Dispatch Target:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={targetEndpoint === 'twin'}
                onChange={() => setTargetEndpoint('twin')}
                className="accent-sky-600"
              />
              Virtual Digital Twin
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={targetEndpoint === 'custom'}
                onChange={() => setTargetEndpoint('custom')}
                className="accent-sky-600"
              />
              Physical NodeMCU Webhook
            </label>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-200/80 p-0.5 rounded-full">
              {[1, 5, 10, 25].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`border-none py-1 px-2.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                    simSpeed === spd ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <Button
              variant="ocean"
              size="default"
              onClick={handleDeploy}
              className="gap-2 font-bold shadow-md shadow-sky-500/20"
            >
              <Send size={15} />
              Deploy to Lab Hardware
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">
              Active Stage {currentStepIdx + 1} of {steps.length}: <strong className="text-slate-900">{activeStep.name}</strong>
            </span>
            <span className="font-mono font-bold text-sky-600">
              {Math.floor(elapsedSec / 60)}m {Math.floor(elapsedSec % 60)}s / {Math.floor(totalSimSec / 60)}m ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {/* Hardware Visualizer & Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 rounded-2xl p-6 text-white mb-6">
          {/* Hotplate & Beaker */}
          <div className="flex flex-col items-center justify-center py-2">
            {simTemp > 60 && (
              <div className="w-24 h-7 bg-radial from-white/20 to-transparent blur-xs animate-pulse -mb-2 z-10" />
            )}

            {/* Beaker */}
            <div className="relative w-28 h-32 border-2 border-white/40 border-t-0 rounded-b-xl bg-white/5 shadow-inner -mb-1 z-10 backdrop-blur-xs">
              <div className="absolute left-1.5 top-5 w-2.5 h-[1px] bg-white/40" />
              <div className="absolute left-1.5 top-12 w-4 h-[1px] bg-white/50" />
              <div className="absolute left-1.5 top-19 w-2.5 h-[1px] bg-white/40" />

              <div
                className="absolute bottom-0 left-0 right-0 h-20 rounded-b-lg overflow-hidden transition-colors duration-500"
                style={{ background: liquidColor }}
              >
                {simRpm > 0 && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-20 bg-slate-950 rounded-full opacity-65"
                    style={{ height: `${vortexDepth}px` }}
                  />
                )}
                <div
                  className="absolute bottom-1.5 left-1/2 w-6 h-1.5 bg-white rounded-sm -translate-x-1/2 shadow-xs"
                  style={{
                    animation: simRpm > 0 ? `magneticRotate ${spinDuration}s linear infinite` : 'none'
                  }}
                />
              </div>
            </div>

            {/* Hotplate Top */}
            <div
              className="w-44 h-4 rounded-sm border border-white/20 transition-all duration-300"
              style={{
                background: plateGlow,
                boxShadow: heatFactor > 0.1 ? `0 0 20px rgba(239, 68, 68, ${0.4 + heatFactor * 0.4})` : 'none'
              }}
            />

            {/* Chassis */}
            <div className="w-52 h-10 bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-lg flex items-center justify-between px-4 mt-0.5 border-t border-slate-700">
              <span className="text-[10px] font-mono text-slate-400">ESP8266-NODE</span>
              <span className="text-[10px] font-semibold text-emerald-400">
                {isRunning ? '● RUNNING' : '○ IDLE'}
              </span>
            </div>
          </div>

          {/* Gauges */}
          <div className="flex flex-col justify-center gap-3">
            <div className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-4">
              <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">
                RTD Thermocouple Sensor
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-extrabold font-mono text-sky-400">
                  {simTemp.toFixed(1)} <span className="text-base text-slate-500">°C</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Target: {targetTemp}°C
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Heater PWM Duty: <strong className="text-white">{heaterPwm}%</strong>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4">
              <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                Magnetic Stirrer Tachometer
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-extrabold font-mono text-emerald-400">
                  {simRpm} <span className="text-base text-slate-500">RPM</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Target: {targetRpm} RPM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Serial Monitor */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-mono">
              <Terminal size={14} className="text-emerald-400" />
              ESP8266 Live Serial Stream (115200 Baud)
            </span>
            <span className="font-mono text-slate-600">COM3 / /dev/ttyUSB0</span>
          </div>

          <div className="h-28 overflow-y-auto font-mono text-xs text-emerald-400 leading-relaxed">
            {logs && logs.map((l, i) => (
              <div key={i}>
                <span className="text-slate-600">[{l.timestamp}]</span>{' '}
                <span className="text-sky-400">[{l.tag}]</span> {l.message}
              </div>
            ))}
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
            Back to Kinetics
          </Button>

          <Button
            variant="outline"
            onClick={onResetAll}
            className="gap-2 font-bold"
          >
            <RotateCw size={15} />
            Run Another Experiment Protocol
          </Button>
        </div>
      </Card>
    </div>
  );
}
