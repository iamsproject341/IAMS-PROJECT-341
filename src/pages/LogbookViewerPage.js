import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BookOpen, User, Calendar, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function LogbookViewerPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [studentReport, setStudentReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (user) loadStudents();
    // eslint-disable-next-line
  }, [user, role]);

  async function loadStudents() {
    try {
      let studentList = [];

      if (role === 'organization') {
        // Orgs see their matched students
        const { data } = await supabase
          .from('matches')
          .select('id, student_id, student:profiles!matches_student_id_fkey(id, full_name, email, student_id)')
          .eq('org_id', user.id)
          .eq('status', 'approved');
        studentList = (data || []).map(m => m.student).filter(Boolean);
      } else if (role === 'supervisor' || role === 'coordinator') {
        // Supervisors & coordinators see all placed students
        const { data } = await supabase
          .from('matches')
          .select(`
            id, student_id,
            student:profiles!matches_student_id_fkey(id, full_name, email, student_id),
            org:profiles!matches_org_id_fkey(full_name)
          `)
          .eq('status', 'approved');
        studentList = (data || []).map(m => ({ ...m.student, orgName: m.org?.full_name })).filter(s => s?.id);
      }

      setStudents(studentList);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function selectStudent(student) {
    setSelectedStudent(student);
    setExpandedId(null);
    setLoadingEntries(true);
    try {
      const [{ data: logs }, { data: rep }] = await Promise.all([
        supabase
          .from('logbooks')
          .select('*')
          .eq('student_id', student.id)
          .order('week_number', { ascending: false }),
        supabase
          .from('student_reports')
          .select('*')
          .eq('student_id', student.id)
          .maybeSingle(),
      ]);
      setEntries(logs || []);
      setStudentReport(rep || null);
    } catch (err) {
      console.error(err);
    }
    setLoadingEntries(false);
  }

  if (!['organization', 'supervisor', 'coordinator'].includes(role)) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={28} /></div>
          <h3>Restricted Feature</h3>
          <p>Logbook viewing is only available for organizations, supervisors, and coordinators.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  if (students.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Student Logbooks</h1>
            <p className="page-subtitle">View weekly logbook entries submitted by students.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty-state" style={{ padding: '60px 24px' }}>
            <div className="empty-state-icon"><User size={28} /></div>
            <h3>No Students to View</h3>
            <p>
              {role === 'organization'
                ? 'No students have been matched to your organization yet.'
                : 'There are no approved student placements yet.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Student Logbooks</h1>
            <p className="page-subtitle">Select a student to view their weekly logbook entries.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Students ({students.length})</div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {students.map(s => (
              <button
                key={s.id}
                onClick={() => selectStudent(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={20} color="#3b82f6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.full_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {s.student_id ? `ID: ${s.student_id} · ` : ''}{s.email}
                    {s.orgName && ` · ${s.orgName}`}
                  </div>
                </div>
                <ChevronDown size={18} style={{ transform: 'rotate(-90deg)', color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{selectedStudent.full_name}'s Logbook</h1>
          <p className="page-subtitle">
            {selectedStudent.student_id ? `${selectedStudent.student_id} · ` : ''}
            {selectedStudent.email}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStudent(null)}>← Back</button>
      </div>

      {loadingEntries ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <>
          {/* Final report if available */}
          {studentReport && (
            <div className="card" style={{ marginBottom: 16, padding: '14px 20px', border: '1px solid rgba(20,184,166,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'rgba(20,184,166,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={16} color="#14b8a6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Final Report Available</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{studentReport.title}</div>
                </div>
                {studentReport.file_url && (
                  <a
                    href={studentReport.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Logbook entries */}
          {entries.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={28} /></div>
                <h3>No Entries Yet</h3>
                <p>This student hasn't submitted any logbook entries yet.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {entries.map(entry => {
                const expanded = expandedId === entry.id;
                return (
                  <div key={entry.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      style={{
                        width: '100%', padding: 16, background: 'transparent',
                        border: 'none', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: 14, textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: 'rgba(20,184,166,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Calendar size={18} color="#14b8a6" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          Week {entry.week_number}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Starting {new Date(entry.week_starting).toLocaleDateString()}
                        </div>
                      </div>
                      {expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </button>
                    {expanded && (
                      <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ paddingTop: 14 }}>
                          <LogField label="Activities Performed" value={entry.activities_performed} />
                          {entry.skills_learned && <LogField label="Skills Learned" value={entry.skills_learned} />}
                          {entry.challenges && <LogField label="Challenges Faced" value={entry.challenges} />}
                          {entry.next_week_plan && <LogField label="Plan for Next Week" value={entry.next_week_plan} />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LogField({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  );
}
