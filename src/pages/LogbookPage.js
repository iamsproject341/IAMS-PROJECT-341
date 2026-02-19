import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, BookOpen, Calendar, ChevronDown, ChevronUp, Lock, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LogbookPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [match, setMatch] = useState(null); // null = loading, false = no match, object = matched
  const [matchLoading, setMatchLoading] = useState(true);

  // Form fields
  const [weekNumber, setWeekNumber] = useState('');
  const [weekStarting, setWeekStarting] = useState('');
  const [activitiesPerformed, setActivitiesPerformed] = useState('');
  const [skillsLearned, setSkillsLearned] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && role === 'student') {
      checkMatch();
      loadEntries();
    } else {
      setLoading(false);
      setMatchLoading(false);
    }
    // eslint-disable-next-line
  }, [user, role]);

  async function checkMatch() {
    try {
      const { data } = await supabase
        .from('matches')
        .select('*, org:profiles!matches_org_id_fkey(full_name, email)')
        .eq('student_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      setMatch(data || false);
    } catch (err) {
      console.error('Match check error:', err);
      setMatch(false);
    }
    setMatchLoading(false);
  }

  async function loadEntries() {
    try {
      const { data, error } = await supabase
        .from('logbooks')
        .select('*')
        .eq('student_id', user.id)
        .order('week_number', { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function resetForm() {
    setWeekNumber('');
    setWeekStarting('');
    setActivitiesPerformed('');
    setSkillsLearned('');
    setChallenges('');
    setNextWeekPlan('');
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!weekNumber || !weekStarting || !activitiesPerformed) {
      return toast.error('Please fill in required fields');
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('logbooks').insert({
        student_id: user.id,
        week_number: parseInt(weekNumber),
        week_starting: weekStarting,
        activities_performed: activitiesPerformed,
        skills_learned: skillsLearned,
        challenges,
        next_week_plan: nextWeekPlan,
      });
      if (error) throw error;
      toast.success('Logbook entry submitted!');
      resetForm();
      loadEntries();
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    }
    setSubmitting(false);
  }

  // Guard: not a student
  if (role !== 'student') {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={28} /></div>
          <h3>Student Feature</h3>
          <p>Logbook submission is only available for students.</p>
        </div>
      </div>
    );
  }

  // Loading
  if (matchLoading || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  // ── LOCKED: Student not yet matched ──
  if (!match) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Weekly Logbook</h1>
            <p className="page-subtitle">Document your weekly activities and progress during attachment.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty-state" style={{ padding: '60px 24px' }}>
            <div className="empty-state-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Lock size={28} color="#f59e0b" />
            </div>
            <h3>Logbook Locked</h3>
            <p style={{ maxWidth: 400 }}>
              You need to be matched with an organization before you can start submitting logbook entries.
              Please ensure you have submitted your preferences and wait for the coordinator to approve your placement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── UNLOCKED: Student is matched ──
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Weekly Logbook</h1>
          <p className="page-subtitle">Document your weekly activities and progress during attachment.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Entry
          </button>
        )}
      </div>

      {/* Match info banner */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', border: '1px solid rgba(20,184,166,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f615', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Placed at</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{match.org?.full_name}</div>
          </div>
          <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Active Placement</span>
        </div>
      </div>

      {/* New entry form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">New Logbook Entry</div>
            <button className="btn btn-ghost btn-sm" onClick={resetForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Week Number *</label>
                <input type="number" className="form-input" placeholder="e.g. 1" min={1} max={52}
                  value={weekNumber} onChange={e => setWeekNumber(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Week Starting Date *</label>
                <input type="date" className="form-input" value={weekStarting} onChange={e => setWeekStarting(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Activities Performed *</label>
              <textarea className="form-textarea" placeholder="Describe what you did this week..." value={activitiesPerformed}
                onChange={e => setActivitiesPerformed(e.target.value)} rows={4} />
            </div>
            <div className="form-group">
              <label className="form-label">Skills Learned</label>
              <textarea className="form-textarea" placeholder="What new skills or knowledge did you gain?" value={skillsLearned}
                onChange={e => setSkillsLearned(e.target.value)} rows={3} />
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Challenges Faced</label>
                <textarea className="form-textarea" placeholder="Any difficulties or obstacles..." value={challenges}
                  onChange={e => setChallenges(e.target.value)} rows={3} />
              </div>
              <div className="form-group">
                <label className="form-label">Plan for Next Week</label>
                <textarea className="form-textarea" placeholder="What do you plan to work on next?" value={nextWeekPlan}
                  onChange={e => setNextWeekPlan(e.target.value)} rows={3} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><BookOpen size={16} /> Submit Entry</>}
            </button>
          </form>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={28} /></div>
            <h3>No Entries Yet</h3>
            <p>Start documenting your weekly attachment activities by creating your first logbook entry.</p>
            {!showForm && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Create First Entry
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(entry => (
            <div key={entry.id} className="card" style={{ cursor: 'pointer' }}
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="stat-icon teal" style={{ width: 40, height: 40 }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Week {entry.week_number}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(entry.week_starting).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-green">Submitted</span>
                  {expandedId === entry.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>
              </div>
              {expandedId === entry.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Activities Performed</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{entry.activities_performed}</div>
                  </div>
                  {entry.skills_learned && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Skills Learned</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{entry.skills_learned}</div>
                    </div>
                  )}
                  {entry.challenges && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Challenges</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{entry.challenges}</div>
                    </div>
                  )}
                  {entry.next_week_plan && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Next Week Plan</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{entry.next_week_plan}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
