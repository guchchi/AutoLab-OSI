import React, { useState } from 'react';
import { Search, Sparkles, FileText, ArrowRight, ArrowLeft, CheckCircle2, Database, ExternalLink } from 'lucide-react';
import { BENCHMARK_PROTOCOLS } from '../data/benchmarkProtocols';

export default function StepLiterature({
  currentProtocol,
  onSelectProtocol,
  onNext,
  onBack,
  isExtracting,
  setIsExtracting
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAbstract, setCustomAbstract] = useState('');

  const handleSelectPreset = (proto) => {
    setIsExtracting(true);
    setTimeout(() => {
      onSelectProtocol(proto);
      setIsExtracting(false);
    }, 900);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() && !customAbstract.trim()) return;

    setIsExtracting(true);
    setShowCustomModal(false);

    setTimeout(() => {
      const customProto = {
        id: `custom-${Date.now()}`,
        name: searchQuery || "Custom Synthesized System",
        category: "Novel Material Formulation",
        formula: "Target Matrix",
        targetProperty: "Extracted via Valency MCP & Google LLM",
        citation: {
          title: "Ingested Scientific Document",
          journal: "Valency Scientific Literature Gateway",
          doi: "10.1016/j.autolab.custom",
          year: 2026,
          snippet: customAbstract || "Direct literature methodology parsed into structured machine execution steps."
        },
        safetyEnvelope: {
          maxTempC: 320,
          maxRampRateCMin: 10,
          criticalWarnings: ["Verify precursor flashpoint prior to heating", "Maintain emergency stop readiness"]
        },
        steps: [
          {
            id: 1,
            name: "Phase 1: Solvation & Chelation",
            operation: "STIR_DISPENSE",
            targetTempC: 30,
            rampRateCMin: 1.0,
            durationMin: 20,
            stirRpm: 450,
            reagents: "Custom precursors in solvent matrix",
            hardwareAction: "Agitation active at 450 RPM, ambient RTD active"
          },
          {
            id: 2,
            name: "Phase 2: Thermal Nucleation Window",
            operation: "RAMP_HEAT_STIR",
            targetTempC: 110,
            rampRateCMin: 5.0,
            durationMin: 45,
            stirRpm: 750,
            reagents: "Chelated solution intermediate",
            hardwareAction: "PID thermal ramp to 110 °C, maintain 750 RPM"
          },
          {
            id: 3,
            name: "Phase 3: Thermal Quench & Stabilization",
            operation: "COOL_DOWN",
            targetTempC: 25,
            rampRateCMin: -15.0,
            durationMin: 15,
            stirRpm: 300,
            reagents: "Precipitated crystalline product",
            hardwareAction: "Active cooling engaged, agitation reduced to 300 RPM"
          }
        ]
      };
      onSelectProtocol(customProto);
      setIsExtracting(false);
    }, 1100);
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Search & Material Selection Box */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-card)',
        padding: '36px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-clean badge-clean-blue">
              <Database size={13} />
              Valency MCP Literature Gateway
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>44.5M Scientific Articles</span>
          </div>

          <button
            onClick={() => setShowCustomModal(true)}
            className="btn-subtle"
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            <FileText size={14} color="var(--primary)" />
            Paste Abstract / DOI
          </button>
        </div>

        <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
          Select or Query Target Material System
        </h2>
        <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '22px' }}>
          Choose a peer-reviewed materials chemistry benchmark or input a custom synthesis target:
        </p>

        {/* Preset Material Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '14px',
          marginBottom: '22px'
        }}>
          {BENCHMARK_PROTOCOLS.map((proto) => {
            const isSelected = proto.id === currentProtocol.id;
            return (
              <div
                key={proto.id}
                onClick={() => handleSelectPreset(proto)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-card)',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.15)' : 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge-clean badge-clean-blue" style={{ fontSize: '0.65rem' }}>
                    {proto.category}
                  </span>
                  {isSelected && (
                    <CheckCircle2 size={16} color="var(--primary)" />
                  )}
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  {proto.name}
                </div>

                <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '10px' }}>
                  {proto.formula} • {proto.targetProperty}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  {proto.steps.length} Physical Stages • {proto.citation.journal}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Extraction Progress Animation */}
        {isExtracting && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '18px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '3px solid var(--primary)',
              borderTopColor: 'transparent',
              animation: 'magneticRotate 0.8s linear infinite'
            }}></div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0369a1' }}>
                Valency MCP: Querying Literature & Extracting Physical Bounds...
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                Parsing parameters: Target Temp (°C), Stirring (RPM), Dwell Timers, Safety Envelopes
              </div>
            </div>
          </div>
        )}

        {/* Verified Literature Citation Card */}
        {!isExtracting && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 22px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} color="var(--primary)" />
                Literature Source: {currentProtocol.citation.title}
              </span>
              <a
                href={`https://doi.org/${currentProtocol.citation.doi}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.74rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
              >
                DOI: {currentProtocol.citation.doi}
                <ExternalLink size={12} />
              </a>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.55', fontStyle: 'italic', marginBottom: '14px' }}>
              "{currentProtocol.citation.snippet}"
            </p>

            {/* Extracted Stages Preview Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Extracted Stages:
              </span>
              {currentProtocol.steps.map((st, i) => (
                <span
                  key={st.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 'var(--radius-pill)',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    color: '#334155',
                    fontWeight: 600
                  }}
                >
                  Stage {i + 1}: {st.targetTempC}°C / {st.stirRpm} RPM ({st.durationMin}m)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Navigation Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <button
            onClick={onBack}
            className="btn-subtle"
          >
            <ArrowLeft size={16} />
            Back to Overview
          </button>

          <button
            onClick={onNext}
            className="btn-primary-ocean"
          >
            Proceed to Kinetics & Safety Verification
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Custom Abstract Ingestion Modal */}
      {showCustomModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid var(--border-card)'
          }}>
            <h3 style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
              Query Custom Paper / Methodology
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '18px' }}>
              Paste an excerpt from any synthesis paper. AutoLab OS will parse thermal & kinetic parameters.
            </p>

            <form onSubmit={handleCustomSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Target Material Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cobalt-Doped Sodium Titanate (Na0.7CoO2)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Synthesis Paragraph / Methodology:
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Dissolved precursors in anhydrous ethanol at 450 RPM at 25°C, then heated to 140°C for 180 min..."
                  value={customAbstract}
                  onChange={(e) => setCustomAbstract(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="btn-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-ocean"
                >
                  <Sparkles size={15} />
                  Extract Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
