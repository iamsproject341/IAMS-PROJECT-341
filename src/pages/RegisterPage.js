import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { UserPlus, Eye, EyeOff, GraduationCap, Building2, ShieldCheck, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Looking for attachment placement' },
  { id: 'organization', label: 'Organization', icon: Building2, desc: 'Hosting students for attachment' },
  { id: 'coordinator', label: 'Coordinator', icon: ShieldCheck, desc: 'Managing the attachment process' },
  { id: 'supervisor', label: 'Supervisor', icon: BookOpen, desc: 'University or industry supervisor' },
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return toast.error('Please fill in all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPw) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await signUp({ email, password, fullName, role });
      toast.success('Account created! Check your email to verify, or sign in directly.');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-card" style={{ maxWidth: step === 1 ? 520 : 420 }}>
          <div className="auth-header">
            <div className="auth-logo">
              <Logo size="lg" />
            </div>
            <h2>{step === 1 ? 'Select your role' : 'Create your account'}</h2>
            <p>{step === 1 ? 'Choose how you will use AttachFlow' : `Registering as ${role}`}</p>
          </div>

          {step === 1 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const selected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        padding: '20px 16px',
                        background: selected ? 'var(--accent-light)' : 'var(--bg-input)',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 'var(--radius-sm)',
                          background: selected ? 'rgba(20,184,166,0.2)' : 'var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={20} color={selected ? '#14b8a6' : '#5a7192'} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: selected ? '#14b8a6' : 'var(--text-primary)' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: 24 }}
                disabled={!role}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  {role === 'organization' ? 'Organization Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={role === 'organization' ? 'e.g. Botswana Innovation Hub' : 'e.g. John Doe'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: 40 }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        padding: 4, display: 'flex',
                      }}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Repeat password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><UserPlus size={18} /> Create Account</>}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-content">
          <h2>Join the Platform</h2>
          <p>
            Whether you are a student seeking placement, an organization hosting interns, or a supervisor tracking progress — AttachFlow has you covered.
          </p>
        </div>
      </div>
    </div>
  );
}
