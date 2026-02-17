import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, BookOpen, Shuffle, ShieldCheck, ChevronDown } from 'lucide-react';
import { AIcon } from '../components/Logo';

const SLIDES = [
  { src: process.env.PUBLIC_URL + '/images/slide1.jpg', alt: 'Campus' },
  { src: process.env.PUBLIC_URL + '/images/slide2.jpg', alt: 'Business collaboration' },
  { src: process.env.PUBLIC_URL + '/images/slide3.jpg', alt: 'Students on campus' },
  { src: process.env.PUBLIC_URL + '/images/slide4.jpg', alt: 'Team meeting' },
];

const FEATURES = [
  { icon: Users, title: 'Smart Matching', desc: 'Algorithm scores student-organization pairings based on skills, project types, and location preferences.' },
  { icon: BookOpen, title: 'Digital Logbooks', desc: 'Students submit weekly entries online. Supervisors and coordinators track progress in real time.' },
  { icon: Shuffle, title: 'Automated Placement', desc: 'Coordinators run the matching engine, review scores, and approve placements with one click.' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Separate portals for students, organizations, coordinators, and supervisors.' },
];

const ROLES = [
  { role: 'Students', desc: 'Register, set preferences, get matched, and submit weekly logbooks — all in one place.' },
  { role: 'Organizations', desc: 'Specify desired skills and project types. Receive matched candidates automatically.' },
  { role: 'Coordinators', desc: 'Oversee the entire process. Run matching algorithms and approve placements.' },
  { role: 'Supervisors', desc: 'Track student progress and submit assessments digitally.' },
];

// Hook: animate elements when they scroll into view
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function RevealDiv({ children, delay = 0, direction = 'up', className = '', style = {} }) {
  const [ref, visible] = useReveal();
  const transforms = { up: 'translateY(40px)', down: 'translateY(-40px)', left: 'translateX(40px)', right: 'translateX(-40px)' };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0)' : transforms[direction],
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('logo');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState('in');

  // Intro sequence
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 2000);
    const t2 = setTimeout(() => setPhase('done'), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Slideshow auto-advance
  useEffect(() => {
    if (phase !== 'done') return;
    const interval = setInterval(() => {
      setSlideDirection('out');
      setTimeout(() => {
        setCurrentSlide(p => (p + 1) % SLIDES.length);
        setSlideDirection('in');
      }, 600);
    }, 5000);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="lp-root">
      {/* ===== LOGO INTRO ===== */}
      <div className={`lp-intro ${phase !== 'logo' ? 'lp-intro-exit' : ''}`}>
        <div className="lp-intro-inner">
          <div className="lp-intro-icon">
            <AIcon size={40} />
          </div>
          <div className="lp-intro-text">
            <h1>AttachFlow</h1>
            <span>Industrial Attachment Management</span>
          </div>
        </div>
        <div className="lp-intro-line" />
      </div>

      {/* ===== MAIN PAGE ===== */}
      <div className={`lp-main ${phase === 'done' ? 'lp-main-visible' : ''}`}>

        {/* Nav */}
        <nav className="lp-nav">
          <div className="lp-nav-brand">
            <div className="lp-nav-icon"><AIcon size={16} /></div>
            <span>AttachFlow</span>
          </div>
          <div className="lp-nav-links">
            <button onClick={() => navigate('/login')}>Sign In</button>
            <button className="lp-nav-cta" onClick={() => navigate('/register')}>Get Started</button>
          </div>
        </nav>

        {/* Hero with slideshow */}
        <section className="lp-hero">
          <div className="lp-hero-slides">
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`lp-slide ${i === currentSlide ? (slideDirection === 'in' ? 'lp-slide-active' : 'lp-slide-exit') : ''}`}
              >
                <img src={slide.src} alt={slide.alt} />
              </div>
            ))}
            <div className="lp-hero-overlay" />
          </div>

          <div className="lp-hero-content">
            <div className="lp-hero-badge">University of Botswana — Computer Science</div>
            <h1>Industrial Attachment,<br />Simplified.</h1>
            <p>A centralized platform connecting students with organizations, automating placement matching, and digitizing the entire attachment workflow.</p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={() => navigate('/register')}>
                Create Account <ArrowRight size={17} />
              </button>
              <button className="lp-btn-outline" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>
          </div>

          <div className="lp-hero-indicators">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`lp-indicator ${i === currentSlide ? 'active' : ''}`}
                onClick={() => { setCurrentSlide(i); setSlideDirection('in'); }}
              />
            ))}
          </div>

          <button className="lp-scroll-hint" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            <ChevronDown size={20} />
          </button>
        </section>

        {/* Features */}
        <section className="lp-features" id="features">
          <RevealDiv className="lp-section-header">
            <h2>Everything you need for industrial attachment</h2>
            <p>From registration to assessment — one platform for students, organizations, and supervisors.</p>
          </RevealDiv>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <RevealDiv key={i} delay={i * 0.1} className="lp-feature-card">
                  <div className="lp-feature-icon"><Icon size={21} strokeWidth={1.6} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <div className="lp-feature-line" />
                </RevealDiv>
              );
            })}
          </div>
        </section>

        {/* Roles */}
        <section className="lp-roles">
          <RevealDiv className="lp-section-header">
            <h2>Built for every stakeholder</h2>
          </RevealDiv>
          <div className="lp-roles-grid">
            {ROLES.map((r, i) => (
              <RevealDiv key={i} delay={i * 0.08} direction="left" className="lp-role-card">
                <div className="lp-role-num">0{i + 1}</div>
                <h3>{r.role}</h3>
                <p>{r.desc}</p>
              </RevealDiv>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <RevealDiv className="lp-cta-inner">
            <h2>Ready to get started?</h2>
            <p>Join AttachFlow and streamline your industrial attachment experience.</p>
            <button className="lp-btn-primary" onClick={() => navigate('/register')}>
              Create Your Account <ArrowRight size={17} />
            </button>
          </RevealDiv>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-nav-brand">
              <div className="lp-nav-icon" style={{ width: 26, height: 26 }}><AIcon size={13} /></div>
              <span>AttachFlow</span>
            </div>
            <div className="lp-footer-text">CSI341 — Introduction to Software Engineering | University of Botswana | 2026</div>
          </div>
        </footer>
      </div>

      <style>{landingCSS}</style>
    </div>
  );
}

const landingCSS = `
/* ===========================
   LANDING PAGE STYLES
   =========================== */
.lp-root {
  --serif: 'Source Serif 4', Georgia, serif;
  --sans: 'DM Sans', -apple-system, sans-serif;
  --navy: #0b1520;
  --navy2: #111f30;
  --navy3: #152238;
  --teal: #14b8a6;
  --teal-dim: rgba(20,184,166,0.07);
  --bright: #edf0f7;
  --mid: #94a3b8;
  --dim: #4b6280;
  --line: rgba(255,255,255,0.06);
  background: var(--navy);
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--bright);
}

/* ===== INTRO ===== */
.lp-intro {
  position: fixed; inset: 0; z-index: 200;
  background: var(--navy);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  transition: opacity 0.9s ease, transform 0.9s cubic-bezier(.4,0,.2,1);
}
.lp-intro-exit {
  opacity: 0;
  transform: scale(1.08);
  pointer-events: none;
}
.lp-intro-inner {
  display: flex; align-items: center; gap: 20px;
  animation: introSlideUp 0.8s cubic-bezier(.16,1,.3,1) both;
}
.lp-intro-icon {
  width: 72px; height: 72px; border-radius: 16px;
  background: var(--teal);
  display: flex; align-items: center; justify-content: center;
  color: #031c18;
  animation: introIconPop 0.6s cubic-bezier(.16,1,.3,1) 0.2s both;
}
@keyframes introIconPop {
  0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
.lp-intro-text h1 {
  font-family: var(--serif); font-size: 3rem; font-weight: 700;
  color: var(--bright); letter-spacing: -0.03em; line-height: 1;
  animation: introTextFade 0.6s ease 0.4s both;
}
.lp-intro-text span {
  font-family: var(--sans); font-size: 0.75rem;
  color: var(--dim); text-transform: uppercase;
  letter-spacing: 0.14em; font-weight: 500;
  animation: introTextFade 0.6s ease 0.6s both;
}
@keyframes introTextFade { 0% { opacity: 0; transform: translateX(-12px); } 100% { opacity: 1; transform: translateX(0); } }
@keyframes introSlideUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }

.lp-intro-line {
  width: 1px; height: 0; background: var(--teal);
  margin-top: 32px;
  animation: lineGrow 0.8s ease 1s both;
}
@keyframes lineGrow { 0% { height: 0; opacity: 0; } 100% { height: 48px; opacity: 0.4; } }

/* ===== NAV ===== */
.lp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 40px;
  background: rgba(11,21,32,0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--line);
}
.lp-nav-brand {
  display: flex; align-items: center; gap: 9px;
  font-family: var(--serif); font-size: 1.1rem; font-weight: 700; color: white;
}
.lp-nav-icon {
  width: 32px; height: 32px; border-radius: 7px;
  background: var(--teal);
  display: flex; align-items: center; justify-content: center; color: #031c18;
}
.lp-nav-links { display: flex; align-items: center; gap: 6px; }
.lp-nav-links button {
  padding: 8px 18px; background: none; border: none;
  color: rgba(255,255,255,0.65); font-family: var(--sans);
  font-size: 0.84rem; font-weight: 500; cursor: pointer; transition: color 0.2s;
}
.lp-nav-links button:hover { color: white; }
.lp-nav-cta {
  background: var(--teal) !important; color: #031c18 !important;
  border-radius: 6px; font-weight: 600 !important;
  transition: opacity 0.2s !important;
}
.lp-nav-cta:hover { opacity: 0.9; }

/* ===== HERO ===== */
.lp-hero {
  position: relative; min-height: 100vh;
  display: flex; align-items: center; overflow: hidden;
}
.lp-hero-slides { position: absolute; inset: 0; }
.lp-slide {
  position: absolute; inset: 0;
  opacity: 0;
  transform: scale(1.06);
  transition: opacity 0.8s ease, transform 5s ease;
}
.lp-slide img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: center 40%;
}
.lp-slide-active {
  opacity: 1;
  transform: scale(1);
}
.lp-slide-exit {
  opacity: 0;
  transform: scale(1.04);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.lp-hero-overlay {
  position: absolute; inset: 0;
  background:
    linear-gradient(to right, rgba(11,21,32,0.93) 0%, rgba(11,21,32,0.75) 55%, rgba(11,21,32,0.50) 100%),
    linear-gradient(to top, rgba(11,21,32,0.95) 0%, transparent 30%);
}
.lp-hero-content {
  position: relative; z-index: 5;
  max-width: 580px; padding: 0 40px; padding-top: 60px;
}
.lp-hero-badge {
  display: inline-block; padding: 5px 13px;
  background: var(--teal-dim);
  border: 1px solid rgba(20,184,166,0.12);
  border-radius: 4px;
  font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
  color: var(--teal); text-transform: uppercase; letter-spacing: 0.07em;
  margin-bottom: 22px;
}
.lp-hero-content h1 {
  font-family: var(--serif); font-size: 3.2rem; font-weight: 700;
  color: white; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 18px;
}
.lp-hero-content p {
  font-family: var(--sans); font-size: 1rem;
  color: var(--mid); line-height: 1.7; margin-bottom: 32px;
}
.lp-hero-btns { display: flex; gap: 10px; }
.lp-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 26px; background: var(--teal); color: #031c18;
  border: none; border-radius: 6px;
  font-family: var(--sans); font-size: 0.88rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.2s, transform 0.2s;
}
.lp-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.lp-btn-outline {
  padding: 13px 26px;
  background: rgba(255,255,255,0.04);
  color: var(--bright);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  font-family: var(--sans); font-size: 0.88rem; font-weight: 500;
  cursor: pointer; transition: background 0.2s, border-color 0.2s;
}
.lp-btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }

.lp-hero-indicators {
  position: absolute; bottom: 80px; left: 40px; z-index: 10;
  display: flex; gap: 8px;
}
.lp-indicator {
  width: 32px; height: 3px; border-radius: 2px;
  background: rgba(255,255,255,0.2);
  border: none; cursor: pointer;
  transition: all 0.3s ease;
}
.lp-indicator.active {
  width: 48px;
  background: var(--teal);
}

.lp-scroll-hint {
  position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
  z-index: 10; background: none; border: none;
  color: rgba(255,255,255,0.3); cursor: pointer;
  animation: hintBounce 2s ease infinite;
}
@keyframes hintBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(6px); }
}

/* ===== SECTIONS ===== */
.lp-section-header { text-align: center; margin-bottom: 48px; }
.lp-section-header h2 {
  font-family: var(--serif); font-size: 2rem; font-weight: 700;
  color: var(--bright); letter-spacing: -0.02em; margin-bottom: 10px;
}
.lp-section-header p {
  font-family: var(--sans); color: var(--mid); font-size: 0.95rem;
  max-width: 520px; margin: 0 auto;
}

/* ===== FEATURES ===== */
.lp-features {
  padding: 100px 40px;
  max-width: 1060px; margin: 0 auto;
}
.lp-features-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px;
}
.lp-feature-card {
  background: var(--navy3);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 28px;
  position: relative; overflow: hidden;
  transition: border-color 0.3s, transform 0.3s;
  cursor: default;
}
.lp-feature-card:hover {
  border-color: rgba(20,184,166,0.18);
  transform: translateY(-3px);
}
.lp-feature-icon {
  width: 42px; height: 42px; border-radius: 9px;
  background: var(--teal-dim);
  display: flex; align-items: center; justify-content: center;
  color: var(--teal); margin-bottom: 14px;
}
.lp-feature-card h3 {
  font-family: var(--sans); font-size: 0.95rem; font-weight: 600;
  color: var(--bright); margin-bottom: 7px;
}
.lp-feature-card p {
  font-family: var(--sans); font-size: 0.83rem;
  color: var(--mid); line-height: 1.6;
}
.lp-feature-line {
  position: absolute; bottom: 0; left: 28px; right: 28px;
  height: 2px; background: var(--teal);
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.4s ease;
}
.lp-feature-card:hover .lp-feature-line { transform: scaleX(1); }

/* ===== ROLES ===== */
.lp-roles {
  padding: 80px 40px; max-width: 1060px; margin: 0 auto;
}
.lp-roles-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
}
.lp-role-card {
  padding: 26px 20px;
  border: 1px solid var(--line); border-radius: 12px;
  transition: border-color 0.3s, transform 0.3s;
}
.lp-role-card:hover {
  border-color: rgba(20,184,166,0.18);
  transform: translateY(-3px);
}
.lp-role-num {
  font-family: var(--serif); font-size: 1.8rem; font-weight: 700;
  color: rgba(20,184,166,0.15); margin-bottom: 10px; line-height: 1;
}
.lp-role-card h3 {
  font-family: var(--sans); font-size: 0.9rem; font-weight: 600;
  color: var(--bright); margin-bottom: 6px;
}
.lp-role-card p {
  font-family: var(--sans); font-size: 0.78rem;
  color: var(--mid); line-height: 1.6;
}

/* ===== CTA ===== */
.lp-cta { padding: 80px 40px; }
.lp-cta-inner {
  max-width: 1060px; margin: 0 auto;
  text-align: center; padding: 56px 40px;
  background: var(--navy3);
  border: 1px solid var(--line); border-radius: 14px;
}
.lp-cta-inner h2 {
  font-family: var(--serif); font-size: 1.9rem; font-weight: 700;
  color: var(--bright); margin-bottom: 10px;
}
.lp-cta-inner p {
  font-family: var(--sans); color: var(--mid);
  margin-bottom: 24px; font-size: 0.95rem;
}

/* ===== FOOTER ===== */
.lp-footer { padding: 28px 40px; border-top: 1px solid var(--line); }
.lp-footer-inner {
  max-width: 1060px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
}
.lp-footer-text {
  font-family: var(--sans); font-size: 0.72rem; color: var(--dim);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .lp-features-grid { grid-template-columns: 1fr; }
  .lp-roles-grid { grid-template-columns: 1fr 1fr; }
  .lp-hero-content h1 { font-size: 2.4rem; }
  .lp-nav, .lp-hero-content, .lp-features, .lp-roles, .lp-cta, .lp-footer { padding-left: 20px; padding-right: 20px; }
  .lp-hero-indicators { left: 20px; }
}
@media (max-width: 600px) {
  .lp-roles-grid { grid-template-columns: 1fr; }
  .lp-hero-content h1 { font-size: 1.9rem; }
  .lp-hero-btns { flex-direction: column; }
  .lp-footer-inner { flex-direction: column; gap: 10px; text-align: center; }
  .lp-intro-text h1 { font-size: 2rem; }
  .lp-intro-icon { width: 52px; height: 52px; }
  .lp-intro-inner { gap: 14px; }
}
`;
