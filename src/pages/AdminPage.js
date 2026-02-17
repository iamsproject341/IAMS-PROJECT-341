import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  UserPlus, Building2, BookOpen, ShieldCheck, Users,
  Trash2, Copy, Check, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CREATABLE_ROLES = [
  { id: 'organization', label: 'Organization', icon: Building2, desc: 'Host students for attachment' },
  { id: 'supervisor', label: 'Supervisor', icon: BookOpen, desc: 'University or industry supervisor' },
  { id: 'coordinator', label: 'Coordinator', icon: ShieldCheck, desc: 'Manage the attachment process' },
];

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export default function AdminPage() {
  const { profile, user } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [newRole, setNewRole] = useState('organization');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [showPw, setShowPw] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Created account details (shown after creation)
  const [createdAccount, setCreatedAccount] = useState(null);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['organization', 'supervisor', 'coordinator'])
        .order('created_at', { ascending: false });
      setAccounts(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function resetForm() {
    setFullName('');
    setEmail('');
    setPassword(generatePassword());
    setShowPw(true);
    setShowForm(false);
    setCreatedAccount(null);
    setCopied(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error('Enter a name');
    if (!email.trim()) return toast.error('Enter an email');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setCreating(true);
    try {
      // Create user via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: newRole },
        },
      });

      if (error) throw error;

      // The trigger will auto-create the profile.
      // But we also update the profile to make sure student_id etc. is set
      if (data?.user) {
        // Small delay for the trigger to fire
        await new Promise(r => setTimeout(r, 1000));

        await supabase.from('profiles').update({
          full_name: fullName,
          role: newRole,
        }).eq('id', data.user.id);
      }

      setCreatedAccount({ fullName, email, password, role: newRole });
      toast.success(`${newRole} account created!`);
      loadAccounts();
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  }

  function copyCredentials() {
    if (!createdAccount) return;
    const text = `AttachFlow Login Credentials\n\nRole: ${createdAccount.role}\nName: ${createdAccount.fullName}\nEmail: ${createdAccount.email}\nPassword: ${createdAccount.password}\n\nSign in at: ${window.location.origin}${window.location.pathname}#/login`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Credentials copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => toast.error('Copy failed — select and copy manually'));
  }

  async function deleteAccount(accountId) {
    if (!window.confirm('Remove this account from the system? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', accountId);
      if (error) throw error;
      toast.success('Account removed');
      loadAccounts();
    } catch (err) {
      toast.error('Failed to remove. The user may need to be deleted from Supabase Auth dashboard.');
    }
  }

  if (role !== 'coordinator') {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><ShieldCheck size={28} /></div>
          <h3>Coordinator Only</h3>
          <p>Account management is only accessible to coordinators.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Account Management</h1>
          <p className="page-subtitle">Create and manage organization, supervisor, and coordinator accounts.</p>
        </div>
        {!showForm && !createdAccount && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <UserPlus size={16} /> Create Account
          </button>
        )}
      </div>

      {/* ===== CREATED ACCOUNT SUCCESS ===== */}
      {createdAccount && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid var(--border-accent)' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: 'var(--success)' }}>Account Created Successfully</div>
              <div className="card-subtitle">Share these credentials with the user. They can change their password after signing in.</div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
            padding: 18, marginBottom: 16, fontFamily: 'monospace', fontSize: '0.84rem',
            lineHeight: 1.8, color: 'var(--text-secondary)',
          }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Role:</span> <strong style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{createdAccount.role}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong style={{ color: 'var(--text-primary)' }}>{createdAccount.fullName}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong style={{ color: 'var(--text-primary)' }}>{createdAccount.email}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Password:</span> <strong style={{ color: 'var(--warning)' }}>{createdAccount.password}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={copyCredentials}>
              {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Credentials</>}
            </button>
            <button className="btn btn-secondary" onClick={resetForm}>Create Another</button>
            <button className="btn btn-ghost" onClick={resetForm}>Close</button>
          </div>
        </div>
      )}

      {/* ===== CREATE FORM ===== */}
      {showForm && !createdAccount && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">Create New Account</div>
            <button className="btn btn-ghost btn-sm" onClick={resetForm}>Cancel</button>
          </div>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {CREATABLE_ROLES.map((r) => {
              const Icon = r.icon;
              const selected = newRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setNewRole(r.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '16px 12px',
                    background: selected ? 'var(--accent-light)' : 'var(--bg-input)',
                    border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    transition: 'all 150ms ease', textAlign: 'center',
                  }}
                >
                  <Icon size={20} color={selected ? '#14b8a6' : '#4b6280'} />
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: selected ? '#14b8a6' : 'var(--text-primary)' }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">
                {newRole === 'organization' ? 'Organization Name' : 'Full Name'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={newRole === 'organization' ? 'e.g. Botswana Innovation Hub' : 'e.g. Dr. John Smith'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="user@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: 40, fontFamily: showPw ? 'monospace' : 'inherit' }}
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPassword(generatePassword())}
                  title="Generate new password"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="form-hint">Share this password with the user. They should change it after first login.</div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={creating}>
              {creating ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><UserPlus size={18} /> Create {newRole} Account</>}
            </button>
          </form>
        </div>
      )}

      {/* ===== ACCOUNTS LIST ===== */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Managed Accounts</div>
            <div className="card-subtitle">Organizations, supervisors, and coordinators in the system</div>
          </div>
          <span className="badge badge-teal">{accounts.length} accounts</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : accounts.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon"><Users size={26} /></div>
            <h3>No Accounts Yet</h3>
            <p>Create organization and supervisor accounts using the button above.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{acc.full_name}</td>
                    <td>{acc.email}</td>
                    <td>
                      <span className={`badge ${
                        acc.role === 'organization' ? 'badge-blue' :
                        acc.role === 'supervisor' ? 'badge-amber' :
                        'badge-teal'
                      }`} style={{ textTransform: 'capitalize' }}>
                        {acc.role === 'organization' && <Building2 size={10} />}
                        {acc.role === 'supervisor' && <BookOpen size={10} />}
                        {acc.role === 'coordinator' && <ShieldCheck size={10} />}
                        {acc.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(acc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteAccount(acc.id)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
