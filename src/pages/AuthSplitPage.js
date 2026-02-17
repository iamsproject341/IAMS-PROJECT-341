import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIcon } from '../components/Logo';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';

export default function AuthSplitPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  // Calculate heights based on hover
  const createHeight = hovered === 'create' ? 65 : hovered === 'signin' ? 35 : 50;
  const signinHeight = hovered === 'signin' ? 65 : hovered === 'create' ? 35 : 50;

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
        style={{ height: `${createHeight}%` }}
        onMouseEnter={() => setHovered('create')}
        onMouseLeave={() => setHovered(null)}
        onClick={() => navigate('/register')}
      >
        <div className="asp-skew-bottom" />
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

      {/* SIGN IN - Bottom half */}
      <div
        className={`asp-half asp-signin ${hovered === 'signin' ? 'asp-active' : ''}`}
        style={{ height: `${signinHeight}%` }}
        onMouseEnter={() => setHovered('signin')}
        onMouseLeave={() => setHovered(null)}
        onClick={() => navigate('/login')}
      >
        <div className="asp-skew-top" />
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

      {/* Center "or" */}
      <div className={`asp-center-mark ${hovered ? 'asp-center-hide' : ''}`}>
        <div className="asp-center-dot" />
        <span>or</span>
        <div className="asp-center-dot" />
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

/* Halves - stacked vertically */
.asp-half {
  position: absolute;
  left: 0; right: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height 0.6s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease;
}

.asp-create {
  top: 0;
  background: linear-gradient(135deg, #0d1a28 0%, #0f2234 100%);
  z-index: 2;
}
.asp-create:hover { background: linear-gradient(135deg, #0f1f30 0%, #122a40 100%); }

.asp-signin {
  bottom: 0;
  background: linear-gradient(315deg, #0d1a28 0%, #0a1420 100%);
  z-index: 1;
}
.asp-signin:hover { background: linear-gradient(315deg, #0f1f30 0%, #0c1825 100%); }

/* Diagonal edges using skewed pseudo-elements */
.asp-skew-bottom {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 80px;
  background: #0b1520;
  transform: skewY(-3deg);
  transform-origin: bottom left;
  z-index: 1;
}

.asp-skew-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 80px;
  background: #0b1520;
  transform: skewY(-3deg);
  transform-origin: top right;
  z-index: 1;
}

/* Content positioning */
.asp-create .asp-content {
  position: relative;
  z-index: 2;
  text-align: right;
  max-width: 420px;
  margin-right: 10%;
  margin-left: auto;
  margin-top: -30px;
}

.asp-signin .asp-content {
  position: relative;
  z-index: 2;
  text-align: left;
  max-width: 420px;
  margin-left: 10%;
  margin-right: auto;
  margin-top: 30px;
}

/* Labels */
.asp-label-wrap { display: flex; align-items: center; gap: 14px; margin-bottom: 0; transition: all 0.4s ease; }
.asp-create .asp-label-wrap { flex-direction: row-reverse; justify-content: flex-start; }

.asp-icon-circle {
  width: 52px; height: 52px; border-radius: 50%;
  border: 1px solid rgba(20,184,166,0.2);
  display: flex; align-items: center; justify-content: center;
  color: #14b8a6;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  flex-shrink: 0;
}
.asp-icon-pop {
  background: #14b8a6; color: #031c18; border-color: #14b8a6;
  transform: scale(1.1);
  box-shadow: 0 0 30px rgba(20,184,166,0.3);
}

.asp-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 2rem; font-weight: 600; color: #e2e8f0;
  letter-spacing: -0.02em;
  transition: all 0.4s ease;
  margin: 0; line-height: 1;
}
.asp-active .asp-title { color: white; font-size: 2.2rem; }

/* Preview */
.asp-preview { max-height: 0; opacity: 0; overflow: hidden; transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); margin-top: 0; }
.asp-preview-show { max-height: 200px; opacity: 1; margin-top: 20px; }
.asp-preview p { font-size: 0.88rem; color: #8b9bb4; line-height: 1.7; margin: 0 0 18px; }
.asp-cta { display: inline-flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600; color: #14b8a6; transition: gap 0.3s ease; }
.asp-half:hover .asp-cta { gap: 12px; }

/* Background watermark */
.asp-bg-text {
  position: absolute;
  font-family: 'Lora', Georgia, serif;
  font-size: 12vw; font-weight: 700;
  color: rgba(255,255,255,0.015);
  letter-spacing: 0.05em;
  pointer-events: none;
  transition: all 0.6s ease;
  user-select: none;
  z-index: 0;
}
.asp-create .asp-bg-text { top: 10%; right: -2%; }
.asp-signin .asp-bg-text { bottom: 10%; left: -2%; }
.asp-active .asp-bg-text { color: rgba(255,255,255,0.03); }

/* Glow effects */
.asp-create.asp-active::after {
  content: ''; position: absolute; top: -20%; right: -20%;
  width: 60%; height: 60%;
  background: radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.asp-signin.asp-active::after {
  content: ''; position: absolute; bottom: -20%; left: -20%;
  width: 60%; height: 60%;
  background: radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}

/* Center "or" */
.asp-center-mark {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 30;
  display: flex; align-items: center; gap: 10px;
  pointer-events: none;
  transition: all 0.4s ease;
}
.asp-center-hide { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
.asp-center-mark span { font-family: 'Lora', Georgia, serif; font-size: 0.8rem; font-weight: 500; color: rgba(255,255,255,0.25); font-style: italic; }
.asp-center-dot { width: 24px; height: 1px; background: rgba(20,184,166,0.25); }

/* Mobile */
@media (max-width: 768px) {
  .asp-create .asp-content, .asp-signin .asp-content {
    margin: 0 auto; text-align: center; padding: 0 24px;
  }
  .asp-create .asp-label-wrap { flex-direction: row; justify-content: center; }
  .asp-signin .asp-label-wrap { justify-content: center; }
  .asp-title { font-size: 1.6rem; }
  .asp-active .asp-title { font-size: 1.8rem; }
  .asp-bg-text { font-size: 18vw; }
  .asp-skew-bottom, .asp-skew-top { height: 50px; }
}
`;
