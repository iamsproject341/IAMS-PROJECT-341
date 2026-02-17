import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { UserPlus, Eye, EyeOff, GraduationCap, Users, BookOpen, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    else if (fullName.trim().length < 2) e.fullName = 'Name must be at least 2 characters';
    if (!studentId.trim()) e.studentId = 'Student ID is required';
    else if (!/^\d{9}$/.test(studentId.trim())) e.studentId = 'Student ID must be exactly 9 digits';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = 'Must contain letters and numbers';
    if (!confirmPw) e.confirmPw = 'Please confirm your password';
    else if (password !== confirmPw) e.confirmPw = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function clearError(field) { setErrors(p => ({ ...p, [field]: '' })); }

  function handleStudentIdChange(val) {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 9);
    setStudentId(cleaned);
    clearError('studentId');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp({ email, password, fullName, role: 'student' });
      toast.success(
        (t) => (
          <div>
            <strong>Account created!</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.85 }}>
              Check your email to verify your account.
            </p>
          </div>
        ),
        { duration: 5000 }
      );
      setTimeout(() => { navigate('/login'); }, 3000);
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page auth-page-enter">
      <div className="auth-left">
        <div className="auth-card">
          <button className="btn btn-ghost" onClick={() => navigate('/auth')} style={{ marginBottom: 18, gap: 6, color: 'var(--text-muted)' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <div className="auth-header">
            <div className="auth-logo"><Logo size="lg" /></div>
            <h2>Student Registration</h2>
            <p>Create your account to get started with industrial attachment</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input type="text" className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="e.g. John Doe" value={fullName}
                onChange={(e) => { setFullName(e.target.value); clearError('fullName'); }} />
              {errors.fullName && <div className="form-error">{errors.fullName}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Student ID <span style={{ color: 'var(--error)' }}>*</span></label>
              <input type="text" inputMode="numeric" className={`form-input ${errors.studentId ? 'input-error' : ''}`}
                placeholder="e.g. 202103579 (9 digits)" value={studentId}
                onChange={(e) => handleStudentIdChange(e.target.value)} />
              {errors.studentId && <div className="form-error">{errors.studentId}</div>}
              {!errors.studentId && studentId && <div className="form-hint">{studentId.length}/9 digits</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address <span style={{ color: 'var(--error)' }}>*</span></label>
              <input type="email" className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@email.com" value={email}
                onChange={(e) => { setEmail(e.target.value); clearError('email'); }} autoComplete="email" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password <span style={{ color: 'var(--error)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Min. 6 characters" value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                    style={{ paddingRight: 38 }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span style={{ color: 'var(--error)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPw ? 'text' : 'password'} className={`form-input ${errors.confirmPw ? 'input-error' : ''}`}
                    placeholder="Repeat password" value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); clearError('confirmPw'); }}
                    style={{ paddingRight: 38 }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                    {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.confirmPw && <div className="form-error">{errors.confirmPw}</div>}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><UserPlus size={17} /> Create Account</>}
            </button>
          </form>
          <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
          <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Not a student?</strong> Organization, supervisor, and coordinator accounts are created by the department coordinator. Contact your coordinator for access.
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-right-content">
          <h2>Join AttachFlow</h2>
          <p>Register to set your preferences, get matched with organizations, and manage your attachment digitally.</p>
          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-icon"><GraduationCap size={16} /></div><div><h4>Set Preferences</h4><p>Choose your skills, project types, and locations</p></div></div>
            <div className="auth-feature"><div className="auth-feature-icon"><Users size={16} /></div><div><h4>Get Matched</h4><p>Automated matching based on your profile</p></div></div>
            <div className="auth-feature"><div className="auth-feature-icon"><BookOpen size={16} /></div><div><h4>Track Progress</h4><p>Submit weekly logbooks throughout your attachment</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
