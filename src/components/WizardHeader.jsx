import React from 'react';
import { BookOpen, Check, Radio, Layers } from 'lucide-react';
import AutoLabLogo from './AutoLabLogo';

export default function WizardHeader({ currentStep, setCurrentStep, onOpenDocs, onOpenConnectLab }) {
  const steps = [
    { num: 1, label: 'Overview' },
    { num: 2, label: 'Literature Query' },
    { num: 3, label: 'Verify Kinetics' },
    { num: 4, label: 'Lab Execution' },
  ];

  return (
    <header style={{ marginBottom: '1.5rem' }}>
      {/* ── Branding Navbar (Matching Brand Kit) ── */}
      <div
        className="notebook-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.875rem 1.5rem',
          marginBottom: '0.75rem',
          background: 'var(--pure-white)',
          border: '1px solid var(--slate-border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Brand logo & identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AutoLabLogo size={36} showTagline={true} />
          <span className="lab-badge lab-badge-lime" style={{ fontSize: '0.62rem', letterSpacing: '0.04em' }}>
            OSI '26
          </span>
        </div>

        {/* Status Indicators & Docs Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Connect Lab / ESP Hardware Button */}
          <button
            onClick={onOpenConnectLab}
            className="lab-badge lab-badge-lime"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              border: 'none',
              padding: '0.35rem 0.75rem',
              fontWeight: 700
            }}
            title="Configure ESP8266/ESP32 & Lab Server Gateway"
          >
            <span className="pulse-indicator" />
            🔌 Connect Lab / ESP
          </button>

          {/* Valency Status */}
          <span className="lab-badge lab-badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="pulse-indicator" />
            Valency MCP Connected
          </span>

          {/* Architecture Documentation button */}
          <button
            className="btn-ghost"
            onClick={onOpenDocs}
            style={{
              fontSize: '0.78rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <BookOpen size={13} color="var(--deep-charcoal)" />
            Architecture
          </button>
        </div>
      </div>

      {/* ── Step Wizard Bar ── */}
      <nav
        className="notebook-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.4rem 0.75rem',
          overflowX: 'auto',
          background: 'var(--pure-white)',
          border: '1px solid var(--slate-border)',
          borderRadius: 'var(--radius-full)',
        }}
      >
        {steps.map((st, idx) => {
          const isActive = currentStep === st.num;
          const isDone = currentStep > st.num;

          return (
            <React.Fragment key={st.num}>
              <button
                type="button"
                onClick={() => setCurrentStep(st.num)}
                className={`stepper-chip ${isActive ? 'active' : isDone ? 'done' : ''}`}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                }}
              >
                <span className="stepper-num" style={{ width: '22px', height: '22px' }}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : st.num}
                </span>
                <span>{st.label}</span>
              </button>

              {idx < steps.length - 1 && (
                <span
                  style={{
                    flex: 1,
                    height: '1px',
                    minWidth: '20px',
                    background: isDone
                      ? 'var(--success-green)'
                      : 'var(--slate-border)',
                    transition: 'background 0.3s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </header>
  );
}
