import React from 'react';
import { ArrowRight, BookOpen, Layers, Cpu, ShieldCheck, Zap, Database, CheckCircle2 } from 'lucide-react';

export default function StepIntro({ onStart }) {
  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Hero Welcome Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-card)',
        padding: '48px 40px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '28px'
      }}>
        {/* Soft Background Radial Gradient */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '20px' }}>
          <span className="pulse-indicator"></span>
          4th Annual Open Scientific Intelligence Hackathon
        </div>

        <h1 style={{ fontSize: '2.5rem', color: '#0f172a', fontWeight: 800, lineHeight: '1.2', marginBottom: '16px', letterSpacing: '-0.03em' }}>
          Autonomous Literature-to-Hardware <br />
          <span style={{ color: 'var(--primary)' }}>Materials Execution Engine</span>
        </h1>

        <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: '1.6', maxWidth: '780px', marginBottom: '32px' }}>
          While generative AI has accelerated computational material discovery, the execution bottleneck remains entirely manual. 
          AutoLab OS bridges the gap between scientific papers and physical laboratory hardware in <strong>10 seconds</strong>.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onStart}
            className="btn-primary-ocean"
            style={{ fontSize: '1rem', padding: '14px 32px' }}
          >
            Start Experiment Protocol
            <ArrowRight size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#059669" /> Valency MCP Connected
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#059669" /> ESP8266 IoT Ready
            </span>
          </div>
        </div>
      </div>

      {/* 3-Step Guided Architecture Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Step 1 */}
        <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#e0f2fe',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              <Database size={22} color="var(--primary)" />
            </div>

            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Step 1: Retrieve & Extract
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '8px' }}>
              Valency Literature Gateway
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.5' }}>
              Input any target material or research paper. AutoLab queries 44.5M articles via Valency MCP, extracting physical parameters: Temperature, RPM, Dwell, and Reagents.
            </p>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
            ⚡ 44.5M Peer-Reviewed Papers
          </div>
        </div>

        {/* Step 2 */}
        <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              <Layers size={22} color="#059669" />
            </div>

            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Step 2: Verify & Calibrate
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '8px' }}>
              Reactive Kinetics Engine
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.5' }}>
              Instead of blindly executing AI outputs, data feeds into interactive thermal curves T(t) and kinetic stirring profiles. Validates safety ceilings to prevent boiling or thermal shock.
            </p>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
            🛡️ Interlock Thermal Ceilings
          </div>
        </div>

        {/* Step 3 */}
        <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#f0fdfa',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              <Cpu size={22} color="#0d9488" />
            </div>

            <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Step 3: Deploy & Actuate
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '8px' }}>
              Physical Lab Execution
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.5' }}>
              With one click, AutoLab broadcasts CRC32-verified JSON bytecode via REST webhook to an ESP8266 microcontroller, driving PWM ceramic heaters and magnetic stirrers in real time.
            </p>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#0d9488', fontWeight: 600 }}>
            ⚙️ Real NodeMCU + Digital Twin
          </div>
        </div>
      </div>
    </div>
  );
}
