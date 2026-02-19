import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, supabaseAdmin } from '../lib/supabase';
import {
  UserPlus, Building2, BookOpen, ShieldCheck, Users,
  Trash2, Copy, Check, Eye, EyeOff, RefreshCw,
  GraduationCap, Search, X, ChevronDown, ChevronUp,
  Mail, Calendar,
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

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPage() {
  const { profile, user } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [activeTab, setActiveTab] = useState('create');
  const [students, setStudents] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [search, setSearch] = useState('');

  // Create form state
  const [newRole, setNewRole] = useState('organization');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [showPw, setShowPw] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);
  const [copied, setCopied] = useState(false);

  // Expanded row
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState(null);

  useEffect(function() {
    loadAll();
    // eslint-disable-next-line
  }, []);

  async function loadAll() {
    // Safety timeout — never hang longer than 8 seconds
    var timedOut = false;
    var timer = setTimeout(function() {
      timedOut = true;
      console.warn('loadAll timed out');
      setDataLoaded(true);
    }, 8000);

    try {
      var result = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

      if (timedOut) return; // Already resolved via timeout
      clearTimeout(timer);

      var all = (result && result.data) ? result.data : [];

      if (result && result.error) {
        console.error('Profiles error:', result.error);
      }

      setStudents(all.filter(function(p) { return p.role === 'student'; }));
      setOrgs(all.filter(function(p) { return p.role === 'organization'; }));
      setSupervisors(all.filter(function(p) { return p.role === 'supervisor' || p.role === 'coordinator'; }));
    } catch (err) {
      if (timedOut) return;
      clearTimeout(timer);
      console.error('Load error:', err);
    }
    setDataLoaded(true);
  }

  // ── Create account ──
  function resetForm() {
    setFullName('');
    setEmail('');
    setPassword(generatePassword());
    setShowPw(true);
    setCreatedAccount(null);
    setCopied(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error('Enter a name');
    if (!email.trim()) return toast.error('Enter an email');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setCreating(true);

    var supabaseUrl = 'https://tswpcrejjlpkcfdbzjio.supabase.co';
    var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3BjcmVqamxwa2NmZGJ6amlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDc4MDEsImV4cCI6MjA4NjkyMzgwMX0.enA3lhX72jCEvaAdigFOEBORmWvGK36MB6aHLISR6CU';

    // Safety timeout — if anything hangs for more than 10 seconds, force complete
    var safetyTimer = setTimeout(function() {
      setCreating(false);
      toast.success('Account likely created. Refreshing list...');
      setCreatedAccount({ fullName: fullName.trim(), email: email.trim(), password: password, role: newRole });
      loadAll();
    }, 10000);

    try {
      var response = await fetch(supabaseUrl + '/auth/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          data: { full_name: fullName.trim(), role: newRole },
        }),
      });

      clearTimeout(safetyTimer);

      var result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || result.error_description || result.message || 'Signup failed');
      }

      if (result.identities && result.identities.length === 0) {
        throw new Error('An account with this email already exists.');
      }

      // Success — show credentials immediately
      setCreatedAccount({ fullName: fullName.trim(), email: email.trim(), password: password, role: newRole });
      toast.success(newRole.charAt(0).toUpperCase() + newRole.slice(1) + ' account created!');
      setCreating(false);

      // Refresh list in background after a delay (let trigger create the profile)
      setTimeout(function() { loadAll(); }, 2000);

    } catch (err) {
      clearTimeout(safetyTimer);
      console.error('Create error:', err);
      toast.error(err.message || 'Failed to create account');
      setCreating(false);
    }
  }

  function copyCredentials() {
    if (!createdAccount) return;
    const baseUrl = window.location.origin + (process.env.PUBLIC_URL || '');
    const text = [
      'AttachFlow Login Credentials',
      '',
      'Role: ' + createdAccount.role,
      'Name: ' + createdAccount.fullName,
      'Email: ' + createdAccount.email,
      'Password: ' + createdAccount.password,
      '',
      'Sign in at: ' + baseUrl + '/login',
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Credentials copied!');
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => toast.error('Copy failed'));
  }

  // ── Delete account ──
  async function handleDelete(id, name) {
    if (!window.confirm('Remove "' + name + '" from the system?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Account removed');
      setExpandedId(null);
      loadAll();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to remove. Try deleting from Supabase dashboard.');
    }
  }

  // ── Expand row ──
  async function toggleExpand(id, accRole) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(id);
    setExpandedData(null);

    try {
      if (accRole === 'student') {
        const { data } = await supabase.from('student_preferences').select('*').eq('student_id', id).maybeSingle();
        setExpandedData(data || 'empty');
      } else if (accRole === 'organization') {
        const { data } = await supabase.from('org_preferences').select('*').eq('org_id', id).maybeSingle();
        setExpandedData(data || 'empty');
      } else {
        setExpandedData('empty');
      }
    } catch (err) {
      console.error('Expand error:', err);
      setExpandedData('empty');
    }
  }

  // ── Filter ──
  function filtered(list) {
    if (!search.trim()) return list;
    var s = search.toLowerCase();
    return list.filter(function(a) {
      return (a.full_name || '').toLowerCase().indexOf(s) !== -1 ||
        (a.email || '').toLowerCase().indexOf(s) !== -1 ||
        (a.student_id || '').indexOf(s) !== -1;
    });
  }

  // ── Guard ──
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

  // ── Tag renderer ──
  function renderTags(label, items, color) {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}: </span>
        {items.map(function(item) {
          return (
            <span key={item} style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 5,
              background: color + '12', color: color, fontSize: '0.74rem',
              fontWeight: 500, marginRight: 5, marginBottom: 3,
            }}>{item}</span>
          );
        })}
      </div>
    );
  }

  // ── Table renderer ──
  function renderTable(list, roleType, title, emptyMsg, EmptyIcon) {
    return (
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="card-title">{title}</div>
          </div>
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-input" placeholder="Search..."
              value={search} onChange={function(e) { setSearch(e.target.value); }}
              style={{ paddingLeft: 30, height: 34, fontSize: '0.78rem' }}
            />
            {search && (
              <button onClick={function() { setSearch(''); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>
          <span className="badge badge-teal">{list.length}</span>
        </div>

        {!dataLoaded ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon"><EmptyIcon size={26} /></div>
            <h3>{search ? 'No results' : 'Empty'}</h3>
            <p>{search ? 'No match for "' + search + '"' : emptyMsg}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {roleType === 'student' && <th>Student ID</th>}
                  <th>Role</th>
                  <th>Joined</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(function(acc) {
                  var isExpanded = expandedId === acc.id;
                  return (
                    <React.Fragment key={acc.id}>
                      <tr
                        onClick={function() { toggleExpand(acc.id, acc.role); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isExpanded ? <ChevronUp size={13} color="#14b8a6" /> : <ChevronDown size={13} color="var(--text-muted)" />}
                            {acc.full_name || '—'}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{acc.email || '—'}</td>
                        {roleType === 'student' && <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{acc.student_id || '—'}</td>}
                        <td>
                          <span className={'badge ' + (acc.role === 'student' ? 'badge-teal' : acc.role === 'organization' ? 'badge-blue' : 'badge-amber')}
                            style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>{acc.role}</span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmtDate(acc.created_at)}</td>
                        <td onClick={function(e) { e.stopPropagation(); }}>
                          <button className="btn btn-danger btn-sm" onClick={function() { handleDelete(acc.id, acc.full_name); }} title="Remove">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={roleType === 'student' ? 6 : 5} style={{ padding: 0 }}>
                            <div style={{ background: 'var(--bg-input)', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                              {/* Contact */}
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} />{acc.email}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />Joined {fmtDate(acc.created_at)}</span>
                                {acc.student_id && <span style={{ fontFamily: 'monospace' }}>ID: {acc.student_id}</span>}
                                {acc.phone && <span>Phone: {acc.phone}</span>}
                              </div>

                              {/* Loading prefs */}
                              {expandedData === null && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Loading...
                                </div>
                              )}

                              {/* Empty prefs */}
                              {expandedData === 'empty' && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                  {acc.role === 'student' ? 'No preferences submitted yet.' : acc.role === 'organization' ? 'No preferences submitted yet.' : 'No additional details.'}
                                </div>
                              )}

                              {/* Student prefs */}
                              {expandedData && expandedData !== 'empty' && acc.role === 'student' && (
                                <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 8 }}>Preferences</div>
                                  {renderTags('Skills', expandedData.skills, '#14b8a6')}
                                  {renderTags('Project Types', expandedData.project_types, '#3b82f6')}
                                  {renderTags('Locations', expandedData.locations, '#f59e0b')}
                                  {expandedData.additional_notes && (
                                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                      <strong>Notes:</strong> {expandedData.additional_notes}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Org prefs */}
                              {expandedData && expandedData !== 'empty' && acc.role === 'organization' && (
                                <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 8 }}>Preferences</div>
                                  {renderTags('Desired Skills', expandedData.desired_skills, '#14b8a6')}
                                  {renderTags('Project Types', expandedData.project_types, '#3b82f6')}
                                  <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 16 }}>
                                    <span>Location: <strong>{expandedData.location || '—'}</strong></span>
                                    <span>Capacity: <strong>{expandedData.num_students || '—'} students</strong></span>
                                  </div>
                                  {expandedData.description && (
                                    <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                      <strong>Description:</strong> {expandedData.description}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════ RENDER ═══════════════════════
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Accounts</h1>
        <p className="page-subtitle">Create and manage all accounts in the system.</p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Students', count: students.length, icon: GraduationCap, color: '#14b8a6' },
          { label: 'Organizations', count: orgs.length, icon: Building2, color: '#3b82f6' },
          { label: 'Supervisors', count: supervisors.filter(function(s) { return s.role === 'supervisor'; }).length, icon: BookOpen, color: '#f59e0b' },
          { label: 'Total', count: students.length + orgs.length + supervisors.length, icon: Users, color: '#8b5cf6' },
        ].map(function(s) {
          var I = s.icon;
          return (
            <div key={s.label} className="card" style={{ padding: '14px 16px', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dataLoaded ? s.count : '—'}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I size={17} color={s.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'create', label: 'Create Account', icon: UserPlus, count: null },
          { id: 'students', label: 'Students', icon: GraduationCap, count: students.length },
          { id: 'organizations', label: 'Organizations', icon: Building2, count: orgs.length },
          { id: 'supervisors', label: 'Supervisors', icon: BookOpen, count: supervisors.length },
        ].map(function(t) {
          var I = t.icon;
          var active = activeTab === t.id;
          return (
            <button key={t.id}
              onClick={function() { setActiveTab(t.id); setSearch(''); setExpandedId(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                background: 'none', border: 'none',
                borderBottom: active ? '2px solid #14b8a6' : '2px solid transparent',
                color: active ? '#14b8a6' : 'var(--text-muted)',
                fontWeight: active ? 600 : 400, fontSize: '0.82rem', cursor: 'pointer',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              <I size={14} /> {t.label}
              {t.count !== null && dataLoaded && (
                <span style={{
                  background: active ? '#14b8a618' : 'var(--bg-input)',
                  padding: '1px 7px', borderRadius: 10, fontSize: '0.68rem',
                }}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: CREATE ═══ */}
      {activeTab === 'create' && (
        <div>
          {createdAccount ? (
            <div className="card" style={{ border: '1px solid var(--border-accent)' }}>
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
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Create New Account</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {CREATABLE_ROLES.map(function(r) {
                  var I = r.icon;
                  var sel = newRole === r.id;
                  return (
                    <button key={r.id} type="button" onClick={function() { setNewRole(r.id); }} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '16px 12px',
                      background: sel ? 'var(--accent-light)' : 'var(--bg-input)',
                      border: '1px solid ' + (sel ? 'var(--accent)' : 'var(--border)'),
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      fontFamily: "'Manrope', sans-serif",
                    }}>
                      <I size={20} color={sel ? '#14b8a6' : '#4b6280'} />
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: sel ? '#14b8a6' : 'var(--text-primary)' }}>{r.label}</div>
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
                  <input type="text" className="form-input" required
                    placeholder={newRole === 'organization' ? 'e.g. Botswana Innovation Hub' : 'e.g. Dr. John Smith'}
                    value={fullName} onChange={function(e) { setFullName(e.target.value); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="email" className="form-input" required placeholder="user@email.com"
                    value={email} onChange={function(e) { setEmail(e.target.value); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input type={showPw ? 'text' : 'password'} className="form-input"
                        value={password} onChange={function(e) { setPassword(e.target.value); }}
                        style={{ paddingRight: 40, fontFamily: showPw ? 'monospace' : 'inherit' }}
                      />
                      <button type="button" onClick={function() { setShowPw(!showPw); }}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={function() { setPassword(generatePassword()); }} title="Regenerate">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className="form-hint">Share this with the user. They should change it after first login.</div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={creating} style={{ minWidth: 200 }}>
                  {creating
                    ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating...</>
                    : <><UserPlus size={18} /> Create {newRole} Account</>
                  }
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: STUDENTS ═══ */}
      {activeTab === 'students' && renderTable(filtered(students), 'student', 'Registered Students', 'No students have registered yet.', GraduationCap)}

      {/* ═══ TAB: ORGANIZATIONS ═══ */}
      {activeTab === 'organizations' && renderTable(filtered(orgs), 'organization', 'Organizations', 'No organizations yet. Create one from the Create Account tab.', Building2)}

      {/* ═══ TAB: SUPERVISORS ═══ */}
      {activeTab === 'supervisors' && renderTable(filtered(supervisors), 'supervisor', 'Supervisors & Coordinators', 'No supervisors yet. Create one from the Create Account tab.', BookOpen)}
    </div>
  );
}
