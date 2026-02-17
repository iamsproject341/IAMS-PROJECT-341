import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Shuffle, Check, X, Users, Award, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MatchingPage() {
  const { profile, user } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;
  const [results, setResults] = useState([]);
  const [existingMatches, setExistingMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState('run');

  useEffect(() => { loadExistingMatches(); }, []);

  async function loadExistingMatches() {
    try {
      const { data } = await supabase.from('matches')
        .select('*, student:profiles!matches_student_id_fkey(full_name, email), org:profiles!matches_org_id_fkey(full_name, email)')
        .order('score', { ascending: false });
      setExistingMatches(data || []);
    } catch (err) { console.error(err); } finally { setFetching(false); }
  }

  async function runMatching() {
    setLoading(true);
    try {
      const { data: studentPrefs } = await supabase.from('student_preferences')
        .select('*, student:profiles!student_preferences_student_id_fkey(id, full_name, email)');
      const { data: orgPrefs } = await supabase.from('org_preferences')
        .select('*, org:profiles!org_preferences_org_id_fkey(id, full_name, email)');

      if (!studentPrefs?.length || !orgPrefs?.length) {
        toast.error('Need at least one student and one organization with preferences.');
        setLoading(false);
        return;
      }

      const pairs = [];
      for (const sp of studentPrefs) {
        for (const op of orgPrefs) {
          let score = 0;
          const skillOverlap = (sp.skills || []).filter(s => (op.desired_skills || []).includes(s)).length;
          score += Math.round((skillOverlap / Math.max((op.desired_skills || []).length, 1)) * 50);
          const projectOverlap = (sp.project_types || []).filter(p => (op.project_types || []).includes(p)).length;
          score += Math.round((projectOverlap / Math.max((op.project_types || []).length, 1)) * 30);
          const locMatch = (sp.locations || []).includes('Any Location') || (sp.locations || []).includes(op.location);
          if (locMatch) score += 20;

          pairs.push({
            student_id: sp.student?.id, student_name: sp.student?.full_name, student_email: sp.student?.email,
            org_id: op.org?.id, org_name: op.org?.full_name, org_email: op.org?.email,
            score, skill_overlap: skillOverlap, project_overlap: projectOverlap, location_match: locMatch,
          });
        }
      }
      pairs.sort((a, b) => b.score - a.score);
      setResults(pairs);
      toast.success(`Found ${pairs.length} possible matches!`);
    } catch (err) { toast.error('Matching failed'); } finally { setLoading(false); }
  }

  async function approveMatch(pair) {
    try {
      const { data: existing } = await supabase.from('matches').select('id')
        .eq('student_id', pair.student_id).eq('org_id', pair.org_id).maybeSingle();
      if (existing) { toast.error('Match already exists'); return; }
      const { error } = await supabase.from('matches').insert({
        student_id: pair.student_id, org_id: pair.org_id, score: pair.score, status: 'approved',
      });
      if (error) throw error;
      toast.success(`Matched ${pair.student_name} with ${pair.org_name}`);
      loadExistingMatches();
    } catch (err) { toast.error(err.message || 'Failed'); }
  }

  async function removeMatch(matchId) {
    try {
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) throw error;
      toast.success('Match removed');
      loadExistingMatches();
    } catch (err) { toast.error('Failed to remove'); }
  }

  if (role !== 'coordinator') {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><Shuffle size={28} /></div>
          <h3>Coordinator Only</h3>
          <p>The matching dashboard is only accessible to coordinators.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student-Organization Matching</h1>
        <p className="page-subtitle">Run the matching algorithm and approve student placements.</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'run' ? 'active' : ''}`} onClick={() => setTab('run')}>Run Matching</button>
        <button className={`tab ${tab === 'approved' ? 'active' : ''}`} onClick={() => setTab('approved')}>
          Approved ({existingMatches.filter(m => m.status === 'approved').length})
        </button>
      </div>

      {tab === 'run' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <button className="btn btn-primary btn-lg" onClick={runMatching} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Running...</> : <><Shuffle size={18} /> Run Matching Algorithm</>}
            </button>
          </div>

          {results.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Matching Results</div>
                  <div className="card-subtitle">{results.length} pairings ranked by score</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setResults([])}>Clear</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Student</th><th>Organization</th><th>Score</th><th>Skills</th><th>Location</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {results.map((pair, idx) => (
                      <tr key={`${pair.student_id}-${pair.org_id}`}>
                        <td style={{ fontWeight: 600, color: idx < 3 ? 'var(--accent)' : 'var(--text-secondary)' }}>#{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{pair.student_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pair.student_email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{pair.org_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pair.org_email}</div>
                        </td>
                        <td>
                          <span className={`badge ${pair.score >= 70 ? 'badge-green' : pair.score >= 40 ? 'badge-amber' : 'badge-red'}`}>
                            <Award size={10} /> {pair.score}/100
                          </span>
                        </td>
                        <td><span className="badge badge-teal">{pair.skill_overlap}</span></td>
                        <td>{pair.location_match ? <span className="badge badge-green">Yes</span> : <span className="badge badge-red">No</span>}</td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => approveMatch(pair)}>
                            <Check size={14} /> Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <div className="empty-state-icon"><Users size={28} /></div>
                <h3>Ready to Match</h3>
                <p>Ensure students and organizations have submitted preferences, then run the algorithm.</p>
              </div>
            </div>
          ) : null}
        </>
      )}

      {tab === 'approved' && (
        fetching ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div> :
        existingMatches.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon"><Shuffle size={28} /></div><h3>No Matches Yet</h3><p>Run matching and approve pairings.</p></div></div>
        ) : (
          <div className="card">
            <div className="card-header"><div className="card-title">Approved Placements</div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Organization</th><th>Score</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {existingMatches.map((m) => (
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
                          <Trash2 size={14} /> Remove
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
