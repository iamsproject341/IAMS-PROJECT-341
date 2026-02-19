import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, supabaseAdmin } from '../lib/supabase';
import {
  UserPlus, Building2, BookOpen, ShieldCheck, Users,
  Trash2, Copy, Check, Eye, EyeOff, RefreshCw,
  GraduationCap, Search, X, ChevronDown, ChevronUp,
  Mail, Phone, Calendar, Hash, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Role configs ── */
const CREATABLE_ROLES = [
  { id: 'organization', label: 'Organization', icon: Building2, desc: 'Host students for attachment' },
  { id: 'supervisor', label: 'Supervisor', icon: BookOpen, desc: 'University or industry supervisor' },
  { id: 'coordinator', label: 'Coordinator', icon: ShieldCheck, desc: 'Manage the attachment process' },
];

const TABS = [
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'supervisors', label: 'Supervisors', icon: BookOpen },
];

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

/* ── Expandable row for details ── */
function ExpandableRow({ account, onDelete, roleType }) {
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  async function loadDetails() {
    if (prefs !== null) { setExpanded(!expanded); return; }
    setLoadingPrefs(true);
    setExpanded(true);
    try {
      if (roleType === 'student') {
        const { data } = await supabase
          .from('student_preferences')
          .select('*')
          .eq('student_id', account.id)
          .maybeSingle();
        setPrefs(data || {});
      } else if (roleType === 'organization') {
        const { data } = await supabase
          .from('org_preferences')
          .select('*')
          .eq('org_id', account.id)
          .maybeSingle();
        setPrefs(data || {});
      } else {
        setPrefs({});
      }
    } catch { setPrefs({}); }
    finally { setLoadingPrefs(false); }
  }

  return (
    <>
      <tr
        onClick={loadDetails}
        style={{ cursor: 'pointer', transition: 'background 150ms' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,184,166,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {expanded ? <ChevronUp size={14} color="var(--accent)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
            {account.full_name || '—'}
          </div>
        </td>
        <td style={{ fontSize: '0.82rem' }}>{account.email}</td>
        {roleType === 'student' && (
          <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{account.student_id || '—'}</td>
        )}
        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {new Date(account.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        <td>
          <button
            className="btn btn-danger btn-sm"
            onClick={(e) => { e.stopPropagation(); onDelete(account.id, account.full_name); }}
            title="Remove account"
          >
            <Trash2 size={13} />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={roleType === 'student' ? 5 : 4} style={{ padding: 0 }}>
            <div style={{
              background: 'var(--bg-input)',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              padding: '16px 20px',
              animation: 'fadeIn 200ms ease',
            }}>
              {loadingPrefs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}><div className="spinner" /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  {/* Contact info */}
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Contact</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <Mail size={13} color="var(--accent)" /> {account.email}
                    </div>
                    {account.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <Phone size={13} color="var(--accent)" /> {account.phone}
                      </div>
                    )}
                  </div>

                  {/* Student preferences */}
                  {roleType === 'student' && prefs && prefs.skills && (
                    <>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Skills</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(prefs.skills || []).map(s => (
                            <span key={s} className="badge badge-teal" style={{ fontSize: '0.68rem' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Project Types</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(prefs.project_types || []).map(p => (
                            <span key={p} className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{p}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Locations</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(prefs.locations || []).map(l => (
                            <span key={l} className="badge badge-amber" style={{ fontSize: '0.68rem' }}>{l}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {roleType === 'student' && (!prefs || !prefs.skills) && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No preferences submitted yet
                      </div>
                    </div>
                  )}

                  {/* Org preferences */}
                  {roleType === 'organization' && prefs && prefs.desired_skills && (
                    <>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Desired Skills</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(prefs.desired_skills || []).map(s => (
                            <span key={s} className="badge badge-teal" style={{ fontSize: '0.68rem' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Project Types</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(prefs.project_types || []).map(p => (
                            <span key={p} className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{p}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Details</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {prefs.location && <div>Location: {prefs.location}</div>}
                          {prefs.num_students && <div>Capacity: {prefs.num_students} student(s)</div>}
                        </div>
                      </div>
                    </>
                  )}

                  {roleType === 'organization' && (!prefs || !prefs.desired_skills) && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No preferences submitted yet
                      </div>
                    </div>
                  )}

                  {roleType === 'supervisor' && (
                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Supervisor account active
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


/* ══════════════════════════════════════════════
   Main AdminPage
   ══════════════════════════════════════════════ */
export default function AdminPage() {
  const { profile, user } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [newRole, setNewRole] = useState('organization');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [showPw, setShowPw] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const all = allProfiles || [];
      setStudents(all.filter(p => p.role === 'student'));
      setOrganizations(all.filter(p => p.role === 'organization'));
      setSupervisors(all.filter(p => p.role === 'supervisor' || p.role === 'coordinator'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

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
      // Uses supabaseAdmin so coordinator stays logged in
      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: newRole },
        },
      });

      if (error) throw error;

      if (data?.user) {
        await new Promise(r => setTimeout(r, 1500));
        await supabase.from('profiles').update({
          full_name: fullName,
          role: newRole,
        }).eq('id', data.user.id);
      }

      setCreatedAccount({ fullName, email, password, role: newRole });
      toast.success(`${newRole} account created!`);
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  }

  function copyCredentials() {
    if (!createdAccount) return;
    const baseUrl = window.location.origin + (process.env.PUBLIC_URL || '');
    const text = `AttachFlow Login Credentials\n\nRole: ${createdAccount.role}\nName: ${createdAccount.fullName}\nEmail: ${createdAccount.email}\nPassword: ${createdAccount.password}\n\nSign in at: ${baseUrl}/login`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Credentials copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => toast.error('Copy failed'));
  }

  async function deleteAccount(accountId, name) {
    if (!window.confirm(`Remove "${name || 'this account'}" from the system?`)) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', accountId);
      if (error) throw error;
      toast.success('Account removed');
      loadAll();
    } catch (err) {
      toast.error('Failed to remove. Delete from Supabase Auth dashboard instead.');
    }
  }

  // Access check
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

  // Filter by search
  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(a =>
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.student_id || '').toLowerCase().includes(q)
    );
  };

  const currentList = activeTab === 'students' ? filterList(students)
    : activeTab === 'organizations' ? filterList(organizations)
    : filterList(supervisors);

  const currentRoleType = activeTab === 'students' ? 'student'
    : activeTab === 'organizations' ? 'organization'
    : 'supervisor';

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Manage Accounts</h1>
          <p className="page-subtitle">
            View all users, create organization and supervisor accounts, and manage the system.
          </p>
        </div>
        {!showForm && !createdAccount && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <UserPlus size={16} /> Create Account
          </button>
        )}
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Students', count: students.length, icon: GraduationCap, color: '#14b8a6' },
          { label: 'Organizations', count: organizations.length, icon: Building2, color: '#3b82f6' },
          { label: 'Supervisors', count: supervisors.length, icon: BookOpen, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Created account success ── */}
      {createdAccount && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid var(--accent)' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: 'var(--success)' }}>Account Created Successfully</div>
              <div className="card-subtitle">Share these credentials with the user.</div>
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

      {/* ── Create form ── */}
      {showForm && !createdAccount && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">Create New Account</div>
            <button className="btn btn-ghost btn-sm" onClick={resetForm}><X size={16} /> Cancel</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {CREATABLE_ROLES.map((r) => {
              const Icon = r.icon;
              const selected = newRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
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
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: selected ? '#14b8a6' : 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">
                {newRole === 'organization' ? 'Organization Name' : 'Full Name'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" className="form-input"
                placeholder={newRole === 'organization' ? 'e.g. Botswana Innovation Hub' : 'e.g. Dr. John Smith'}
                value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="email" className="form-input" placeholder="user@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={showPw ? 'text' : 'password'} className="form-input"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: 40, fontFamily: showPw ? 'monospace' : 'inherit' }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex',
                  }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setPassword(generatePassword())} title="Generate new password">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="form-hint">Share this with the user. They should change it after first login.</div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={creating}>
              {creating ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><UserPlus size={18} /> Create {newRole} Account</>}
            </button>
          </form>
        </div>
      )}

      {/* ── Tabs + Search ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const count = tab.id === 'students' ? students.length
                : tab.id === 'organizations' ? organizations.length
                : supervisors.length;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 6,
                    background: active ? 'var(--bg-card)' : 'transparent',
                    border: active ? '1px solid var(--border)' : '1px solid transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 400,
                    fontSize: '0.82rem', cursor: 'pointer',
                    transition: 'all 150ms ease',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <Icon size={15} />
                  {tab.label}
                  <span style={{
                    background: active ? 'var(--accent)' : 'var(--bg-card)',
                    color: active ? '#031c18' : 'var(--text-muted)',
                    fontSize: '0.68rem', fontWeight: 700,
                    padding: '1px 6px', borderRadius: 10,
                    minWidth: 20, textAlign: 'center',
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text" className="form-input"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 32, height: 36, fontSize: '0.82rem' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex',
              }}><X size={14} /></button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : currentList.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">
              {activeTab === 'students' ? <GraduationCap size={26} /> : activeTab === 'organizations' ? <Building2 size={26} /> : <BookOpen size={26} />}
            </div>
            <h3>
              {searchQuery
                ? `No ${activeTab} matching "${searchQuery}"`
                : activeTab === 'students'
                  ? 'No students registered yet'
                  : `No ${activeTab} yet — create one using the button above`
              }
            </h3>
            <p>
              {activeTab === 'students'
                ? 'Students will appear here once they register on the site.'
                : 'Click "Create Account" to add organizations and supervisors.'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {currentRoleType === 'student' && <th>Student ID</th>}
                  <th>Joined</th>
                  <th style={{ width: 60 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map(acc => (
                  <ExpandableRow
                    key={acc.id}
                    account={acc}
                    onDelete={deleteAccount}
                    roleType={currentRoleType}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && currentList.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            Showing {currentList.length} {activeTab}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </div>
    </div>
  );
}
