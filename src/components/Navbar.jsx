import React from 'react';
import { FlaskConical, Cpu, ShieldCheck, Radio, Sparkles, BookOpen } from 'lucide-react';

export default function Navbar({ onOpenDocs }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(8, 11, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(79, 172, 254, 0.1) 100%)',
            border: '1px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)'
          }}>
            <FlaskConical size={22} color="#00f2fe" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#fff' }}>
                AutoLab <span style={{ color: 'var(--accent-cyan)' }}>OS</span>
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                OSI Hackathon '26
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Literature-to-Hardware Autonomous Synthesis Engine
            </p>
          </div>
        </div>

        {/* Telemetry Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="badge badge-emerald">
            <span className="pulse-dot"></span>
            Valency MCP: Online (44.5M Papers)
          </div>

          <div className="badge badge-cyan">
            <Radio size={12} />
            Hardware Node: ESP8266 Ready
          </div>

          <div className="badge badge-amber">
            <ShieldCheck size={12} />
            Safety Interlocks: Active
          </div>

          {onOpenDocs && (
            <button
              onClick={onOpenDocs}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="View Architecture Documentation"
            >
              <BookOpen size={14} />
              Architecture
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
