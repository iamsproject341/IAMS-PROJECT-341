import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIcon } from '../components/Logo';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';

export default function AuthSplitPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  // Horizontal split point: default 50%, shifts on hover
  const split = hovered === 'create' ? 65 : hovered === 'signin' ? 35 : 50;

  return (
    <div className="asp-root">
      <div className="asp-logo">
        <div className="asp-logo-icon"><AIcon size={16} /></div>
        <span>AttachFlow</span>
      </div>
      <button className="asp-back" onClick={() => navigate('/')}>← Back</button>

      {/* CREATE ONE - Top half */}
      <div
        className={`asp-half asp-create ${hovered === 'create' ? 'asp-active' : ''}`}
        style={{ height: `${split}%` }}
        onMouseEnter={() => setHovered('create')}
        onMouseLeave={() => setHovered(null)}
        onClick={() => navigate('/register')}
      >
        <div className="asp-content">
          <div className="asp-label-wrap">
            <div className={`asp-icon-circle ${hovered === 'create' ? 'asp-icon-pop' : ''}`}>
              <UserPlus size={22} />
            </div>
            <h2 className="asp-title">Create One</h2>
          </div>
          <div className={`asp-preview ${hovered === 'create' ? 'asp-preview-show' : ''}`}>
            <p>New to AttachFlow? Register as a student to set your preferences, get matched with organizations, and manage your industrial attachment journey.</p>
            <div className="asp-cta"><span>Get Started</span><ArrowRight size={16} /></div>
          </div>
        </div>
        <div className="asp-bg-text">REGISTER</div>
      </div>

      {/* Divider with "or" */}
      <div className="asp-divider" style={{ top: `${split}%` }}>
        <div className="asp-divider-line" />
        <span className={`asp-or ${hovered ? 'asp-or-fade' : ''}`}>or</span>
        <div className="asp-divider-line" />
      </div>

      {/* SIGN IN - Bottom half */}
      <div
        className={`asp-half asp-signin ${hovered === 'signin' ? 'asp-active' : ''}`}
        style={{ height: `${100 - split}%`, top: `${split}%` }}
        onMouseEnter={() => setHovered('signin')}
        onMouseLeave={() => setHovered(null)}
        onClick={() => navigate('/login')}
      >
        <div className="asp-content">
          <div className="asp-label-wrap">
            <div className={`asp-icon-circle ${hovered === 'signin' ? 'asp-icon-pop' : ''}`}>
              <LogIn size={22} />
            </div>
            <h2 className="asp-title">Sign In</h2>
          </div>
          <div className={`asp-preview ${hovered === 'signin' ? 'asp-preview-show' : ''}`}>
            <p>Already have an account? Sign in to access your dashboard, check your placement status, and submit your weekly logbooks.</p>
            <div className="asp-cta"><span>Continue</span><ArrowRight size={16} /></div>
          </div>
        </div>
        <div className="asp-bg-text">LOGIN</div>
      </div>

      <style>{aspCSS}</style>
    </div>
  );
}

const aspCSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap');
.asp-root { position: fixed; inset: 0; background: #0b1520; overflow: hidden; font-family: 'Manrope', -apple-system, sans-serif; }
.asp-logo { position: fixed; top: 24px; left: 28px; z-index: 100; display: flex; align-items: center; gap: 8px; font-family: 'Lora', Georgia, serif; font-size: 1rem; font-weight: 600; color: #e2e8f0; }
.asp-logo-icon { width: 30px; height: 30px; border-radius: 7px; background: #14b8a6; display: flex; align-items: center; justify-content: center; color: #031c18; }
.asp-back { position: fixed; top: 28px; right: 28px; z-index: 100; background: none; border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); font-family: 'Manrope', sans-serif; font-size: 0.78rem; font-weight: 500; padding: 6px 16px; border-radius: 20px; cursor: pointer; transition: all 0.3s ease; }
.asp-back:hover { border-color: rgba(20,184,166,0.3); color: #14b8a6; }

/* Halves */
.asp-half { position: fixed; left: 0; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: height 0.6s cubic-bezier(0.22, 1, 0.36, 1), top 0.6s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease; }
.asp-create { top: 0; background: linear-gradient(180deg, #0d1a28 0%, #0f2234 100%); }
.asp-create:hover { background: linear-gradient(180deg, #0f1f30 0%, #122a40 100%); }
.asp-signin { background: linear-gradient(0deg, #0d1a28 0%, #0a1420 100%); }
.asp-signin:hover { background: linear-gradient(0deg, #0f1f30 0%, #0c1825 100%); }

/* Divider */
.asp-divider { position: fixed; left: 0; right: 0; z-index: 20; display: flex; align-items: center; justify-content: center; gap: 16px; transform: translateY(-50%); transition: top 0.6s cubic-bezier(0.22, 1, 0.36, 1); pointer-events: none; }
.asp-divider-line { width: 40px; height: 1px; background: rgba(20,184,166,0.2); transition: opacity 0.4s ease; }
.asp-or { font-family: 'Lora', Georgia, serif; font-size: 0.8rem; font-weight: 500; color: rgba(255,255,255,0.3); font-style: italic; transition: opacity 0.4s ease; }
.asp-or-fade { opacity: 0.15; }

/* Content */
.asp-create .asp-content { text-align: center; max-width: 420px; }
.asp-signin .asp-content { text-align: center; max-width: 420px; }
.asp-label-wrap { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 0; transition: all 0.4s ease; }
.asp-icon-circle { width: 52px; height: 52px; border-radius: 50%; border: 1px solid rgba(20,184,166,0.2); display: flex; align-items: center; justify-content: center; color: #14b8a6; transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); flex-shrink: 0; }
.asp-icon-pop { background: #14b8a6; color: #031c18; border-color: #14b8a6; transform: scale(1.1); box-shadow: 0 0 30px rgba(20,184,166,0.3); }
.asp-title { font-family: 'Lora', Georgia, serif; font-size: 2rem; font-weight: 600; color: #e2e8f0; letter-spacing: -0.02em; transition: all 0.4s ease; margin: 0; line-height: 1; }
.asp-active .asp-title { color: white; font-size: 2.2rem; }
.asp-preview { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); margin-top: 0; }
.asp-preview-show { max-height: 200px; opacity: 1; margin-top: 20px; }
.asp-preview p { font-size: 0.88rem; color: #8b9bb4; line-height: 1.7; margin: 0 0 18px; }
.asp-cta { display: inline-flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600; color: #14b8a6; transition: gap 0.3s ease; }
.asp-half:hover .asp-cta { gap: 12px; }
.asp-bg-text { position: absolute; font-family: 'Lora', Georgia, serif; font-size: 12vw; font-weight: 700; color: rgba(255,255,255,0.015); letter-spacing: 0.05em; pointer-events: none; transition: all 0.6s ease; user-select: none; }
.asp-create .asp-bg-text { top: 50%; right: 50%; transform: translate(50%, -50%); }
.asp-signin .asp-bg-text { top: 50%; right: 50%; transform: translate(50%, -50%); }
.asp-active .asp-bg-text { color: rgba(255,255,255,0.03); }
.asp-create.asp-active::after { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 60%; height: 80%; background: radial-gradient(ellipse at center top, rgba(20,184,166,0.05) 0%, transparent 70%); pointer-events: none; }
.asp-signin.asp-active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 60%; height: 80%; background: radial-gradient(ellipse at center bottom, rgba(20,184,166,0.05) 0%, transparent 70%); pointer-events: none; }
`;
