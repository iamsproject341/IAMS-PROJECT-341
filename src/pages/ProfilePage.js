import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role || 'student';
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [studentId, setStudentId] = useState(profile?.student_id || '');
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      // Check if profile exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      const payload = {
        full_name: fullName,
        phone,
        student_id: studentId,
        role,
      };

      if (existing) {
        await updateProfile(payload);
      } else {
        const { error } = await supabase.from('profiles').insert({ id: user.id, email: user.email, ...payload });
        if (error) throw error;
      }
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account information.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--accent-light)', border: '3px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)',
            }}
          >
            {initials}
          </div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{fullName || 'User'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</div>
          <div style={{ marginTop: 10 }}>
            <span className="badge badge-teal" style={{ textTransform: 'capitalize' }}>{role}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>Account Details</div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">
                {role === 'organization' ? 'Organization Name' : 'Full Name'}
              </label>
              <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              <div className="form-hint">Email cannot be changed</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" placeholder="+267..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              {role === 'student' && (
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input type="text" className="form-input" placeholder="e.g. 202103579" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Save size={16} /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
