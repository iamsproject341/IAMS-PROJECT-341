import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notifyUniAssessmentSubmitted } from '../lib/notify';
import { useFocusRefresh } from '../hooks/useFocusRefresh';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { School, User, Star, Plus, Calendar, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UniAssessmentPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form fields
  const [studentId, setStudentId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [orgEnvironment, setOrgEnvironment] = useState(0);
  const [studentIntegration, setStudentIntegration] = useState(0);
  const [workQuality, setWorkQuality] = useState(0);
  const [learningProgress, setLearningProgress] = useState(0);
  const [overallScore, setOverallScore] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    if (user && role === 'supervisor') loadData();
    else setLoading(false);
    // eslint-disable-next-line
  }, [user, role]);

  // Re-fetch when the tab becomes visible (e.g., coordinator changed assignments in another tab)
  useFocusRefresh(
    () => { if (user && role === 'supervisor') loadData(); },
    { enabled: !!user && role === 'supervisor' }
  );

  // Realtime: new match assignments or new assessments should show up immediately
  useRealtimeSync(
    ['matches', 'university_assessments'],
    () => { if (user && role === 'supervisor') loadData(); },
    { enabled: !!user && role === 'supervisor' }
  );

  async function loadData() {
    try {
      // Only show students who have been assigned to THIS supervisor by the coordinator
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id, student_id, org_id,
          student:profiles!matches_student_id_fkey(id, full_name, email, student_id),
          org:profiles!matches_org_id_fkey(full_name)
        `)
        .eq('status', 'approved')
        .eq('supervisor_id', user.id);

      setStudents(matches || []);

      const { data: assmts } = await supabase
        .from('university_assessments')
        .select('*, student:profiles!university_assessments_student_id_fkey(full_name, student_id)')
        .eq('supervisor_id', user.id)
        .order('visit_date', { ascending: false });

      setAssessments(assmts || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    }
    setLoading(false);
  }

  function resetForm() {
    setStudentId(''); setVisitDate('');
    setOrgEnvironment(0); setStudentIntegration(0);
    setWorkQuality(0); setLearningProgress(0);
    setOverallScore(''); setVisitNotes(''); setRecommendations('');
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!studentId) { toast.error('Please select a student'); return; }
    if (!visitDate) { toast.error('Please enter the visit date'); return; }
    if (!orgEnvironment || !studentIntegration || !workQuality || !learningProgress) {
      toast.error('Please rate all assessment areas'); return;
    }
    const score = parseInt(overallScore, 10);
    if (!score || score < 1 || score > 100) {
      toast.error('Overall score must be between 1 and 100'); return;
    }
    if (!visitNotes.trim() || visitNotes.trim().length < 15) {
      toast.error('Visit notes are required (min 15 chars)'); return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('university_assessments').insert({
        supervisor_id: user.id,
        student_id: studentId,
        visit_date: visitDate,
        organization_environment: orgEnvironment,
        student_integration: studentIntegration,
        work_quality: workQuality,
        learning_progress: learningProgress,
        overall_score: score,
        visit_notes: visitNotes.trim(),
        recommendations: recommendations.trim(),
      });
      if (error) throw error;
      toast.success('Assessment recorded');

      // Notify the student and all coordinators.
      notifyUniAssessmentSubmitted({
        studentId,
        supervisorName: profile?.full_name || 'Your supervisor',
        score,
      });

      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    }
    setSubmitting(false);
  }

  if (role !== 'supervisor') {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><School size={28} /></div>
          <h3>University Supervisor Feature</h3>
          <p>This page is only for university supervisors.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">University Assessments</h1>
          <p className="page-subtitle">Record assessment results after visiting attached students.</p>
        </div>
        {!showForm && students.length > 0 && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Assessment
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">New Visit Assessment</div>
            <button className="btn btn-ghost btn-sm" onClick={resetForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select className="form-input" value={studentId} onChange={e => setStudentId(e.target.value)}>
                  <option value="">-- Select a student --</option>
                  {students.map(m => (
                    <option key={m.id} value={m.student_id}>
                      {m.student?.full_name} {m.student?.student_id ? `(${m.student.student_id})` : ''} — {m.org?.full_name}
                    </option>
                  ))}
                </select>
                <div className="form-hint">Only placed students are listed.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Visit Date *</label>
                <input
                  type="date" className="form-input" value={visitDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setVisitDate(e.target.value)}
                />
                <div className="form-hint">Date you visited the organization.</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, marginTop: 8 }}>
              Visit Ratings
            </h4>
            {[
              ['Organization Environment', orgEnvironment, setOrgEnvironment],
              ['Student Integration', studentIntegration, setStudentIntegration],
              ['Work Quality Observed', workQuality, setWorkQuality],
              ['Learning Progress', learningProgress, setLearningProgress],
            ].map(([label, val, setter]) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{label}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setter(n)}
                      style={{
                        width: 30, height: 30, borderRadius: 6,
                        background: val >= n ? '#3b82f6' : 'var(--input-bg)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Star size={14} fill={val >= n ? 'white' : 'none'} color={val >= n ? 'white' : 'var(--text-muted)'} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Overall Score (1–100) *</label>
              <input
                type="number" className="form-input" min={1} max={100}
                value={overallScore}
                onChange={e => setOverallScore(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g. 82"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Visit Notes *</label>
              <textarea
                className="form-textarea" rows={4} maxLength={2000}
                value={visitNotes} onChange={e => setVisitNotes(e.target.value)}
                placeholder="Observations from the visit: workspace, tasks, interactions..."
              />
              <div className="form-hint">Min 15 chars. {visitNotes.length}/2000</div>
            </div>

            <div className="form-group">
              <label className="form-label">Recommendations</label>
              <textarea
                className="form-textarea" rows={3} maxLength={1000}
                value={recommendations} onChange={e => setRecommendations(e.target.value)}
                placeholder="Any recommendations for the student, organization, or coordinator..."
              />
              <div className="form-hint">Optional. {recommendations.length}/1000</div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting
                ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                : <><School size={16} /> Save Assessment</>}
            </button>
          </form>
        </div>
      )}

      {/* Existing assessments */}
      {assessments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><School size={28} /></div>
            <h3>No Assessments Yet</h3>
            <p>After visiting a student at their attachment site, capture your assessment here.</p>
            {!showForm && students.length > 0 && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 12 }}>
                <Plus size={16} /> New Assessment
              </button>
            )}
            {students.length === 0 && (
              <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No students have been assigned to you yet. The coordinator assigns supervisors to students from the Matching page.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {assessments.map(a => (
            <div key={a.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={18} color="#3b82f6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {a.student?.full_name}
                    {a.student?.student_id && (
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.82rem', marginLeft: 8 }}>
                        {a.student.student_id}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={12} /> {new Date(a.visit_date).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{a.overall_score}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 100</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {a.visit_notes}
              </div>
              {a.recommendations && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Recommendations:</strong> {a.recommendations}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
