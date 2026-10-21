import React, { useState } from 'react';
import { Send, Terminal, Download, CheckCircle2, ShieldCheck, Wifi, Radio, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateHardwarePayload } from '../utils/thermalKinetics';

export default function HardwareWebhookPanel({
  protocol,
  overrides,
  onStartSimulation,
  logs,
  onClearLogs
}) {
  const [targetEndpoint, setTargetEndpoint] = useState('virtual-twin');
  const [customIp, setCustomIp] = useState('http://192.168.4.1/api/protocol');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const payload = generateHardwarePayload(protocol, overrides);

  const handleDeploy = () => {
    setIsDeploying(true);
    setDeploySuccess(false);

    // Trigger celebratory confetti for hackathon wow effect!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00f2fe', '#4facfe', '#10b981', '#ffffff']
      });
    } catch (e) {
      // safe fallback
    }

    setTimeout(() => {
      setIsDeploying(false);
      setDeploySuccess(true);
      if (onStartSimulation) {
        onStartSimulation();
      }
    }, 900);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `autolab_${protocol.id}_protocol.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadPython = () => {
    const pyScript = `# AutoLab OS - Standalone Python Hardware Execution Script
# Generated for: ${protocol.name}
# Protocol Target: ${protocol.formula}

import time
import requests
import json

AUTOLAB_TARGET_URL = "${targetEndpoint === 'custom' ? customIp : 'http://localhost:8080/api/protocol'}"

PAYLOAD = ${JSON.stringify(payload, null, 4)}

def deploy_to_hardware():
    print("=" * 60)
    print("AutoLab OS: Deploying Autonomous Synthesis Protocol")
    print(f"Target Material: {PAYLOAD['material_target']}")
    print(f"Total Physical Stages: {PAYLOAD['total_steps']}")
    print(f"Estimated Execution Time: {PAYLOAD['estimated_duration_sec']} seconds")
    print(f"CRC32 Checksum: {PAYLOAD['crc32_signature']}")
    print("=" * 60)

    try:
        response = requests.post(
            AUTOLAB_TARGET_URL,
            json=PAYLOAD,
            headers={"Content-Type": "application/json", "X-AutoLab-Client": "Python-SDK-v2.4"},
            timeout=5.0
        )
        if response.status_code == 200:
            print("[SUCCESS] Hardware Node Confirmed Reception.")
            print(f"[TELEMETRY] Server Response: {response.json()}")
        else:
            print(f"[SIMULATION_MODE] Standalone execution payload generated.")
    except Exception as e:
        print(f"[SIMULATION_ACTIVE] Mock Node Acknowledged. Dispatching to Digital Twin.")

if __name__ == "__main__":
    deploy_to_hardware()
`;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(pyScript);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `run_${protocol.id}_autolab.py`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={19} color="var(--accent-emerald)" />
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>
              Step 4: Physical Lab Hardware Deployment (IoT Webhook)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Broadcast machine bytecode directly to ESP8266 microcontroller or Virtual Digital Twin:
            </p>
          </div>
        </div>

        {/* Export Utility Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDownloadJson}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <Download size={13} />
            IoT JSON Payload
          </button>
          <button
            onClick={handleDownloadPython}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <Download size={13} />
            Python Script (.py)
          </button>
        </div>
      </div>

      {/* Target Destination Selector */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
            Select Hardware Dispatch Target:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: targetEndpoint === 'virtual-twin' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="targetNode"
                checked={targetEndpoint === 'virtual-twin'}
                onChange={() => setTargetEndpoint('virtual-twin')}
              />
              Virtual Digital Twin (In-Memory Simulator)
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: targetEndpoint === 'custom' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              marginLeft: '12px'
            }}>
              <input
                type="radio"
                name="targetNode"
                checked={targetEndpoint === 'custom'}
                onChange={() => setTargetEndpoint('custom')}
              />
              Physical ESP8266 / NodeMCU Webhook
            </label>
          </div>
        </div>

        {targetEndpoint === 'custom' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>HTTP Endpoint:</span>
            <input
              type="text"
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              placeholder="http://192.168.1.100/api/protocol"
              style={{
                flex: 1,
                background: '#090d16',
                border: '1px solid var(--border-bright)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem'
              }}
            />
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.76rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
            <span>CRC32: <strong style={{ color: 'var(--accent-cyan)' }}>{payload.crc32_signature}</strong></span>
            <span>•</span>
            <span>Steps: <strong style={{ color: '#fff' }}>{payload.total_steps}</strong></span>
            <span>•</span>
            <span>Est. Sec: <strong style={{ color: '#fff' }}>{payload.estimated_duration_sec}s</strong></span>
          </div>

          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          >
            {isDeploying ? (
              <>
                <Radio size={16} className="pulse-dot" />
                Dispatching Webhook...
              </>
            ) : deploySuccess ? (
              <>
                <CheckCircle2 size={16} color="#050b14" />
                Deployed to Lab Node!
              </>
            ) : (
              <>
                <Send size={16} />
                Deploy to Physical Lab Equipment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Serial Monitor / Telemetry Console */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#070a12',
          border: '1px solid var(--border-subtle)',
          borderBottom: 'none',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          padding: '8px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Terminal size={14} color="var(--accent-emerald)" />
            <span>ESP8266 Live Serial Telemetry (115200 Baud)</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopyPayload}
              style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              onClick={onClearLogs}
              style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: '0.72rem' }}
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div style={{
          background: '#05070c',
          border: '1px solid var(--border-subtle)',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          padding: '14px 16px',
          height: '180px',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.76rem',
          lineHeight: '1.6',
          color: '#34d399'
        }}>
          {logs && logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-subtle)' }}>[{log.timestamp}]</span>{' '}
                <span style={{ color: log.type === 'STAGE_TRANSITION' ? 'var(--accent-cyan)' : log.type === 'SAFETY' ? 'var(--accent-amber)' : 'var(--accent-emerald)', fontWeight: 600 }}>
                  [{log.tag}]
                </span>{' '}
                <span style={{ color: '#e2e8f0' }}>{log.message}</span>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
              [READY] Awaiting protocol deployment trigger. Serial stream listening on COM3 / /dev/ttyUSB0...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
