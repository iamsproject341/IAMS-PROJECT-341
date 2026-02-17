import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { LogIn, ShieldCheck, Users, BarChart3, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn({ email, password });
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page auth-page-enter">
      <div className="auth-left">
        <div className="auth-card">
          <button className="btn btn-ghost" onClick={() => navigate('/auth')} style={{ marginBottom: 20, gap: 6, color: 'var(--text-muted)' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <div className="auth-header">
            <div className="auth-logo"><Logo size="lg" /></div>
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email Address <span style={{ color: 'var(--error)' }}>*</span></label>
              <input type="email" className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@email.com" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                autoComplete="email" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password <span style={{ color: 'var(--error)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                  style={{ paddingRight: 44 }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>
          <div className="auth-footer">Don't have an account? <Link to="/register">Create one</Link></div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-right-content">
          <h2>Streamline Industrial Attachments</h2>
          <p>A centralized platform connecting students, organizations, and supervisors for seamless attachment management.</p>
          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-icon"><Users size={17} /></div><div><h4>Smart Matching</h4><p>Automated student-organization pairing based on skills and preferences</p></div></div>
            <div className="auth-feature"><div className="auth-feature-icon"><ShieldCheck size={17} /></div><div><h4>Secure & Reliable</h4><p>Role-based access for students, organizations, and coordinators</p></div></div>
            <div className="auth-feature"><div className="auth-feature-icon"><BarChart3 size={17} /></div><div><h4>Digital Logbooks</h4><p>Weekly progress tracking with online submission and review</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
