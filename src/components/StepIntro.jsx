import React, { useState } from 'react';
import {
  ArrowRight,
  Database,
  Layers,
  Cpu,
  CheckCircle2,
  Sparkles,
  Flame,
  RotateCw,
  Search,
  Sliders,
  ExternalLink,
  Zap,
  Play,
  FlaskConical,
  Radio,
  FileText,
  Brain,
  Wifi,
  ShieldCheck,
  Check
} from 'lucide-react';
import { BENCHMARK_PROTOCOLS } from '../data/benchmarkProtocols';
import AutoLabLogo from './AutoLabLogo';

export default function StepIntro({ onStart, onSelectProtocol }) {
  // Search input state
  const [searchInput, setSearchInput] = useState('');
  
  // Interactive hotplate sandbox
  const [testTemp, setTestTemp] = useState(80);
  const [testRpm, setTestRpm] = useState(600);

  // Dynamic rotation speed calculation
  const spinDuration = testRpm > 0 ? Math.max(0.12, 1200 / testRpm) : 0;

  // Heat glow calculation (25°C to 150°C)
  const heatRatio = Math.min(1, Math.max(0, (testTemp - 25) / 125));
  const glowColor = `rgba(209, 243, 77, ${0.2 + heatRatio * 0.4})`;

  // Handle direct search or chip click
  const handleTriggerSearch = (materialQuery) => {
    const q = (materialQuery || searchInput || 'Graphene').trim();
    const matched = BENCHMARK_PROTOCOLS.find(p => 
      p.name.toLowerCase().includes(q.toLowerCase()) || 
      p.formula.toLowerCase().includes(q.toLowerCase())
    );
    if (matched && onSelectProtocol) {
      onSelectProtocol(matched);
    } else if (onStart) {
      onStart();
    }
  };

  const quickChips = [
    { label: 'Graphene', query: 'Graphene', active: true },
    { label: 'Lithium (LLZO)', query: 'LLZO' },
    { label: 'Silicon', query: 'Silicon' },
    { label: 'Titanium Dioxide', query: 'TiO2' },
    { label: 'CsPbBr3 Perovskite', query: 'Perovskite' },
    { label: 'BiVO4 Catalyst', query: 'BiVO4' },
  ];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      
      {/* ── 1. Hero Section (Matching Brand Kit Layout & Copy) ── */}
      <div
        className="notebook-card"
        style={{
          padding: '2.75rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--pure-white)',
          border: '1px solid var(--slate-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 4px 20px rgba(11, 28, 48, 0.05)',
        }}
      >
        {/* Subtle Brand Geometric Wave Backdrop */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: '380px', height: '380px',
          background: 'radial-gradient(circle, rgba(209, 243, 77, 0.22) 0%, rgba(209, 243, 77, 0.03) 60%, transparent 80%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px' }}>
          
          {/* Top Pill Category Tag */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="lab-badge lab-badge-lime" style={{ fontSize: '0.72rem', padding: '0.25rem 0.75rem' }}>
              <span className="dot-ready" style={{ width: '6px', height: '6px' }} />
              AI + IoT | Autonomous Laboratories
            </span>
            <span className="lab-badge lab-badge-ink" style={{ fontSize: '0.72rem' }}>
              Open Scientific Intelligence '26
            </span>
          </div>

          {/* Primary H1 Headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 4.5vw, 3.25rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: 'var(--deep-charcoal)',
            letterSpacing: '-0.03em',
            margin: '0 0 1rem 0',
          }}>
            From Material to Mechanism — <span style={{ background: 'linear-gradient(135deg, var(--deep-charcoal) 0%, #1E3A5F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Instantly.</span>
          </h1>

          {/* Subheading / Body Copy */}
          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: 'var(--slate-gray)',
            marginBottom: '1.75rem',
            maxWidth: '680px',
          }}>
            AutoLab helps researchers and scientists find detailed process steps for any element or material, and automatically prepares their lab for execution using IoT.
          </p>

          {/* Brand Search Bar (Pill Input with Flask Icon + Circular Arrow Button) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTriggerSearch(searchInput);
            }}
            style={{ maxWidth: '620px', marginBottom: '1rem' }}
          >
            <div className="brand-input-pill">
              <FlaskConical size={18} color="var(--slate-gray)" style={{ marginRight: '0.75rem', flexShrink: 0 }} />
              <input
                type="text"
                className="brand-input-field"
                placeholder="Enter material name (e.g. Graphene, CsPbBr3, LLZO, Silicon)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="brand-submit-circle" title="Search Literature & Synthesize">
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </form>

          {/* Caption & Quick Tags / Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-light)', fontWeight: 500 }}>
              Example:
            </span>
            {quickChips.map((chip, idx) => (
              <button
                key={chip.label}
                type="button"
                className={`brand-chip ${chip.active ? 'active' : ''}`}
                onClick={() => {
                  setSearchInput(chip.query);
                  handleTriggerSearch(chip.query);
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onStart ? onStart() : handleTriggerSearch('Graphene')}
              style={{ fontSize: '0.92rem', padding: '0.75rem 1.75rem' }}
            >
              Get Started
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const el = document.getElementById('autolab-components');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ fontSize: '0.92rem', padding: '0.75rem 1.75rem' }}
            >
              Learn More
            </button>
          </div>

        </div>
      </div>

      {/* ── 2. Cards & Components (Direct from Brand Kit) ── */}
      <div id="autolab-components" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--deep-charcoal)' }}>
              Smarter Research. Automated Labs.
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--slate-gray)', margin: '0.25rem 0 0 0' }}>
              Four core pillars connecting literature intelligence to benchtop robotics
            </p>
          </div>
        </div>

        {/* 2x2 Feature Grid + 1 Dark "Lab Ready" Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          
          {/* Card 1: Smart Research Engine */}
          <div className="notebook-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="brand-icon-circle" style={{ marginBottom: '1rem' }}>
                <FlaskConical size={20} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-charcoal)', marginBottom: '0.5rem' }}>
                Smart Research Engine
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-gray)', lineHeight: 1.55, margin: 0 }}>
                Enter an element or material name, and get accurate, detailed process steps from trusted scientific sources (44.5M Valency papers).
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-border)' }}>
              <button
                type="button"
                onClick={() => onStart && onStart()}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
              >
                Learn More <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 2: AI/Understand */}
          <div className="notebook-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="brand-icon-circle" style={{ marginBottom: '1rem' }}>
                <Brain size={20} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-charcoal)', marginBottom: '0.5rem' }}>
                AI-Powered Understanding
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-gray)', lineHeight: 1.55, margin: 0 }}>
                Translates scientific syntax into precise stoichiometric parameters, kinetic heating curves, and solvent safety envelopes.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-border)' }}>
              <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Kinetic Modeling <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Card 3: Real-Time Monitoring & IoT */}
          <div className="notebook-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="brand-icon-circle" style={{ marginBottom: '1rem' }}>
                <Wifi size={20} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-charcoal)', marginBottom: '0.5rem' }}>
                Real-time Monitoring
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-gray)', lineHeight: 1.55, margin: 0 }}>
                Track temperature, pressure, agitation RPM, and stream live serial telemetry to ESP8266 hotplate hardware.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-border)' }}>
              <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                IoT Protocol Dispatch <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Card 4: Safe & Reliable */}
          <div className="notebook-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="brand-icon-circle" style={{ marginBottom: '1rem' }}>
                <ShieldCheck size={20} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--deep-charcoal)', marginBottom: '0.5rem' }}>
                Safe & Reliable
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-gray)', lineHeight: 1.55, margin: 0 }}>
                Built with scientific validation, thermal interlocks, solvent flashpoint guards, and hardware emergency stop controls.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-border)' }}>
              <span style={{ color: 'var(--success-green)', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Safety Envelope Active <Check size={14} />
              </span>
            </div>
          </div>

        </div>

        {/* ── Brand Kit Feature Component: Dark "Lab Ready" Status Card ── */}
        <div style={{
          background: 'var(--deep-charcoal)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem 2rem',
          color: 'var(--pure-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 8px 24px rgba(11, 28, 48, 0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid var(--success-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Check size={28} color="var(--success-green)" strokeWidth={3} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Lab Ready
                </h3>
                <span className="lab-badge lab-badge-lime" style={{ fontSize: '0.65rem' }}>
                  CONNECTED
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#9CA3AF', margin: 0 }}>
                Equipment configured. Process ready to start. ESP8266 hotplate on COM3 · Valency MCP online.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-lime"
              onClick={() => onStart && onStart()}
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}
            >
              Open Literature Query
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

      </div>

      {/* ── 3. Interactive Hardware Sandbox (ESP8266 Station) ── */}
      <div
        className="notebook-card"
        style={{
          padding: '1.75rem 2rem',
          background: 'var(--pure-white)',
          border: '1px solid var(--slate-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <span className="lab-badge lab-badge-blue" style={{ fontSize: '0.68rem' }}>
                Hardware Digital Twin
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-gray)' }}>
                Slide to test real-time thermal & agitation response
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--deep-charcoal)', margin: 0 }}>
              Benchtop Hardware Station Simulation
            </h3>
          </div>

          <span className="lab-badge lab-badge-sage" style={{ fontSize: '0.68rem' }}>
            <span className="pulse-indicator" />
            ESP8266 Node: Linked
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          
          {/* Sliders Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Temp Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--deep-charcoal)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Flame size={15} color="var(--warning-orange)" />
                  Target Temperature (°C)
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning-orange)' }}>
                  {testTemp} °C
                </span>
              </div>
              <input
                type="range"
                min="25"
                max="150"
                step="5"
                value={testTemp}
                onChange={e => setTestTemp(Number(e.target.value))}
                className="slider-amber"
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                <span>25 °C (Ambient)</span>
                <span>80 °C (Sol-Gel)</span>
                <span>150 °C (Calcination)</span>
              </div>
            </div>

            {/* Stirrer RPM Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--deep-charcoal)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RotateCw size={15} color="var(--success-green)" />
                  Magnetic Stirrer Speed (RPM)
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--success-green)' }}>
                  {testRpm} RPM
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={testRpm}
                onChange={e => setTestRpm(Number(e.target.value))}
                className="slider-sage"
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--slate-gray)', marginTop: '2px' }}>
                <span>0 RPM (Static)</span>
                <span>500 RPM (Vigorous)</span>
                <span>1000 RPM (High Vortex)</span>
              </div>
            </div>

            {/* Bytecode Preview Box */}
            <div style={{
              background: 'var(--deep-charcoal)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--primary-lime)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>BYTECODE DISPATCH:</span>
              <span style={{ color: '#FFFFFF' }}>{`{"CMD":"SET","TEMP":${testTemp},"RPM":${testRpm}}`}</span>
            </div>
          </div>

          {/* Visual Digital Twin Display */}
          <div style={{
            background: 'var(--deep-charcoal)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '190px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Thermal Glow Ring */}
            <div style={{
              position: 'relative',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1A3454 0%, #0B1C30 100%)',
              border: `2px solid ${testTemp > 60 ? 'var(--warning-orange)' : 'var(--primary-lime)'}`,
              boxShadow: `0 0 24px ${glowColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            }}>
              {/* Hotplate Coil Inner */}
              <div style={{
                position: 'absolute',
                inset: '10px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(209, 243, 77, 0.4)',
              }} />

              {/* Rotating Magnetic Stir Bar */}
              <div style={{
                position: 'absolute',
                width: '32px',
                height: '8px',
                borderRadius: '4px',
                background: '#FFFFFF',
                boxShadow: '0 0 8px rgba(255,255,255,0.85)',
                animation: spinDuration > 0 ? `magneticRotate ${spinDuration}s linear infinite` : 'none',
              }} />

              {/* Center Core LED */}
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: testTemp > 60 ? 'var(--warning-orange)' : 'var(--primary-lime)',
                boxShadow: `0 0 8px ${testTemp > 60 ? 'var(--warning-orange)' : 'var(--primary-lime)'}`,
              }} />
            </div>

            <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 600 }}>
                {testTemp}°C · {testRpm} RPM
              </div>
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>
                Hotplate Coil & Magnetic Vortex Twin
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 4. How AutoLab Works (Page Structure from Brand Kit) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--deep-charcoal)', margin: 0 }}>
          How AutoLab Works
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          
          {/* Step 1 */}
          <div className="notebook-card" style={{ padding: '1.25rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--primary-lime)', color: 'var(--deep-charcoal)',
              fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.65rem'
            }}>
              1
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--deep-charcoal)' }}>
              Enter Material
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', margin: 0, lineHeight: 1.45 }}>
              Type the name or material. Valency AI accesses 44.5M peer-reviewed scientific articles.
            </p>
          </div>

          {/* Step 2 */}
          <div className="notebook-card" style={{ padding: '1.25rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#E5E7EB', color: 'var(--deep-charcoal)',
              fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.65rem'
            }}>
              2
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--deep-charcoal)' }}>
              Smart Research Engine
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', margin: 0, lineHeight: 1.45 }}>
              Extracts stoichiometric recipes, temperature ramps, stirring speeds, and alternative synthesis routes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="notebook-card" style={{ padding: '1.25rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#E5E7EB', color: 'var(--deep-charcoal)',
              fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.65rem'
            }}>
              3
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--deep-charcoal)' }}>
              Lab Setup (IoT)
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', margin: 0, lineHeight: 1.45 }}>
              The system automatically simulates the digital twin, verifies thermal safety envelopes, and arms the hardware.
            </p>
          </div>

          {/* Step 4 */}
          <div className="notebook-card" style={{ padding: '1.25rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#E5E7EB', color: 'var(--deep-charcoal)',
              fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.65rem'
            }}>
              4
            </div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--deep-charcoal)' }}>
              Start the Process
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-gray)', margin: 0, lineHeight: 1.45 }}>
              Your lab is ready. 1-click execution with real-time serial telemetry, live heating, and instant abort safety.
            </p>
          </div>

        </div>
      </div>

      {/* ── 5. Brand Slogan Footer (From Brand Kit) ── */}
      <div style={{
        textAlign: 'center',
        padding: '1.5rem 0 0.5rem 0',
        borderTop: '1px solid var(--slate-border)',
        color: 'var(--slate-gray)',
        fontSize: '0.85rem',
        fontWeight: 500,
        letterSpacing: '0.04em',
      }}>
        Smarter Research <span style={{ color: 'var(--primary-lime)', margin: '0 0.5rem' }}>·</span> Automated Labs <span style={{ color: 'var(--primary-lime)', margin: '0 0.5rem' }}>·</span> Greater Discoveries
      </div>

    </div>
  );
}
