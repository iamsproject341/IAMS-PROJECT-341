import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useFocusRefresh } from '../hooks/useFocusRefresh';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { ClipboardCheck, User, Star, CheckCircle2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupervisorReportPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [matchedStudents, setMatchedStudents] = useState([]);
  const [existingReports, setExistingReports] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form fields
  const [technicalSkills, setTechnicalSkills] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [teamwork, setTeamwork] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [initiative, setInitiative] = useState(0);
  const [overallScore, setOverallScore] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [recommendForHire, setRecommendForHire] = useState(false);

  useEffect(() => {
    if (user && role === 'organization') loadData();
    else setLoading(false);
    // eslint-disable-next-line
  }, [user, role]);

  useFocusRefresh(
    () => { if (user && role === 'organization') loadData(); },
    { enabled: !!user && role === 'organization' }
  );

  useRealtimeSync(
    ['matches', 'supervisor_reports'],
    () => { if (user && role === 'organization') loadData(); },
    { enabled: !!user && role === 'organization' }
  );

  async function loadData() {
    try {
      const { data: matches } = await supabase
        .from('matches')
        .select('id, student_id, student:profiles!matches_student_id_fkey(id, full_name, email, student_id)')
        .eq('org_id', user.id)
        .eq('status', 'approved');

      const students = (matches || []).map(m => m.student).filter(Boolean);
      setMatchedStudents(students);

      if (students.length) {
        const { data: reports } = await supabase
          .from('supervisor_reports')
          .select('*')
          .eq('supervisor_id', user.id);
        const map = {};
        (reports || []).forEach(r => { map[r.student_id] = r; });
        setExistingReports(map);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load matched students');
    }
    setLoading(false);
  }

  function selectStudent(student) {
    setSelectedStudent(student);
    const existing = existingReports[student.id];
    if (existing) {
      setTechnicalSkills(existing.technical_skills || 0);
      setCommunication(existing.communication || 0);
      setTeamwork(existing.teamwork || 0);
      setPunctuality(existing.punctuality || 0);
      setInitiative(existing.initiative || 0);
      setOverallScore(existing.overall_score?.toString() || '');
      setStrengths(existing.strengths || '');
      setAreasForImprovement(existing.areas_for_improvement || '');
      setGeneralComments(existing.general_comments || '');
      setRecommendForHire(existing.recommend_for_hire || false);
    } else {
      setTechnicalSkills(0); setCommunication(0); setTeamwork(0);
      setPunctuality(0); setInitiative(0); setOverallScore('');
      setStrengths(''); setAreasForImprovement(''); setGeneralComments('');
      setRecommendForHire(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!technicalSkills || !communication || !teamwork || !punctuality || !initiative) {
      toast.error('Please rate all performance areas');
      return;
    }
    const score = parseInt(overallScore, 10);
    if (!score || score < 1 || score > 100) {
      toast.error('Overall score must be between 1 and 100');
      return;
    }
    if (!strengths.trim() || strengths.trim().length < 10) {
      toast.error('Please describe the student\'s strengths (min 10 chars)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supervisor_id: user.id,
        student_id: selectedStudent.id,
        technical_skills: technicalSkills,
        communication,
        teamwork,
        punctuality,
        initiative,
        overall_score: score,
        strengths: strengths.trim(),
        areas_for_improvement: areasForImprovement.trim(),
        general_comments: generalComments.trim(),
        recommend_for_hire: recommendForHire,
      };
      const { error } = await supabase
        .from('supervisor_reports')
        .upsert(payload, { onConflict: 'supervisor_id,student_id' });
      if (error) throw error;
      toast.success('Report submitted successfully');
      setSelectedStudent(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    }
    setSubmitting(false);
  }

  if (role !== 'organization') {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><ClipboardCheck size={28} /></div>
          <h3>Industrial Supervisor Feature</h3>
          <p>Supervisor report submission is only available for organizations (industrial supervisors).</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  if (matchedStudents.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Supervisor Reports</h1>
            <p className="page-subtitle">Submit assessment reports for your attached students.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty-state" style={{ padding: '60px 24px' }}>
            <div className="empty-state-icon"><User size={28} /></div>
            <h3>No Matched Students</h3>
            <p>You don't have any approved student placements yet. Once the coordinator approves a match, they'll appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  // student selection view
  if (!selectedStudent) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Supervisor Reports</h1>
            <p className="page-subtitle">Submit assessment reports for your attached students.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Select a Student to Assess</div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {matchedStudents.map(s => {
              const hasReport = !!existingReports[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => selectStudent(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                    background: 'var(--card-bg)', border: '1px solid var(--border)',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: hasReport ? 'rgba(20,184,166,0.15)' : 'rgba(59,130,246,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {hasReport ? <CheckCircle2 size={20} color="#14b8a6" /> : <User size={20} color="#3b82f6" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.full_name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {s.student_id ? `ID: ${s.student_id} · ` : ''}{s.email}
                    </div>
                  </div>
                  <span className={`badge ${hasReport ? 'badge-green' : 'badge-blue'}`}>
                    {hasReport ? 'Report Submitted' : 'Pending'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // assessment form view
  const existing = existingReports[selectedStudent.id];
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Assess {selectedStudent.full_name}</h1>
          <p className="page-subtitle">{existing ? 'Editing existing report' : 'New assessment report'}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStudent(null)}>← Back</button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Performance Ratings
            </h3>
            <div className="form-hint" style={{ marginBottom: 16 }}>Rate each area from 1 (poor) to 5 (excellent).</div>

            {[
              ['Technical Skills', technicalSkills, setTechnicalSkills],
              ['Communication', communication, setCommunication],
              ['Teamwork', teamwork, setTeamwork],
              ['Punctuality & Attendance', punctuality, setPunctuality],
              ['Initiative & Problem-Solving', initiative, setInitiative],
            ].map(([label, val, setter]) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setter(n)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: val >= n ? '#f59e0b' : 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Star size={16} fill={val >= n ? 'white' : 'none'} color={val >= n ? 'white' : 'var(--text-muted)'} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Overall Score (1–100) *</label>
            <input
              type="number" className="form-input" min={1} max={100}
              value={overallScore}
              onChange={e => setOverallScore(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="e.g. 85"
            />
            <div className="form-hint">Final weighted score out of 100.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Strengths *</label>
            <textarea
              className="form-textarea" rows={3} maxLength={1000}
              value={strengths} onChange={e => setStrengths(e.target.value)}
              placeholder="What did the student excel at?"
            />
            <div className="form-hint">Min 10 characters. {strengths.length}/1000</div>
          </div>

          <div className="form-group">
            <label className="form-label">Areas for Improvement</label>
            <textarea
              className="form-textarea" rows={3} maxLength={1000}
              value={areasForImprovement} onChange={e => setAreasForImprovement(e.target.value)}
              placeholder="Any areas where the student could grow..."
            />
            <div className="form-hint">Optional. {areasForImprovement.length}/1000</div>
          </div>

          <div className="form-group">
            <label className="form-label">General Comments</label>
            <textarea
              className="form-textarea" rows={3} maxLength={1000}
              value={generalComments} onChange={e => setGeneralComments(e.target.value)}
              placeholder="Any additional comments..."
            />
            <div className="form-hint">Optional. {generalComments.length}/1000</div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={recommendForHire}
                onChange={e => setRecommendForHire(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                I would recommend this student for future hire
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                : <><Edit3 size={16} /> {existing ? 'Update Report' : 'Submit Report'}</>}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedStudent(null)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
