import React from 'react';
import { ArrowLeft, Plus, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { BENCHMARK_PROTOCOLS } from '../data/benchmarkProtocols';

export default function FinnovaPageTitle({
  currentProtocol,
  onSelectProtocol,
  onOpenIngestModal,
  onDeployToLab,
  isDeploying
}) {
  return (
    <div style={{ marginBottom: '22px' }}>
      {/* Title & Top Action Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer'
          }}>
            <ArrowLeft size={16} color="#475569" />
          </div>

          <div>
            <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>
              Synthesis Hub
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Extract from scientific literature and execute on physical lab hardware in 10 seconds.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenIngestModal}
            className="btn-pill-subtle"
            style={{ padding: '9px 18px' }}
          >
            <Plus size={15} color="var(--primary)" />
            Ingest Custom Paper
          </button>

          <button
            onClick={onDeployToLab}
            disabled={isDeploying}
            className="btn-action-primary"
          >
            <Sparkles size={16} />
            {isDeploying ? "Deploying..." : "Deploy to Lab Hardware"}
          </button>
        </div>
      </div>

      {/* Material Presets Filter Row (Finnova Style Filter Strip) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginRight: '4px', whiteSpace: 'nowrap' }}>
          Materials Benchmark:
        </span>

        {BENCHMARK_PROTOCOLS.map(proto => {
          const isSelected = proto.id === currentProtocol.id;
          return (
            <button
              key={proto.id}
              onClick={() => onSelectProtocol(proto)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-card)',
                background: isSelected ? '#eef2ff' : '#ffffff',
                color: isSelected ? 'var(--primary)' : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 2px 8px rgba(67, 56, 202, 0.15)' : 'none'
              }}
            >
              {isSelected && <CheckCircle2 size={13} color="var(--primary)" />}
              {proto.name.split(' (')[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
