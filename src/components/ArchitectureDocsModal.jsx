import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Cpu, Database, CheckCircle2 } from 'lucide-react';

export default function ArchitectureDocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '840px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        border: '1px solid var(--border-bright)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan">AutoLab OS Architecture</span>
              <span className="badge badge-emerald">4th Annual OSI Hackathon</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>
              Bridging Scientific Literature to Physical Lab Execution
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Section 1: The Bottleneck */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
            🚨 The Real-World Scientific Bottleneck
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            While generative AI has accelerated material discovery in silico, the execution bottleneck remains 100% manual. Scientists spend 3 to 7 days reading literature, extracting synthesis steps, programming microcontrollers, or hand-configuring hotplates and stirrers. AutoLab OS compresses this 3-day manual setup into a verified 10-second autonomous pipeline.
          </p>
        </div>

        {/* Section 2: The 3-Step Engine */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
            ⚡ The 3-Step Engine Architecture
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
                <Database size={15} /> 1. Retrieve & Extract
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Queries 44.5M scientific papers via Valency MCP + Google LLM to isolate exact physical parameters: Temperature, Agitation (RPM), Dwell Timers, and Precursors.
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
                <Layers size={15} /> 2. Verify & Visualize
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Pushes discrete steps into reactive thermodynamic and kinetic curves (Marimo-backed). Validates safety ceilings to prevent boiling, thermal shock, or runaways.
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}>
                <Cpu size={15} /> 3. Physical Execution
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Dispatches CRC32-verified JSON bytecode via HTTP webhook to physical ESP8266 NodeMCU microcontrollers, driving PWM heaters and stepper stirrers in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Safety Envelope */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-amber)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} /> Autonomous Safety Envelope Protection
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Unlike open-loop chatbots, AutoLab OS features hardware-level interlocks. Any proposed recipe that exceeds the maximum thermal threshold (e.g. 900°C for ceramic or solvent flashpoints) or exceeds safe thermal ramp rates trips the safety interlock and requires explicit researcher override before firing webhooks.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            Return to Operating System
          </button>
        </div>
      </div>
    </div>
  );
}
