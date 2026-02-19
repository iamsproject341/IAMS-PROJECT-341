import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase';
import {
  Shuffle, Check, Users, Award, Trash2, GraduationCap, Building2,
  MapPin, Briefcase, Zap, Lightbulb, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MatchingPage() {
  const { profile, user } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [studentPrefs, setStudentPrefs] = useState([]);
  const [orgPrefs, setOrgPrefs] = useState([]);
  const [results, setResults] = useState([]);
  const [approvedMatches, setApprovedMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState('run');
  const [expandedResult, setExpandedResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setFetching(true);
    try {
      // Load all preferences + existing matches using admin client
      const [spRes, opRes, mRes] = await Promise.all([
        supabaseAdmin.from('student_preferences')
          .select('*, student:profiles!student_preferences_student_id_fkey(id, full_name, email)'),
        supabaseAdmin.from('org_preferences')
          .select('*, org:profiles!org_preferences_org_id_fkey(id, full_name, email)'),
        supabaseAdmin.from('matches')
          .select('*, student:profiles!matches_student_id_fkey(full_name, email), org:profiles!matches_org_id_fkey(full_name, email)')
          .order('score', { ascending: false }),
      ]);

      setStudentPrefs(spRes.data || []);
      setOrgPrefs(opRes.data || []);
      setApprovedMatches(mRes.data || []);
    } catch (err) {
      console.error('Load error:', err);
    }
    setFetching(false);
  }

  // ── Smart Matching Algorithm ──
  async function runMatching() {
    setLoading(true);
    try {
      if (!studentPrefs.length || !orgPrefs.length) {
        toast.error('Need at least one student and one organization with preferences.');
        setLoading(false);
        return;
      }

      // Get already approved student IDs
      const approvedStudentIds = new Set(approvedMatches.filter(m => m.status === 'approved').map(m => m.student_id));

      // Score ALL possible pairs
      const allPairs = [];
      for (const sp of studentPrefs) {
        // Skip students already matched
        if (approvedStudentIds.has(sp.student?.id)) continue;

        for (const op of orgPrefs) {
          let score = 0;
          const studentSkills = sp.skills || [];
          const orgSkills = op.desired_skills || [];
          const studentProjects = sp.project_types || [];
          const orgProjects = op.project_types || [];
          const studentLocations = sp.locations || [];

          // Skill overlap (50 points)
          const matchedSkills = studentSkills.filter(s => orgSkills.includes(s));
          const skillScore = Math.round((matchedSkills.length / Math.max(orgSkills.length, 1)) * 50);
          score += skillScore;

          // Project type overlap (30 points)
          const matchedProjects = studentProjects.filter(p => orgProjects.includes(p));
          const projectScore = Math.round((matchedProjects.length / Math.max(orgProjects.length, 1)) * 30);
          score += projectScore;

          // Location match (20 points)
          const locMatch = studentLocations.includes('Any Location') || studentLocations.includes(op.location);
          if (locMatch) score += 20;

          allPairs.push({
            student_id: sp.student?.id,
            student_name: sp.student?.full_name,
            student_email: sp.student?.email,
            student_skills: studentSkills,
            student_projects: studentProjects,
            student_locations: studentLocations,
            org_id: op.org?.id,
            org_name: op.org?.full_name,
            org_email: op.org?.email,
            org_skills: orgSkills,
            org_projects: orgProjects,
            org_location: op.location || 'Not specified',
            org_capacity: op.num_students || 1,
            org_description: op.description || '',
            score,
            skillScore,
            projectScore,
            locScore: locMatch ? 20 : 0,
            matchedSkills,
            matchedProjects,
            location_match: locMatch,
          });
        }
      }

      // Sort by score descending
      allPairs.sort((a, b) => b.score - a.score);

      // Greedy 1-to-1 assignment: each student gets best available org, respect capacity
      const assignedStudents = new Set();
      const orgSlots = {}; // track remaining capacity

      for (const op of orgPrefs) {
        orgSlots[op.org?.id] = op.num_students || 1;
      }

      const finalMatches = [];
      for (const pair of allPairs) {
        if (assignedStudents.has(pair.student_id)) continue;
        if ((orgSlots[pair.org_id] || 0) <= 0) continue;

        finalMatches.push(pair);
        assignedStudents.add(pair.student_id);
        orgSlots[pair.org_id]--;
      }

      setResults(finalMatches);
      if (finalMatches.length > 0) {
        toast.success('Found ' + finalMatches.length + ' optimal match' + (finalMatches.length > 1 ? 'es' : '') + '!');
      } else {
        toast.error('No matches possible. Check that preferences have overlapping skills/projects.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Matching failed');
    }
    setLoading(false);
  }

  // ── Approve ──
  async function approveMatch(pair) {
    try {
      const { error } = await supabaseAdmin.from('matches').insert({
        student_id: pair.student_id,
        org_id: pair.org_id,
        score: pair.score,
        status: 'approved',
      });
      if (error) throw error;

      toast.success('Approved: ' + pair.student_name + ' → ' + pair.org_name);

      // Remove from results in real time
      setResults(prev => prev.filter(r => r.student_id !== pair.student_id));

      // Reload approved matches
      const { data } = await supabaseAdmin.from('matches')
        .select('*, student:profiles!matches_student_id_fkey(full_name, email), org:profiles!matches_org_id_fkey(full_name, email)')
        .order('score', { ascending: false });
      setApprovedMatches(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to approve');
    }
  }

  // ── Remove ──
  async function removeMatch(matchId) {
    if (!window.confirm('Remove this approved match?')) return;
    try {
      await supabaseAdmin.from('matches').delete().eq('id', matchId);
      toast.success('Match removed');
      setApprovedMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err) {
      toast.error('Failed to remove');
    }
  }

  // ── Generate insight text ──
  function getInsight(pair) {
    const reasons = [];
    if (pair.matchedSkills.length > 0) {
      reasons.push(pair.student_name + ' has ' + pair.matchedSkills.length + ' of ' + pair.org_skills.length + ' skills ' + pair.org_name + ' needs (' + pair.matchedSkills.join(', ') + ')');
    }
    if (pair.matchedProjects.length > 0) {
      reasons.push('Both align on ' + pair.matchedProjects.join(', ') + ' project type' + (pair.matchedProjects.length > 1 ? 's' : ''));
    }
    if (pair.location_match) {
      reasons.push('Location preference matches (' + pair.org_location + ')');
    }
    if (reasons.length === 0) reasons.push('Limited overlap — consider manually reviewing.');
    return reasons;
  }

  // ── Guard ──
  if (role !== 'coordinator') {
    return (
      <div className="card"><div className="empty-state"><div className="empty-state-icon"><Shuffle size={28} /></div><h3>Coordinator Only</h3></div></div>
    );
  }

  const approved = approvedMatches.filter(m => m.status === 'approved');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student-Organization Matching</h1>
        <p className="page-subtitle">Run the matching algorithm and approve student placements.</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={'tab ' + (tab === 'run' ? 'active' : '')} onClick={() => setTab('run')}>Run Matching</button>
        <button className={'tab ' + (tab === 'approved' ? 'active' : '')} onClick={() => setTab('approved')}>
          Approved ({approved.length})
        </button>
      </div>

      {/* ═══ TAB: RUN ═══ */}
      {tab === 'run' && (
        <>
          {/* Preferences summary before running */}
          {results.length === 0 && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* Students with prefs */}
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GraduationCap size={16} color="#14b8a6" />
                    <div className="card-title" style={{ fontSize: '0.88rem' }}>Students with Preferences</div>
                  </div>
                  <span className="badge badge-teal">{studentPrefs.length}</span>
                </div>
                {fetching ? (
                  <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" style={{ width: 20, height: 20 }} /></div>
                ) : studentPrefs.length === 0 ? (
                  <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>No students have submitted preferences yet.</div>
                ) : (
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {studentPrefs.map(sp => {
                      var isMatched = approved.some(m => m.student_id === sp.student?.id);
                      return (
                        <div key={sp.student_id} style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: '0.82rem', opacity: isMatched ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sp.student?.full_name}</div>
                            {isMatched && <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>Matched</span>}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: 2 }}>
                            {(sp.skills || []).length} skills • {(sp.project_types || []).length} project types • {(sp.locations || []).join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Orgs with prefs */}
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={16} color="#3b82f6" />
                    <div className="card-title" style={{ fontSize: '0.88rem' }}>Organizations with Preferences</div>
                  </div>
                  <span className="badge badge-blue">{orgPrefs.length}</span>
                </div>
                {fetching ? (
                  <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" style={{ width: 20, height: 20 }} /></div>
                ) : orgPrefs.length === 0 ? (
                  <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>No organizations have submitted preferences yet.</div>
                ) : (
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {orgPrefs.map(op => {
                      var matchedCount = approved.filter(m => m.org_id === op.org?.id).length;
                      var capacity = op.num_students || 1;
                      var isFull = matchedCount >= capacity;
                      return (
                        <div key={op.org_id} style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: '0.82rem', opacity: isFull ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{op.org?.full_name}</div>
                            {matchedCount > 0 && (
                              <span className={'badge ' + (isFull ? 'badge-red' : 'badge-amber')} style={{ fontSize: '0.62rem' }}>
                                {matchedCount}/{capacity} filled
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: 2 }}>
                            {(op.desired_skills || []).length} desired skills • Capacity: {capacity} • {op.location || 'No location'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Run button */}
          <div style={{ marginBottom: 24 }}>
            <button className="btn btn-primary btn-lg" onClick={runMatching} disabled={loading || fetching}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Running Algorithm...</> : <><Shuffle size={18} /> Run Matching Algorithm</>}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Matching Results</div>
                  <div className="card-subtitle">{results.length} optimal pairing{results.length > 1 ? 's' : ''} — each student assigned to their best-fit organization</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setResults([])}>Clear</button>
              </div>

              {results.map((pair, idx) => {
                const isExpanded = expandedResult === idx;
                const insights = getInsight(pair);
                return (
                  <div key={pair.student_id + '-' + pair.org_id} style={{
                    borderTop: '1px solid var(--border)', padding: '16px 20px',
                  }}>
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, color: idx < 3 ? '#14b8a6' : 'var(--text-muted)', fontSize: '0.9rem', width: 30 }}>#{idx + 1}</div>

                      {/* Student side */}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <GraduationCap size={13} color="#14b8a6" />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{pair.student_name}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pair.student_email}</div>
                      </div>

                      {/* Arrow */}
                      <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>→</div>

                      {/* Org side */}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Building2 size={13} color="#3b82f6" />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{pair.org_name}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pair.org_email}</div>
                      </div>

                      {/* Score */}
                      <div style={{ textAlign: 'center' }}>
                        <span className={'badge ' + (pair.score >= 70 ? 'badge-green' : pair.score >= 40 ? 'badge-amber' : 'badge-red')} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                          <Award size={12} /> {pair.score}/100
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => approveMatch(pair)}>
                          <Check size={14} /> Approve
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setExpandedResult(isExpanded ? null : idx)}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--bg-input)', borderRadius: 8 }}>
                        {/* Score breakdown */}
                        <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Skills</div>
                            <span className="badge badge-teal">{pair.skillScore}/50</span>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Projects</div>
                            <span className="badge badge-blue" style={{ background: '#3b82f618', color: '#3b82f6' }}>{pair.projectScore}/30</span>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Location</div>
                            <span className={'badge ' + (pair.location_match ? 'badge-green' : 'badge-red')}>{pair.locScore}/20</span>
                          </div>
                        </div>

                        {/* Side by side prefs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#14b8a6', marginBottom: 6 }}>STUDENT PREFERENCES</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <Zap size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Skills: {pair.student_skills.map(s => (
                                <span key={s} style={{
                                  display: 'inline-block', padding: '1px 6px', borderRadius: 4, marginRight: 3, marginBottom: 2,
                                  fontSize: '0.72rem', fontWeight: 500,
                                  background: pair.matchedSkills.includes(s) ? '#14b8a620' : 'var(--bg-input)',
                                  color: pair.matchedSkills.includes(s) ? '#14b8a6' : 'var(--text-muted)',
                                  border: pair.matchedSkills.includes(s) ? '1px solid #14b8a640' : '1px solid var(--border)',
                                }}>{s}</span>
                              ))}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <Briefcase size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Projects: {pair.student_projects.join(', ') || 'None'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Locations: {pair.student_locations.join(', ') || 'None'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#3b82f6', marginBottom: 6 }}>ORGANIZATION NEEDS</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <Zap size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Desired: {pair.org_skills.map(s => (
                                <span key={s} style={{
                                  display: 'inline-block', padding: '1px 6px', borderRadius: 4, marginRight: 3, marginBottom: 2,
                                  fontSize: '0.72rem', fontWeight: 500,
                                  background: pair.matchedSkills.includes(s) ? '#3b82f620' : 'var(--bg-input)',
                                  color: pair.matchedSkills.includes(s) ? '#3b82f6' : 'var(--text-muted)',
                                  border: pair.matchedSkills.includes(s) ? '1px solid #3b82f640' : '1px solid var(--border)',
                                }}>{s}</span>
                              ))}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <Briefcase size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Projects: {pair.org_projects.join(', ') || 'None'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Location: {pair.org_location} • Capacity: {pair.org_capacity} student{pair.org_capacity > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        {/* AI Insight */}
                        <div style={{ padding: '10px 14px', background: 'rgba(20,184,166,0.06)', borderRadius: 6, border: '1px solid rgba(20,184,166,0.15)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Lightbulb size={13} color="#14b8a6" />
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#14b8a6', textTransform: 'uppercase' }}>Match Insight</span>
                          </div>
                          {insights.map((insight, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 2 }}>• {insight}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {results.length === 0 && !loading && studentPrefs.length === 0 && orgPrefs.length === 0 && !fetching && (
            <div className="card">
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <div className="empty-state-icon"><Users size={28} /></div>
                <h3>No Preferences Yet</h3>
                <p>Students and organizations need to submit their preferences before matching can begin.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: APPROVED ═══ */}
      {tab === 'approved' && (
        fetching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : approved.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon"><Shuffle size={28} /></div><h3>No Approved Matches</h3><p>Run matching and approve pairings to see them here.</p></div></div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Approved Placements ({approved.length})</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Organization</th><th>Score</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {approved.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.student?.full_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.student?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.org?.full_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.org?.email}</div>
                      </td>
                      <td><span className="badge badge-teal"><Award size={10} /> {m.score}/100</span></td>
                      <td><span className="badge badge-green">Approved</span></td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => removeMatch(m.id)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
