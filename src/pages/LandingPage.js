import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow, ArrowRight, Users, BookOpen, Shuffle, ShieldCheck } from 'lucide-react';

const CAMPUS_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/University_of_Botswana.jpg/1280px-University_of_Botswana.jpg';

export default function LandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('logo'); // logo → reveal → done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1800);
    const t2 = setTimeout(() => setPhase('done'), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="landing-root">
      {/* ===== LOGO INTRO OVERLAY ===== */}
      <div className={`landing-intro ${phase !== 'logo' ? 'intro-exit' : ''}`}>
        <div className="intro-logo-wrap">
          <div className="intro-icon">
            <Workflow size={36} strokeWidth={1.8} />
          </div>
          <div className="intro-text">
            <h1>AttachFlow</h1>
            <span>Industrial Attachment Management</span>
          </div>
        </div>
      </div>

      {/* ===== MAIN LANDING ===== */}
      <div className={`landing-main ${phase === 'done' ? 'main-visible' : ''}`}>
        {/* Hero */}
        <section className="landing-hero">
          <div className="hero-bg">
            <img src={CAMPUS_IMG} alt="University of Botswana Campus" />
            <div className="hero-overlay" />
          </div>

          <nav className="landing-nav">
            <div className="nav-logo">
              <div className="nav-icon"><Workflow size={20} strokeWidth={2} /></div>
              <span>AttachFlow</span>
            </div>
            <div className="nav-links">
              <button className="nav-link" onClick={() => navigate('/login')}>Sign In</button>
              <button className="nav-btn" onClick={() => navigate('/register')}>Get Started</button>
            </div>
          </nav>

          <div className="hero-content">
            <div className="hero-badge">University of Botswana — Department of Computer Science</div>
            <h1>Industrial Attachment,<br/>Simplified.</h1>
            <p>
              A centralized platform that connects students with organizations,
              automates placement matching, and digitizes the entire attachment workflow.
            </p>
            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={() => navigate('/register')}>
                Create Account <ArrowRight size={18} />
              </button>
              <button className="btn-hero-secondary" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="landing-features">
          <div className="features-header">
            <h2>Everything you need for industrial attachment</h2>
            <p>From registration to assessment — one platform for students, organizations, and supervisors.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: Users, title: 'Smart Matching', desc: 'Algorithm scores and ranks student-organization pairings based on skills, project types, and location preferences.' },
              { icon: BookOpen, title: 'Digital Logbooks', desc: 'Students submit weekly logbook entries online. Supervisors and coordinators can track progress in real time.' },
              { icon: Shuffle, title: 'Automated Placement', desc: 'Coordinators run the matching engine, review compatibility scores, and approve placements with one click.' },
              { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Separate portals for students, organizations, coordinators, and supervisors with proper data isolation.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="feature-card">
                  <div className="feature-icon"><Icon size={22} strokeWidth={1.6} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Roles */}
        <section className="landing-roles">
          <div className="roles-header">
            <h2>Built for every stakeholder</h2>
          </div>
          <div className="roles-grid">
            {[
              { role: 'Students', desc: 'Register, set preferences, get matched, and submit weekly logbooks — all in one place.' },
              { role: 'Organizations', desc: 'Specify desired skills and project types. Receive matched candidates automatically.' },
              { role: 'Coordinators', desc: 'Oversee the entire process. Run matching algorithms and approve placements.' },
              { role: 'Supervisors', desc: 'Track student progress and submit assessments digitally.' },
            ].map((r, i) => (
              <div key={i} className="role-card">
                <div className="role-number">0{i + 1}</div>
                <h3>{r.role}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="landing-cta">
          <div className="cta-inner">
            <h2>Ready to get started?</h2>
            <p>Join AttachFlow and streamline your industrial attachment experience.</p>
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>
              Create Your Account <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="nav-icon" style={{ width: 28, height: 28 }}><Workflow size={15} strokeWidth={2} /></div>
              <span>AttachFlow</span>
            </div>
            <div className="footer-text">
              CSI341 — Introduction to Software Engineering | University of Botswana | 2026
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        /* ===== FONTS ===== */
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        .landing-root {
          --font-serif: 'Source Serif 4', 'Georgia', serif;
          --font-sans: 'DM Sans', -apple-system, sans-serif;
          --navy: #0b1520;
          --navy-light: #111f30;
          --navy-card: #152238;
          --teal: #14b8a6;
          --teal-dim: rgba(20, 184, 166, 0.08);
          --text-bright: #edf0f7;
          --text-mid: #94a3b8;
          --text-dim: #4b6280;
          --border-c: rgba(255,255,255,0.06);
          background: var(--navy);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ===== INTRO ANIMATION ===== */
        .landing-intro {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .landing-intro.intro-exit {
          opacity: 0;
          transform: scale(1.05);
          pointer-events: none;
        }
        .intro-logo-wrap {
          display: flex;
          align-items: center;
          gap: 18px;
          animation: introFadeUp 0.9s ease both;
        }
        @keyframes introFadeUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .intro-icon {
          width: 64px;
          height: 64px;
          border-radius: 14px;
          background: var(--teal);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #031c18;
        }
        .intro-text h1 {
          font-family: var(--font-serif);
          font-size: 2.8rem;
          font-weight: 700;
          color: var(--text-bright);
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .intro-text span {
          font-family: var(--font-sans);
          font-size: 0.78rem;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 500;
        }

        /* ===== MAIN ===== */
        .landing-main {
          opacity: 0;
          transition: opacity 0.6s ease 0.1s;
        }
        .landing-main.main-visible {
          opacity: 1;
        }

        /* ===== NAV ===== */
        .landing-nav {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-serif);
          font-size: 1.2rem;
          font-weight: 700;
          color: white;
        }
        .nav-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--teal);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #031c18;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-link {
          padding: 9px 20px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }
        .nav-link:hover { color: white; }
        .nav-btn {
          padding: 9px 22px;
          background: var(--teal);
          color: #031c18;
          border: none;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .nav-btn:hover { opacity: 0.9; }

        /* ===== HERO ===== */
        .landing-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
        }
        .hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(11, 21, 32, 0.92) 0%,
            rgba(11, 21, 32, 0.80) 50%,
            rgba(11, 21, 32, 0.55) 100%
          );
        }
        .hero-content {
          position: relative;
          z-index: 5;
          max-width: 620px;
          padding: 0 48px;
        }
        .hero-badge {
          display: inline-block;
          padding: 6px 14px;
          background: var(--teal-dim);
          border: 1px solid rgba(20, 184, 166, 0.15);
          border-radius: 4px;
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--teal);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 24px;
        }
        .hero-content h1 {
          font-family: var(--font-serif);
          font-size: 3.5rem;
          font-weight: 700;
          color: white;
          line-height: 1.12;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
        }
        .hero-content p {
          font-family: var(--font-sans);
          font-size: 1.05rem;
          color: var(--text-mid);
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
        }
        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--teal);
          color: #031c18;
          border: none;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-hero-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-hero-secondary {
          padding: 14px 28px;
          background: rgba(255,255,255,0.06);
          color: var(--text-bright);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-hero-secondary:hover { background: rgba(255,255,255,0.1); }

        /* ===== FEATURES ===== */
        .landing-features {
          padding: 100px 48px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .features-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .features-header h2 {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-bright);
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .features-header p {
          font-family: var(--font-sans);
          color: var(--text-mid);
          font-size: 1rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .feature-card {
          background: var(--navy-card);
          border: 1px solid var(--border-c);
          border-radius: 12px;
          padding: 28px;
          transition: border-color 0.25s;
        }
        .feature-card:hover {
          border-color: rgba(20, 184, 166, 0.2);
        }
        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--teal-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--teal);
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-family: var(--font-sans);
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-bright);
          margin-bottom: 8px;
        }
        .feature-card p {
          font-family: var(--font-sans);
          font-size: 0.85rem;
          color: var(--text-mid);
          line-height: 1.6;
        }

        /* ===== ROLES ===== */
        .landing-roles {
          padding: 80px 48px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .roles-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .roles-header h2 {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-bright);
          letter-spacing: -0.02em;
        }
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .role-card {
          padding: 28px 22px;
          border: 1px solid var(--border-c);
          border-radius: 12px;
          transition: border-color 0.25s;
        }
        .role-card:hover { border-color: rgba(20, 184, 166, 0.2); }
        .role-number {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: rgba(20, 184, 166, 0.2);
          margin-bottom: 12px;
          line-height: 1;
        }
        .role-card h3 {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-bright);
          margin-bottom: 8px;
        }
        .role-card p {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          color: var(--text-mid);
          line-height: 1.6;
        }

        /* ===== CTA ===== */
        .landing-cta {
          padding: 80px 48px;
        }
        .cta-inner {
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
          padding: 64px 48px;
          background: var(--navy-card);
          border: 1px solid var(--border-c);
          border-radius: 16px;
        }
        .cta-inner h2 {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-bright);
          margin-bottom: 12px;
        }
        .cta-inner p {
          font-family: var(--font-sans);
          color: var(--text-mid);
          margin-bottom: 28px;
          font-size: 1rem;
        }

        /* ===== FOOTER ===== */
        .landing-footer {
          padding: 32px 48px;
          border-top: 1px solid var(--border-c);
        }
        .footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-serif);
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-bright);
        }
        .footer-text {
          font-family: var(--font-sans);
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: 1fr; }
          .roles-grid { grid-template-columns: 1fr 1fr; }
          .hero-content h1 { font-size: 2.5rem; }
          .landing-nav, .hero-content, .landing-features,
          .landing-roles, .landing-cta, .landing-footer {
            padding-left: 24px;
            padding-right: 24px;
          }
        }
        @media (max-width: 600px) {
          .roles-grid { grid-template-columns: 1fr; }
          .hero-content h1 { font-size: 2rem; }
          .hero-actions { flex-direction: column; }
          .footer-inner { flex-direction: column; gap: 12px; text-align: center; }
          .intro-text h1 { font-size: 2rem; }
          .intro-icon { width: 48px; height: 48px; }
        }
      `}</style>
    </div>
  );
}
