import React from 'react';
import { Workflow } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 32, iconSvg: 18, title: '1.1rem' },
    md: { icon: 40, iconSvg: 22, title: '1.25rem' },
    lg: { icon: 48, iconSvg: 26, title: '1.5rem' },
  };
  const s = sizes[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Workflow size={s.iconSvg} color="#021a17" strokeWidth={2.2} />
      </div>
      <div>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: s.title,
            fontWeight: 700,
            color: '#e8ecf4',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          AttachFlow
        </h1>
        <span
          style={{
            display: 'block',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.65rem',
            fontWeight: 500,
            color: '#5a7192',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginTop: 1,
          }}
        >
          Industrial Attachment
        </span>
      </div>
    </div>
  );
}
