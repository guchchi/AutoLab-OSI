import React from 'react';

/**
 * AutoLab Official Brand Logo
 * Displays the exact brand logo mark & wordmark provided in the AutoLab Brand Kit.
 */
export default function AutoLabLogo({ size = 32, showTagline = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', userSelect: 'none' }}>
      <img
        src="/brand-logo.png"
        alt="AutoLab"
        style={{
          height: `${size}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {showTagline && (
        <span
          style={{
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontSize: '0.68rem',
            fontWeight: 600,
            color: 'var(--slate-gray)',
            letterSpacing: '0.04em',
            borderLeft: '1px solid var(--slate-border)',
            paddingLeft: '0.625rem',
            lineHeight: 1.2,
          }}
        >
          Research → Automate
        </span>
      )}
    </div>
  );
}
