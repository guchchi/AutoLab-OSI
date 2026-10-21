import React from 'react';
import { FlaskConical, Search, Bell, Settings, Radio, ShieldCheck, Database, BookOpen } from 'lucide-react';

export default function FinnovaHeader({ activeTab, setActiveTab, onOpenDocs }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'literature', label: 'Literature' },
    { id: 'kinetics', label: 'Kinetics' },
    { id: 'twin', label: 'Digital Twin' },
    { id: 'hardware', label: 'ESP8266 IoT' }
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      background: '#ffffff',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-card)',
      boxShadow: 'var(--shadow-card)',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* Brand Logo & Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(67, 56, 202, 0.3)'
        }}>
          <FlaskConical size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.02em' }}>
              AUTOLAB <span style={{ color: 'var(--primary-light)' }}>OS</span>
            </h1>
            <span style={{
              background: '#e0e7ff',
              color: '#3730a3',
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-mono)'
            }}>
              OSI '26
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Autonomous Literature-to-Hardware Execution
          </p>
        </div>
      </div>

      {/* Floating Center Dark Pill Nav (Finnova Style) */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        background: '#0d1322',
        padding: '5px 8px',
        borderRadius: 'var(--radius-pill)',
        gap: '4px',
        boxShadow: '0 4px 16px rgba(13, 19, 34, 0.25)'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-heading)'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right Actions & Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="badge-clean badge-clean-green">
          <span className="pulse-indicator"></span>
          Valency: 44.5M Papers
        </div>

        <div className="badge-clean badge-clean-blue">
          <Radio size={12} />
          ESP8266: Ready
        </div>

        <button
          onClick={onOpenDocs}
          className="btn-pill-subtle"
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          title="Architecture Documentation"
        >
          <BookOpen size={13} color="var(--primary)" />
          Docs
        </button>

        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.8rem',
          color: '#334155',
          border: '2px solid #ffffff',
          boxShadow: 'var(--shadow-sm)'
        }}>
          OSI
        </div>
      </div>
    </header>
  );
}
