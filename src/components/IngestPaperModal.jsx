import React, { useState } from 'react';
import { X, Sparkles, FileText, Database } from 'lucide-react';

export default function IngestPaperModal({ isOpen, onClose, onExtractCustom }) {
  const [materialName, setMaterialName] = useState('');
  const [paperAbstract, setPaperAbstract] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!materialName.trim() && !paperAbstract.trim()) return;

    onExtractCustom(materialName, paperAbstract);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        maxWidth: '580px',
        width: '100%',
        padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1px solid var(--border-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span className="badge-clean badge-clean-purple" style={{ marginBottom: '4px' }}>
              Valency MCP Literature Gateway
            </span>
            <h3 style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 800 }}>
              Ingest Research Paper / Abstract
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '18px', lineHeight: '1.5' }}>
          Input a material target or paste an excerpt from any synthesis paper. AutoLab OS will parse thermal & kinetic bounds into machine bytecode.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Material Target Name:
            </label>
            <input
              type="text"
              placeholder="e.g. Cobalt-Doped Sodium Titanate (Na0.7CoO2)"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #cbd5e1',
                fontSize: '0.86rem',
                fontFamily: 'var(--font-body)',
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
              placeholder="e.g. Precursors dissolved in anhydrous ethanol at 400 RPM at 25°C, then heated to 160°C for 180 min..."
              value={paperAbstract}
              onChange={(e) => setPaperAbstract(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.45',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-pill-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-action-primary"
            >
              <Sparkles size={15} />
              Extract Synthesis Protocol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
