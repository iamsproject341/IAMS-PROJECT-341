import React from 'react';

function AIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L12 56h10l4-10.5h20l4 10.5h10L32 8zm0 16l6.5 16.5h-13L32 24z" fill="currentColor"/>
    </svg>
  );
}

export { AIcon };

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 30, iconSvg: 16, title: '1.05rem' },
    md: { icon: 36, iconSvg: 20, title: '1.15rem' },
    lg: { icon: 44, iconSvg: 24, title: '1.35rem' },
  };
  const s = sizes[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: 8,
          background: '#14b8a6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#031c18',
        }}
      >
        <AIcon size={s.iconSvg} />
      </div>
      <div>
        <h1
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: s.title,
            fontWeight: 700,
            color: '#edf0f7',
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
            fontSize: '0.6rem',
            fontWeight: 500,
            color: '#4b6280',
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
