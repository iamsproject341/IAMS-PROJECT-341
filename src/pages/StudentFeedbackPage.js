import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { downloadTextAsFile } from '../lib/downloadFile';
import { useFocusRefresh } from '../hooks/useFocusRefresh';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import {
  ClipboardCheck, School, Building2, Star, User, Calendar, Lock, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

function StarsReadOnly({ value, color }) {
  const v = Number(value) || 0;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={16}
          fill={v >= n ? color : 'none'}
          color={v >= n ? color : 'var(--text-muted)'}
        />
      ))}
    </div>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6,
      }}
      >
        {label}
      </div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
        {children}
      </div>
    </div>
  );
}

function safeFileSegment(s) {
  return String(s || 'report')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'report';
}

function formatIndustrialText(industrial, orgName, studentName) {
  const submitted = new Date(industrial.updated_at || industrial.created_at).toLocaleString();
  const lines = [
    'INDUSTRIAL SUPERVISOR ASSESSMENT',
    '================================',
    `Student: ${studentName}`,
    `Host organization: ${orgName}`,
    `Submitted: ${submitted}`,
    `Overall score: ${industrial.overall_score} / 100`,
    '',
    'Performance ratings (1–5)',
    `  Technical skills: ${industrial.technical_skills ?? '—'}`,
    `  Communication: ${industrial.communication ?? '—'}`,
    `  Teamwork: ${industrial.teamwork ?? '—'}`,
    `  Punctuality & attendance: ${industrial.punctuality ?? '—'}`,
    `  Initiative & problem-solving: ${industrial.initiative ?? '—'}`,
    '',
    `Strengths:`,
    industrial.strengths || '—',
    '',
  ];
  if (industrial.areas_for_improvement) {
    lines.push('Areas for improvement:', industrial.areas_for_improvement, '');
  }
  if (industrial.general_comments) {
    lines.push('General comments:', industrial.general_comments, '');
  }
  lines.push(
    `Future hire recommendation: ${industrial.recommend_for_hire ? 'Yes' : 'No'}`,
    '',
  );
  return lines.join('\n');
}

function formatUniVisitText(a, studentName) {
  const visit = new Date(a.visit_date).toLocaleDateString();
  const lines = [
    'UNIVERSITY SUPERVISOR VISIT ASSESSMENT',
    '======================================',
    `Student: ${studentName}`,
    `Supervisor: ${a.supervisor?.full_name || 'University supervisor'}`,
    `Visit date: ${visit}`,
    `Overall score: ${a.overall_score} / 100`,
    '',
    'Visit ratings (1–5)',
    `  Organization environment: ${a.organization_environment ?? '—'}`,
    `  Student integration: ${a.student_integration ?? '—'}`,
    `  Work quality observed: ${a.work_quality ?? '—'}`,
    `  Learning progress: ${a.learning_progress ?? '—'}`,
    '',
    'Visit notes:',
    a.visit_notes || '—',
    '',
  ];
  if (a.recommendations) {
    lines.push('Recommendations:', a.recommendations, '');
  }
  return lines.join('\n');
}

function formatAllFeedbackText({
  studentName, industrialReports, uniAssessments, matchOrgName,
}) {
  const parts = [
    'SUPERVISOR FEEDBACK — FULL COPY',
    '==============================',
    `Student: ${studentName}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
  ];

  if (industrialReports.length) {
    industrialReports.forEach((r, i) => {
      const org =
        r.organization?.full_name ||
        (i === 0 && matchOrgName) ||
        'Host organization';
      parts.push(formatIndustrialText(r, org, studentName), '---', '');
    });
  } else {
    parts.push('(No industrial supervisor report on file.)', '', '---', '');
  }

  if (uniAssessments.length) {
    uniAssessments.forEach(a => {
      parts.push(formatUniVisitText(a, studentName), '---', '');
    });
  } else {
    parts.push('(No university visit assessments on file.)', '');
  }

  return parts.join('\n').trim() + '\n';
}

export default function StudentFeedbackPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [match, setMatch] = useState(null);
  const [industrialReports, setIndustrialReports] = useState([]);
  const [uniAssessments, setUniAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    'Student';

  useEffect(() => {
    if (user && role === 'student') loadData();
    else setLoading(false);
    // eslint-disable-next-line
  }, [user, role]);

  useFocusRefresh(
    () => { if (user && role === 'student') loadData(); },
    { enabled: !!user && role === 'student' }
  );

  useRealtimeSync(
    ['matches', 'supervisor_reports', 'university_assessments'],
    () => { if (user && role === 'student') loadData(); },
    { enabled: !!user && role === 'student' }
  );

  async function loadData() {
    try {
      const { data: matchRow } = await supabase
        .from('matches')
        .select('*, org:profiles!matches_org_id_fkey(full_name)')
        .eq('student_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      setMatch(matchRow || false);

      const [{ data: ind }, { data: uni }] = await Promise.all([
        supabase
          .from('supervisor_reports')
          .select(`
            *,
            organization:profiles!supervisor_reports_supervisor_id_fkey(full_name)
          `)
          .eq('student_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('university_assessments')
          .select(`
            *,
            supervisor:profiles!university_assessments_supervisor_id_fkey(full_name)
          `)
          .eq('student_id', user.id)
          .order('visit_date', { ascending: false }),
      ]);
      setIndustrialReports(ind || []);
      setUniAssessments(uni || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const downloadIndustrial = useCallback(() => {
    if (!industrialReports.length) return;
    const industrial = industrialReports[0];
    const orgName =
      industrial?.organization?.full_name ||
      (match && match.org?.full_name) ||
      'Host organization';
    try {
      const body = formatIndustrialText(industrial, orgName, studentName);
      const slug = safeFileSegment(orgName);
      downloadTextAsFile(
        body,
        `industrial-supervisor-assessment-${slug}.txt`,
      );
      toast.success('Industrial report downloaded');
    } catch (e) {
      toast.error(e.message || 'Download failed');
    }
  }, [industrialReports, match, studentName]);

  const downloadUniVisit = useCallback((a) => {
    try {
      const body = formatUniVisitText(a, studentName);
      const datePart = a.visit_date
        ? String(a.visit_date).slice(0, 10)
        : 'visit';
      downloadTextAsFile(
        body,
        `university-visit-assessment-${datePart}.txt`,
      );
      toast.success('Visit assessment downloaded');
    } catch (e) {
      toast.error(e.message || 'Download failed');
    }
  }, [studentName]);

  const downloadAll = useCallback(() => {
    try {
      const matchOrgName = match && match.org?.full_name;
      const body = formatAllFeedbackText({
        studentName,
        industrialReports,
        uniAssessments,
        matchOrgName,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextAsFile(
        body,
        `supervisor-feedback-all-${safeFileSegment(studentName)}-${stamp}.txt`,
      );
      toast.success('All reports downloaded');
    } catch (e) {
      toast.error(e.message || 'Download failed');
    }
  }, [studentName, industrialReports, uniAssessments, match]);

  if (role !== 'student') {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><ClipboardCheck size={28} /></div>
          <h3>Student Feature</h3>
          <p>Supervisor feedback is only available on the student portal.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  const hasIndustrial = industrialReports.length > 0;
  const hasUni = uniAssessments.length > 0;

  if (!match && !hasIndustrial && !hasUni) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Supervisor Feedback</h1>
            <p className="page-subtitle">View and download assessments from your host organization and university supervisor.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty-state" style={{ padding: '60px 24px' }}>
            <div className="empty-state-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Lock size={28} color="#f59e0b" />
            </div>
            <h3>Feedback Unavailable</h3>
            <p style={{ maxWidth: 440 }}>
              Once you have an approved placement, your industrial supervisor and university supervisor can submit assessments here.
              You will see them as soon as they are submitted.
            </p>
          </div>
        </div>
      </div>
    );
  }
  const industrial = industrialReports[0];
  const orgName =
    industrial?.organization?.full_name ||
    (match && match.org?.full_name) ||
    'Host organization';

  const canDownloadAny = hasIndustrial || hasUni;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Supervisor Feedback</h1>
          <p className="page-subtitle">
            View, download, or print your industrial assessment and university visit assessments (saved as plain text files).
          </p>
        </div>
        {canDownloadAny && (
          <button type="button" className="btn btn-primary" onClick={downloadAll}>
            <Download size={16} /> Download all reports
          </button>
        )}
      </div>

      {!hasIndustrial && !hasUni && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-state-icon"><ClipboardCheck size={28} /></div>
            <h3>No Assessments Yet</h3>
            <p style={{ maxWidth: 460 }}>
              Your supervisors have not submitted an assessment for you yet. Check back after your industrial supervisor and university supervisor complete their reports.
            </p>
          </div>
        </div>
      )}

      {/* Industrial (organization) assessment */}
      <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            >
              <Building2 size={20} color="#f59e0b" />
            </div>
            <div>
              <div className="card-title" style={{ marginBottom: 2 }}>Industrial supervisor assessment</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{orgName}</div>
            </div>
          </div>
          {hasIndustrial && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={downloadIndustrial}>
              <Download size={16} /> Download
            </button>
          )}
        </div>
        <div style={{ padding: '20px 24px' }}>
          {!hasIndustrial ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
              No report has been submitted by your host organization yet.
            </p>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16, marginBottom: 20,
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(245,158,11,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  >
                    <ClipboardCheck size={18} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                      Performance evaluation
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Submitted {new Date(industrial.updated_at || industrial.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{industrial.overall_score}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="form-hint" style={{ marginBottom: 12 }}>Ratings (1–5)</div>
                {[
                  ['Technical skills', industrial.technical_skills],
                  ['Communication', industrial.communication],
                  ['Teamwork', industrial.teamwork],
                  ['Punctuality & attendance', industrial.punctuality],
                  ['Initiative & problem-solving', industrial.initiative],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{label}</span>
                    <StarsReadOnly value={val} color="#f59e0b" />
                  </div>
                ))}
              </div>

              <FieldBlock label="Strengths">{industrial.strengths}</FieldBlock>
              {industrial.areas_for_improvement && (
                <FieldBlock label="Areas for improvement">{industrial.areas_for_improvement}</FieldBlock>
              )}
              {industrial.general_comments && (
                <FieldBlock label="General comments">{industrial.general_comments}</FieldBlock>
              )}
              <div style={{
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 10,
                background: industrial.recommend_for_hire ? 'rgba(20,184,166,0.12)' : 'var(--input-bg)',
                border: `1px solid ${industrial.recommend_for_hire ? 'rgba(20,184,166,0.35)' : 'var(--border)'}`,
                fontSize: '0.86rem',
                color: 'var(--text-primary)',
              }}
              >
                <strong>Future hire recommendation:</strong>{' '}
                {industrial.recommend_for_hire ? 'Yes — recommended for future hire.' : 'Not indicated / no.'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* University visit assessments */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <School size={22} color="#3b82f6" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            University supervisor visits
          </h2>
        </div>
        {!hasUni ? (
          <div className="card">
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-state-icon"><School size={28} /></div>
              <h3>No visit assessments yet</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: 420, margin: 0 }}>
                When your university supervisor records a visit assessment, it will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {uniAssessments.map(a => (
              <div key={a.id} className="card">
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 14,
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(59,130,246,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    >
                      <User size={18} color="#3b82f6" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {a.supervisor?.full_name || 'University supervisor'}
                      </div>
                      <div style={{
                        fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                      >
                        <Calendar size={12} /> Visit date: {new Date(a.visit_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadUniVisit(a)}>
                      <Download size={16} /> Download
                    </button>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{a.overall_score}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 100</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div className="form-hint" style={{ marginBottom: 10 }}>Visit ratings (1–5)</div>
                  {[
                    ['Organization environment', a.organization_environment],
                    ['Student integration', a.student_integration],
                    ['Work quality observed', a.work_quality],
                    ['Learning progress', a.learning_progress],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{label}</span>
                      <StarsReadOnly value={val} color="#3b82f6" />
                    </div>
                  ))}
                </div>

                <FieldBlock label="Visit notes">{a.visit_notes}</FieldBlock>
                {a.recommendations && (
                  <FieldBlock label="Recommendations">{a.recommendations}</FieldBlock>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
