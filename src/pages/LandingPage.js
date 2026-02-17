import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, BookOpen, Shuffle, ShieldCheck, ChevronDown } from 'lucide-react';
import { AIcon } from '../components/Logo';

const SLIDES = [
  { src: process.env.PUBLIC_URL + '/images/slide1.jpg', alt: 'Mentoring' },
  { src: process.env.PUBLIC_URL + '/images/slide2.jpg', alt: 'Professionals' },
  { src: process.env.PUBLIC_URL + '/images/slide3.jpg', alt: 'University' },
  { src: process.env.PUBLIC_URL + '/images/slide4.jpg', alt: 'Students' },
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

function useReveal() {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: 0.15 });
    o.observe(el); return () => o.disconnect();
  }, []);
  return [ref, v];
}
function RevealDiv({ children, delay = 0, direction = 'up', className = '', style = {} }) {
  const [ref, v] = useReveal();
  const t = { up: 'translateY(40px)', down: 'translateY(-40px)', left: 'translateX(40px)', right: 'translateX(-40px)' };
  return <div ref={ref} className={className} style={{ ...style, opacity: v?1:0, transform: v?'translate(0)':t[direction], transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>{children}</div>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('logo');
  const [cs, setCs] = useState(0);
  const [sd, setSd] = useState('in');

  useEffect(() => { const a=setTimeout(()=>setPhase('reveal'),2000); const b=setTimeout(()=>setPhase('done'),2900); return()=>{clearTimeout(a);clearTimeout(b);}; }, []);
  useEffect(() => { if(phase!=='done')return; const iv=setInterval(()=>{setSd('out');setTimeout(()=>{setCs(p=>(p+1)%SLIDES.length);setSd('in');},600);},5000); return()=>clearInterval(iv); }, [phase]);

  return (
    <div className="lp-root">
      <div className={`lp-intro ${phase!=='logo'?'lp-intro-exit':''}`}>
        <div className="lp-intro-inner">
          <div className="lp-intro-icon"><AIcon size={40}/></div>
          <div className="lp-intro-text"><h1>AttachFlow</h1><span>Industrial Attachment Management</span></div>
        </div>
        <div className="lp-intro-line"/>
      </div>
      <div className={`lp-main ${phase==='done'?'lp-main-visible':''}`}>
        <nav className="lp-nav">
          <div className="lp-nav-brand"><div className="lp-nav-icon"><AIcon size={14}/></div><span>AttachFlow</span></div>
          <div className="lp-nav-links"><button onClick={()=>navigate('/login')}>Sign In</button><button className="lp-nav-cta" onClick={()=>navigate('/register')}>Get Started</button></div>
        </nav>
        <section className="lp-hero">
          <div className="lp-hero-slides">
            {SLIDES.map((s,i)=><div key={i} className={`lp-slide ${i===cs?(sd==='in'?'lp-slide-active':'lp-slide-exit'):''}`}><img src={s.src} alt={s.alt}/></div>)}
            <div className="lp-hero-overlay"/>
          </div>
          <div className="lp-hero-content">
            <h1>Industrial Attachment,<br/>Simplified.</h1>
            <p>A centralized platform connecting students with organizations, automating placement matching, and digitizing the entire attachment workflow.</p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={()=>navigate('/register')}>Create Account <ArrowRight size={16}/></button>
              <button className="lp-btn-outline" onClick={()=>navigate('/login')}>Sign In</button>
            </div>
          </div>
          <div className="lp-hero-indicators">{SLIDES.map((_,i)=><button key={i} className={`lp-indicator ${i===cs?'active':''}`} onClick={()=>{setCs(i);setSd('in');}}/>)}</div>
          <button className="lp-scroll-hint" onClick={()=>document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}><ChevronDown size={20}/></button>
        </section>
        <section className="lp-features" id="features">
          <RevealDiv className="lp-section-header"><h2>Everything you need for industrial attachment</h2><p>From registration to assessment — one platform for students, organizations, and supervisors.</p></RevealDiv>
          <div className="lp-features-grid">{FEATURES.map((f,i)=>{const I=f.icon;return<RevealDiv key={i} delay={i*0.1} className="lp-feature-card"><div className="lp-feature-icon"><I size={20} strokeWidth={1.6}/></div><h3>{f.title}</h3><p>{f.desc}</p><div className="lp-feature-line"/></RevealDiv>;})}</div>
        </section>
        <section className="lp-roles">
          <RevealDiv className="lp-section-header"><h2>Built for every stakeholder</h2></RevealDiv>
          <div className="lp-roles-grid">{ROLES.map((r,i)=><RevealDiv key={i} delay={i*0.08} direction="left" className="lp-role-card"><div className="lp-role-num">0{i+1}</div><h3>{r.role}</h3><p>{r.desc}</p></RevealDiv>)}</div>
        </section>
        <section className="lp-cta"><RevealDiv className="lp-cta-inner"><h2>Ready to get started?</h2><p>Join AttachFlow and streamline your industrial attachment experience.</p><button className="lp-btn-primary" onClick={()=>navigate('/register')}>Create Your Account <ArrowRight size={16}/></button></RevealDiv></section>
        <footer className="lp-footer"><div className="lp-footer-inner"><div className="lp-nav-brand"><div className="lp-nav-icon" style={{width:24,height:24}}><AIcon size={12}/></div><span>AttachFlow</span></div><div className="lp-footer-text">&copy; {new Date().getFullYear()} AttachFlow. All rights reserved.</div></div></footer>
      </div>
      <style>{`
.lp-root{--serif:'Lora',Georgia,serif;--sans:'Manrope',-apple-system,sans-serif;--navy:#0b1520;--navy3:#152238;--teal:#14b8a6;--teal-dim:rgba(20,184,166,0.06);--bright:#e2e8f0;--mid:#8b9bb4;--dim:#4b6280;--line:rgba(255,255,255,0.06);background:var(--navy);min-height:100vh;overflow-x:hidden;color:var(--bright)}
.lp-intro{position:fixed;inset:0;z-index:200;background:var(--navy);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity .9s ease,transform .9s cubic-bezier(.4,0,.2,1)}.lp-intro-exit{opacity:0;transform:scale(1.08);pointer-events:none}
.lp-intro-inner{display:flex;align-items:center;gap:18px;animation:introSlideUp .8s cubic-bezier(.16,1,.3,1) both}
.lp-intro-icon{width:68px;height:68px;border-radius:14px;background:var(--teal);display:flex;align-items:center;justify-content:center;color:#031c18;animation:introIconPop .6s cubic-bezier(.16,1,.3,1) .2s both}
@keyframes introIconPop{0%{transform:scale(.5) rotate(-10deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
.lp-intro-text h1{font-family:var(--serif);font-size:2.6rem;font-weight:600;color:var(--bright);letter-spacing:-.02em;line-height:1;animation:introTextFade .6s ease .4s both}
.lp-intro-text span{font-family:var(--sans);font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.12em;font-weight:500;animation:introTextFade .6s ease .6s both}
@keyframes introTextFade{0%{opacity:0;transform:translateX(-12px)}100%{opacity:1;transform:translateX(0)}}
@keyframes introSlideUp{0%{opacity:0;transform:translateY(30px)}100%{opacity:1;transform:translateY(0)}}
.lp-intro-line{width:1px;height:0;background:var(--teal);margin-top:28px;animation:lineGrow .8s ease 1s both}
@keyframes lineGrow{0%{height:0;opacity:0}100%{height:44px;opacity:.3}}
.lp-main{opacity:0;transition:opacity .6s ease .1s}.lp-main.lp-main-visible{opacity:1}
.lp-nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:14px 36px;background:rgba(11,21,32,0.6);backdrop-filter:blur(20px);border-bottom:1px solid var(--line)}
.lp-nav-brand{display:flex;align-items:center;gap:8px;font-family:var(--serif);font-size:1rem;font-weight:600;color:white}
.lp-nav-icon{width:30px;height:30px;border-radius:7px;background:var(--teal);display:flex;align-items:center;justify-content:center;color:#031c18}
.lp-nav-links{display:flex;align-items:center;gap:5px}
.lp-nav-links button{padding:7px 16px;background:none;border:none;color:rgba(255,255,255,0.6);font-family:var(--sans);font-size:.82rem;font-weight:500;cursor:pointer;transition:color .2s}
.lp-nav-links button:hover{color:white}
.lp-nav-cta{background:var(--teal)!important;color:#031c18!important;border-radius:6px;font-weight:600!important}
.lp-hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden}
.lp-hero-slides{position:absolute;inset:0}
.lp-slide{position:absolute;inset:0;opacity:0;transform:scale(1.06);transition:opacity .8s ease,transform 5s ease}
.lp-slide img{width:100%;height:100%;object-fit:cover;object-position:center 40%}
.lp-slide-active{opacity:1;transform:scale(1)}.lp-slide-exit{opacity:0;transform:scale(1.04);transition:opacity .6s ease,transform .6s ease}
.lp-hero-overlay{position:absolute;inset:0;background:linear-gradient(to right,rgba(11,21,32,0.93) 0%,rgba(11,21,32,0.75) 55%,rgba(11,21,32,0.50) 100%),linear-gradient(to top,rgba(11,21,32,0.95) 0%,transparent 30%)}
.lp-hero-content{position:relative;z-index:5;max-width:560px;padding:0 36px;padding-top:56px}
.lp-hero-content h1{font-family:var(--serif);font-size:2.8rem;font-weight:600;color:white;line-height:1.15;letter-spacing:-.02em;margin-bottom:16px}
.lp-hero-content p{font-family:var(--sans);font-size:.95rem;color:var(--mid);line-height:1.7;margin-bottom:28px}
.lp-hero-btns{display:flex;gap:10px}
.lp-btn-primary{display:inline-flex;align-items:center;gap:7px;padding:12px 24px;background:var(--teal);color:#031c18;border:none;border-radius:6px;font-family:var(--sans);font-size:.85rem;font-weight:600;cursor:pointer;transition:opacity .2s,transform .2s}
.lp-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
.lp-btn-outline{padding:12px 24px;background:rgba(255,255,255,0.04);color:var(--bright);border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-family:var(--sans);font-size:.85rem;font-weight:500;cursor:pointer;transition:background .2s}
.lp-btn-outline:hover{background:rgba(255,255,255,0.08)}
.lp-hero-indicators{position:absolute;bottom:72px;left:36px;z-index:10;display:flex;gap:7px}
.lp-indicator{width:28px;height:3px;border-radius:2px;background:rgba(255,255,255,0.18);border:none;cursor:pointer;transition:all .3s ease}
.lp-indicator.active{width:44px;background:var(--teal)}
.lp-scroll-hint{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);z-index:10;background:none;border:none;color:rgba(255,255,255,0.25);cursor:pointer;animation:hintBounce 2s ease infinite}
@keyframes hintBounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)}}
.lp-section-header{text-align:center;margin-bottom:44px}
.lp-section-header h2{font-family:var(--serif);font-size:1.8rem;font-weight:600;color:var(--bright);letter-spacing:-.01em;margin-bottom:8px}
.lp-section-header p{font-family:var(--sans);color:var(--mid);font-size:.9rem;max-width:480px;margin:0 auto}
.lp-features{padding:90px 36px;max-width:1020px;margin:0 auto}
.lp-features-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.lp-feature-card{background:var(--navy3);border:1px solid var(--line);border-radius:12px;padding:24px;position:relative;overflow:hidden;transition:border-color .3s,transform .3s}
.lp-feature-card:hover{border-color:rgba(20,184,166,0.15);transform:translateY(-2px)}
.lp-feature-icon{width:40px;height:40px;border-radius:8px;background:var(--teal-dim);display:flex;align-items:center;justify-content:center;color:var(--teal);margin-bottom:12px}
.lp-feature-card h3{font-family:var(--sans);font-size:.9rem;font-weight:600;color:var(--bright);margin-bottom:6px}
.lp-feature-card p{font-family:var(--sans);font-size:.8rem;color:var(--mid);line-height:1.6}
.lp-feature-line{position:absolute;bottom:0;left:24px;right:24px;height:2px;background:var(--teal);transform:scaleX(0);transform-origin:left;transition:transform .4s ease}
.lp-feature-card:hover .lp-feature-line{transform:scaleX(1)}
.lp-roles{padding:72px 36px;max-width:1020px;margin:0 auto}
.lp-roles-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.lp-role-card{padding:22px 18px;border:1px solid var(--line);border-radius:12px;transition:border-color .3s,transform .3s}
.lp-role-card:hover{border-color:rgba(20,184,166,0.15);transform:translateY(-2px)}
.lp-role-num{font-family:var(--serif);font-size:1.6rem;font-weight:600;color:rgba(20,184,166,0.12);margin-bottom:8px;line-height:1}
.lp-role-card h3{font-family:var(--sans);font-size:.85rem;font-weight:600;color:var(--bright);margin-bottom:5px}
.lp-role-card p{font-family:var(--sans);font-size:.76rem;color:var(--mid);line-height:1.6}
.lp-cta{padding:72px 36px}
.lp-cta-inner{max-width:1020px;margin:0 auto;text-align:center;padding:48px 36px;background:var(--navy3);border:1px solid var(--line);border-radius:14px}
.lp-cta-inner h2{font-family:var(--serif);font-size:1.7rem;font-weight:600;color:var(--bright);margin-bottom:8px}
.lp-cta-inner p{font-family:var(--sans);color:var(--mid);margin-bottom:22px;font-size:.9rem}
.lp-footer{padding:24px 36px;border-top:1px solid var(--line)}
.lp-footer-inner{max-width:1020px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.lp-footer-text{font-family:var(--sans);font-size:.7rem;color:var(--dim)}
@media(max-width:900px){.lp-features-grid{grid-template-columns:1fr}.lp-roles-grid{grid-template-columns:1fr 1fr}.lp-hero-content h1{font-size:2.2rem}.lp-nav,.lp-hero-content,.lp-features,.lp-roles,.lp-cta,.lp-footer{padding-left:18px;padding-right:18px}.lp-hero-indicators{left:18px}}
@media(max-width:600px){.lp-roles-grid{grid-template-columns:1fr}.lp-hero-content h1{font-size:1.8rem}.lp-hero-btns{flex-direction:column}.lp-footer-inner{flex-direction:column;gap:10px;text-align:center}.lp-intro-text h1{font-size:1.8rem}.lp-intro-icon{width:50px;height:50px}.lp-intro-inner{gap:12px}}
      `}</style>
    </div>
  );
}
