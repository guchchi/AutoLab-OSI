import React from 'react';
import { FlaskConical, BookOpen, Check, Radio, Database } from 'lucide-react';

export default function WizardHeader({
  currentStep,
  setCurrentStep,
  onOpenDocs
}) {
  const steps = [
    { num: 1, label: 'Overview' },
    { num: 2, label: 'Literature Query' },
    { num: 3, label: 'Verify Kinetics' },
    { num: 4, label: 'Lab Execution' }
  ];

  return (
    <header style={{ marginBottom: '20px' }}>
      {/* Top Branding Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '12px 20px',
        background: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '14px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            <FlaskConical size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                AUTOLAB <span style={{ color: 'var(--primary)' }}>OS</span>
              </h1>
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-pill)',
                fontFamily: 'var(--font-mono)'
              }}>
                OSI '26
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Autonomous Literature-to-Hardware Execution Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Docs Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="badge-clean badge-clean-green">
            <span className="pulse-indicator"></span>
            Valency MCP: Online (44.5M)
          </div>

          <div className="badge-clean badge-clean-blue">
            <Radio size={12} />
            ESP8266 Node: Ready
          </div>

          <button
            onClick={onOpenDocs}
            className="btn-subtle"
            style={{ padding: '6px 14px', fontSize: '0.76rem' }}
          >
            <BookOpen size={13} color="var(--primary)" />
            Architecture
          </button>
        </div>
      </div>

      {/* Stepper Wizard Bar */}
      <nav className="stepper-nav">
        {steps.map((st) => {
          const isActive = currentStep === st.num;
          const isCompleted = currentStep > st.num;

          return (
            <button
              key={st.num}
              onClick={() => setCurrentStep(st.num)}
              className={`step-item ${isActive ? 'step-item-active' : ''} ${isCompleted ? 'step-item-completed' : ''}`}
            >
              <div className="step-num">
                {isCompleted ? <Check size={14} /> : st.num}
              </div>
              <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                {st.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
