import React, { useState } from 'react';
import { Search, Sparkles, FileText, Database, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { BENCHMARK_PROTOCOLS } from '../data/benchmarkProtocols';

export default function LiteratureSearch({
  currentProtocol,
  onSelectProtocol,
  isExtracting,
  setIsExtracting
}) {
  const [customQuery, setCustomQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAbstract, setCustomAbstract] = useState('');

  const handleSelectPreset = (protocol) => {
    if (protocol.id === currentProtocol.id) return;
    setIsExtracting(true);
    setTimeout(() => {
      onSelectProtocol(protocol);
      setIsExtracting(false);
    }, 1100);
  };

  const handleCustomExtract = (e) => {
    e.preventDefault();
    if (!customAbstract.trim() && !customQuery.trim()) return;

    setIsExtracting(true);
    setShowCustomModal(false);

    // Dynamic AI synthesis extractor simulation
    setTimeout(() => {
      const extracted = {
        id: `custom-${Date.now()}`,
        name: customQuery || "Custom Extracted Literature Protocol",
        category: "Novel Material Formulation",
        formula: "Synthesized Target Matrix",
        targetProperty: "Extracted via Valency MCP & Google LLM",
        citation: {
          title: "User Ingested Scientific Document",
          journal: "Scientific Literature Pipeline",
          doi: "10.1016/j.autolab.custom",
          year: 2026,
          snippet: customAbstract || "Direct unstructured literature ingestion parsed into machine-readable hardware execution profile."
        },
        safetyEnvelope: {
          maxTempC: 300,
          maxRampRateCMin: 10,
          criticalWarnings: [
            "Extracted from unstructured text: Verify solvent flashpoints prior to execution.",
            "Maintain emergency stop readiness on physical hardware node."
          ],
          flashPointAlert: "Standard safety envelope active: 300 °C thermal limit."
        },
        steps: [
          {
            id: 1,
            name: "Phase 1: Solvation & Chelation",
            operation: "STIR_DISPENSE",
            targetTempC: 35,
            rampRateCMin: 1.0,
            durationMin: 25,
            stirRpm: 500,
            uvExposure: false,
            reagents: "Custom precursor reagents in polar solvent matrix",
            hardwareAction: "Agitation active at 500 RPM, baseline temperature 35 °C",
            notes: "Optical dissolution verification"
          },
          {
            id: 2,
            name: "Phase 2: Thermal Nucleation Window",
            operation: "RAMP_HEAT_STIR",
            targetTempC: 110,
            rampRateCMin: 5.0,
            durationMin: 45,
            stirRpm: 750,
            uvExposure: false,
            reagents: "Chelated solution intermediate",
            hardwareAction: "PID ramp to 110 °C, stirrer increased to 750 RPM",
            notes: "Color transition and initial precursor growth"
          },
          {
            id: 3,
            name: "Phase 3: Thermal Quench & Stabilization",
            operation: "COOL_DOWN",
            targetTempC: 25,
            rampRateCMin: -15.0,
            durationMin: 15,
            stirRpm: 300,
            uvExposure: false,
            reagents: "Stabilized target material",
            hardwareAction: "Active cooling engaged, agitation reduced to 300 RPM",
            notes: "Ready for harvest"
          }
        ]
      };
      onSelectProtocol(extracted);
      setIsExtracting(false);
    }, 1400);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '18px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Database size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>
              Step 1: Literature Retrieval & Protocol Extraction
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Query 44.5M scientific papers via Valency MCP or select a peer-reviewed materials benchmark:
          </p>
        </div>

        <button
          onClick={() => setShowCustomModal(true)}
          className="btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <FileText size={15} color="var(--accent-cyan)" />
          Paste Custom Paper / Abstract
        </button>
      </div>

      {/* Preset Material Chips */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {BENCHMARK_PROTOCOLS.map((protocol) => {
          const isSelected = protocol.id === currentProtocol.id;
          return (
            <div
              key={protocol.id}
              onClick={() => handleSelectPreset(protocol)}
              style={{
                cursor: 'pointer',
                background: isSelected ? 'rgba(0, 242, 254, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: isSelected ? '0 0 16px rgba(0, 242, 254, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', marginBottom: '6px' }}>
                  {protocol.category}
                </span>
                {isSelected && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    <CheckCircle2 size={13} />
                    Active
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '0.98rem', color: '#fff', marginBottom: '4px', fontWeight: 600 }}>
                {protocol.name}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {protocol.formula} • {protocol.targetProperty}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '8px',
                marginTop: '4px',
                fontSize: '0.7rem',
                color: 'var(--text-subtle)'
              }}>
                <span>{protocol.steps.length} Physical Steps</span>
                <span style={{ color: 'var(--accent-blue)' }}>{protocol.citation.journal} ({protocol.citation.year})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extraction Status Bar */}
      {isExtracting && (
        <div style={{
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid var(--accent-cyan)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginTop: '12px'
        }}>
          <div className="shimmer-active" style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid var(--accent-cyan)',
            borderTopColor: 'transparent',
            animation: 'magneticSpin 0.8s linear infinite'
          }}></div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              Valency MCP Agent: Ingesting Literature & Extracting Synthesis Bounds...
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Parsing kinetics: Temperature (°C), Agitation (RPM), Dwell Timers, Safety Limits
            </div>
          </div>
        </div>
      )}

      {/* Citation Snippet Accordion */}
      {!isExtracting && currentProtocol.citation && (
        <div style={{
          marginTop: '12px',
          background: 'rgba(10, 15, 26, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} />
              Verified Literature Source: {currentProtocol.citation.title}
            </span>
            <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              DOI: {currentProtocol.citation.doi}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.45', fontStyle: 'italic', fontSize: '0.78rem' }}>
            "{currentProtocol.citation.snippet}"
          </p>
        </div>
      )}

      {/* Custom Abstract Input Modal */}
      {showCustomModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '640px',
            width: '100%',
            padding: '28px',
            border: '1px solid var(--border-bright)'
          }}>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>
              Ingest Custom Scientific Paper / Abstract
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Paste an excerpt from any synthesis paper (or input a target chemical system). AutoLab OS will parse thermal & kinetic parameters.
            </p>

            <form onSubmit={handleCustomExtract}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Target Material Name / Formula:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sodium Cobalt Oxide (Na0.7CoO2) Solvothermal"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#090d16',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Synthesis Paragraph / Abstract:
                </label>
                <textarea
                  rows={5}
                  placeholder="Paste methodology text: e.g. Precursors dissolved in ethanol at 300 RPM, heated to 160°C for 3 hours, then cooled..."
                  value={customAbstract}
                  onChange={(e) => setCustomAbstract(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#090d16',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    lineHeight: '1.4'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <Sparkles size={16} />
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
