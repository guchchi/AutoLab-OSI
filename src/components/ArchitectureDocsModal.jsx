import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Cpu, Database } from 'lucide-react';

export default function ArchitectureDocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(11, 28, 48, 0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1.25rem',
    }}>
      <div
        className="notebook-card fade-in"
        style={{ maxWidth: '760px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.125rem', right: '1.125rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-gray)', padding: '4px' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="lab-badge lab-badge-lime">AutoLab OS Architecture</span>
            <span className="lab-badge lab-badge-sage">4th Annual OSI Hackathon</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--deep-charcoal)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            Bridging Scientific Literature to{' '}
            <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>Physical Lab Execution</span>
          </h2>
        </div>

        {/* Section 1 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--deep-charcoal)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            🚨 The Real-World Scientific Bottleneck
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--slate-gray)', lineHeight: 1.7 }}>
            While generative AI has accelerated material discovery in silico, the execution bottleneck remains
            100% manual. Scientists spend 3–7 days reading literature, extracting synthesis steps, and programming
            microcontrollers. AutoLab OS compresses this into a verified{' '}
            <strong style={{ color: 'var(--deep-charcoal)' }}>10-second autonomous pipeline</strong>.
          </p>
        </div>

        {/* Section 2 — 3-step grid */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--deep-charcoal)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
            ⚡ The 3-Step Engine Architecture
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '0.75rem' }}>
            {[
              { icon: Database, color: 'var(--accent-blue)', bg: 'var(--light-blue)', border: 'var(--light-blue-border)', label: '1. Retrieve & Extract', desc: 'Queries 44.5M scientific papers via Valency MCP + LLM to isolate exact physical parameters: Temperature, Agitation (RPM), Dwell Timers, and Precursors.' },
              { icon: Layers,   color: 'var(--success-green)',  bg: 'var(--success-bg)',  border: 'var(--success-border)',  label: '2. Verify & Visualize', desc: 'Pushes discrete steps into reactive thermodynamic and kinetic curves. Validates safety ceilings to prevent boiling, thermal shock, or runaways.' },
              { icon: Cpu,      color: 'var(--accent-blue)', bg: 'var(--light-blue)', border: 'var(--light-blue-border)', label: '3. Physical Execution', desc: 'Dispatches CRC32-verified JSON bytecode via HTTP webhook to ESP8266 NodeMCU microcontrollers, driving PWM heaters and stepper stirrers in real time.' },
            ].map(({ icon: Icon, color, bg, border, label, desc }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: 700, color, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Icon size={13} />
                  {label}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--slate-gray)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Safety note */}
        <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <ShieldCheck size={14} />
            Autonomous Safety Envelope Protection
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--slate-gray)', lineHeight: 1.65, margin: 0 }}>
            Unlike open-loop chatbots, AutoLab OS features hardware-level interlocks. Any proposed recipe that
            exceeds the maximum thermal threshold trips the safety interlock and requires explicit researcher
            override before firing webhooks.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--slate-border)' }}>
          <button className="btn-primary" onClick={onClose}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
