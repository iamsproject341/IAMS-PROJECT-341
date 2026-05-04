import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AnimatedCard, CountUp } from '../components/AnimatedCard';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import {
  GraduationCap, Building2, BookOpen, Shuffle,
  ArrowRight, CheckCircle2, Clock, AlertCircle, School, ClipboardList,
} from 'lucide-react';

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role || user?.user_metadata?.role || 'student';
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const firstName = displayName.split(' ')[0];
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, [role]); // eslint-disable-line

  // Realtime: keep dashboard counts + match info in sync with the database.
  // Everyone gets it; the callback no-ops if the role doesn't care about a given table.
  useRealtimeSync(
    ['matches', 'logbooks', 'profiles', 'student_preferences', 'org_preferences', 'university_assessments'],
    () => { loadStats(); },
    { enabled: !!role }
  );

  const loadStats = useCallback(async () => {
    try {
      if (role === 'coordinator') {
        const [students, orgs, matches, logbooks] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'organization'),
          supabase.from('matches').select('id', { count: 'exact', head: true }),
          supabase.from('logbooks').select('id', { count: 'exact', head: true }),
        ]);
        setStats({ students: students.count || 0, organizations: orgs.count || 0, matches: matches.count || 0, logbooks: logbooks.count || 0 });
      } else if (role === 'student') {
        const [prefs, logbooks, match] = await Promise.all([
          supabase.from('student_preferences').select('id').eq('student_id', user.id),
          supabase.from('logbooks').select('id', { count: 'exact', head: true }).eq('student_id', user.id),
          supabase.from('matches').select('*, org:profiles!matches_org_id_fkey(full_name, email), supervisor:profiles!matches_supervisor_id_fkey(full_name, email)').eq('student_id', user.id).eq('status', 'approved').maybeSingle(),
        ]);
        setStats({ prefsSet: prefs.data?.length > 0, logbookCount: logbooks.count || 0, match: match.data });
      } else if (role === 'organization') {
        const [prefs, matchedStudents] = await Promise.all([
          supabase.from('org_preferences').select('id').eq('org_id', user.id),
          supabase.from('matches')
            .select('id, score, status, student_id, student:profiles!matches_student_id_fkey(full_name, email)')
            .eq('org_id', user.id)
            .eq('status', 'approved'),
        ]);
        const students = (matchedStudents.data || []).map(m => ({
          ...m,
          student: m.student || { full_name: 'Unknown', email: '' },
        }));
        setStats({
          prefsSet: prefs.data?.length > 0,
          matchedStudents: students,
        });
      } else if (role === 'supervisor') {
        // Students assigned to this supervisor by the coordinator, plus count of visits logged
        const [placed, assmts] = await Promise.all([
          supabase
            .from('matches')
            .select('id, student_id, student:profiles!matches_student_id_fkey(id, full_name, email, student_id), org:profiles!matches_org_id_fkey(full_name)')
            .eq('supervisor_id', user.id)
            .eq('status', 'approved'),
          supabase
            .from('university_assessments')
            .select('id', { count: 'exact', head: true })
            .eq('supervisor_id', user.id),
        ]);
        const placedList = (placed.data || []).map(m => ({
          matchId: m.id,
          student: m.student,
          orgName: m.org?.full_name || 'Organization',
        }));
        setStats({
          placedStudents: placedList.length,
          assessmentsDone: assmts.count || 0,
          placedList,
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [role, user]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  }

  return (
    <div>
      <AnimatedCard>
        <div className="page-header">
          <h1 className="page-title">Welcome, {firstName}</h1>
          <p className="page-subtitle">
            {role === 'student' && 'Manage your attachment preferences, logbooks, and track your placement.'}
            {role === 'organization' && 'Set your preferences and manage student attachments.'}
            {role === 'coordinator' && 'Oversee the attachment process, match students and organizations.'}
            {role === 'supervisor' && 'Track student progress and submit assessments.'}
          </p>
        </div>
      </AnimatedCard>

      {/* ── Coordinator ── */}
      {role === 'coordinator' && (
        <>
          <div className="stat-grid">
            {[
              { icon: GraduationCap, color: 'teal', value: stats.students, label: 'Registered Students' },
              { icon: Building2, color: 'blue', value: stats.organizations, label: 'Organizations' },
              { icon: Shuffle, color: 'green', value: stats.matches, label: 'Approved Matches' },
              { icon: BookOpen, color: 'amber', value: stats.logbooks, label: 'Logbook Entries' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <AnimatedCard key={i} delay={0.05 + i * 0.08} className="stat-card">
                  <div className={`stat-icon ${s.color}`}><Icon size={20} /></div>
                  <div>
                    <div className="stat-value"><CountUp end={s.value} /></div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
          <AnimatedCard delay={0.4} className="card action-card" onClick={() => navigate('/dashboard/matching')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="stat-icon teal"><Shuffle size={20} /></div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Run Matching Algorithm</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Match students with organizations based on preferences</div>
                </div>
              </div>
              <ArrowRight size={18} color="var(--accent)" />
            </div>
          </AnimatedCard>
        </>
      )}

      {/* ── Student ── */}
      {role === 'student' && (
        <>
          <div className="stat-grid">
            {[
              { icon: stats.prefsSet ? CheckCircle2 : AlertCircle, color: stats.prefsSet ? 'green' : 'amber', value: stats.prefsSet ? 'Set' : 'Pending', label: 'Preferences', isText: true },
              { icon: BookOpen, color: 'blue', value: stats.logbookCount, label: 'Logbook Entries' },
              { icon: stats.match ? CheckCircle2 : Clock, color: stats.match ? 'green' : 'teal', value: stats.match ? 'Matched' : 'Waiting', label: 'Placement Status', isText: true },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <AnimatedCard key={i} delay={0.05 + i * 0.08} className="stat-card">
                  <div className={`stat-icon ${s.color}`}><Icon size={20} /></div>
                  <div>
                    <div className="stat-value">{s.isText ? s.value : <CountUp end={s.value} />}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
          {stats.match && (
            <AnimatedCard delay={0.3} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#3b82f615', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#3b82f6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{stats.match.org?.full_name || 'Organization'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stats.match.org?.email}</div>
                </div>
                <span className="badge badge-green">Approved Placement</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                You have been matched with this organization. Head to your logbook to start documenting your weekly progress.
              </div>

              {/* University supervisor row */}
              <div style={{
                marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <School size={16} color="#f59e0b" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>University Supervisor</div>
                  {stats.match.supervisor ? (
                    <>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{stats.match.supervisor.full_name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{stats.match.supervisor.email}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Not yet assigned — your coordinator will assign one shortly.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                onClick={() => navigate('/dashboard/supervisor-feedback')}
              >
                <ClipboardList size={18} /> View supervisor feedback &amp; downloads
              </button>
            </AnimatedCard>
          )}
          {!stats.prefsSet && (
            <AnimatedCard delay={0.35} className="card action-card" onClick={() => navigate('/dashboard/preferences')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="stat-icon amber"><AlertCircle size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Set Your Preferences</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Submit your skills, location, and project preferences to get matched</div>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--accent)" />
              </div>
            </AnimatedCard>
          )}
        </>
      )}

      {/* ── Organization ── */}
      {role === 'organization' && (
        <>
          <div className="stat-grid">
            <AnimatedCard delay={0.05} className="stat-card">
              <div className={`stat-icon ${stats.prefsSet ? 'green' : 'amber'}`}>
                {stats.prefsSet ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <div className="stat-value">{stats.prefsSet ? 'Set' : 'Pending'}</div>
                <div className="stat-label">Preferences</div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.13} className="stat-card">
              <div className="stat-icon blue"><GraduationCap size={20} /></div>
              <div>
                <div className="stat-value"><CountUp end={stats.matchedStudents?.length || 0} /></div>
                <div className="stat-label">Matched Students</div>
              </div>
            </AnimatedCard>
          </div>

          {/* Show matched students */}
          {stats.matchedStudents?.length > 0 && (
            <AnimatedCard delay={0.25} className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Matched Students</div>
              {stats.matchedStudents.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderTop: '1px solid var(--border)',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#14b8a615', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraduationCap size={16} color="#14b8a6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{m.student?.full_name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{m.student?.email}</div>
                  </div>
                  <span className="badge badge-green">Active</span>
                  <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>Score: {m.score}/100</span>
                </div>
              ))}
            </AnimatedCard>
          )}

          {!stats.prefsSet && (
            <AnimatedCard delay={0.3} className="card action-card" onClick={() => navigate('/dashboard/org-preferences')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="stat-icon amber"><AlertCircle size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Set Organization Preferences</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Specify the student skills and project types you are looking for</div>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--accent)" />
              </div>
            </AnimatedCard>
          )}
        </>
      )}

      {/* ── Supervisor ── */}
      {role === 'supervisor' && (
        <>
          <div className="stat-grid">
            <AnimatedCard delay={0.05} className="stat-card">
              <div className="stat-icon blue"><GraduationCap size={20} /></div>
              <div>
                <div className="stat-value"><CountUp end={stats.placedStudents || 0} /></div>
                <div className="stat-label">Placed Students</div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.13} className="stat-card">
              <div className="stat-icon teal"><CheckCircle2 size={20} /></div>
              <div>
                <div className="stat-value"><CountUp end={stats.assessmentsDone || 0} /></div>
                <div className="stat-label">Assessments Recorded</div>
              </div>
            </AnimatedCard>
          </div>

          {/* Assigned students list */}
          <AnimatedCard delay={0.2} className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div>
                <div className="card-title">My Assigned Students</div>
                <div className="card-subtitle">
                  {stats.placedStudents > 0
                    ? 'Students the coordinator has placed under your supervision'
                    : 'You have not been assigned any students yet'}
                </div>
              </div>
              {stats.placedStudents > 0 && (
                <span className="badge badge-teal">{stats.placedStudents} student{stats.placedStudents === 1 ? '' : 's'}</span>
              )}
            </div>

            {stats.placedStudents === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Once the coordinator assigns students to you from the Matching page, they'll appear here.
              </div>
            ) : (
              <div>
                {(stats.placedList || []).map((item, idx) => (
                  <div
                    key={item.matchId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      borderTop: idx === 0 ? '1px solid var(--border)' : '1px solid var(--border)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: '#14b8a615',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <GraduationCap size={16} color="#14b8a6" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {item.student?.full_name || 'Unknown student'}
                        {item.student?.student_id && (
                          <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: 8 }}>
                            ({item.student.student_id})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={11} /> {item.orgName}
                        </span>
                        {item.student?.email && (
                          <>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span>{item.student.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate('/dashboard/student-logbooks')}
                        title="View this student's logbook entries"
                      >
                        <BookOpen size={13} /> Logbook
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/dashboard/uni-assessments')}
                        title="Record a visit assessment for this student"
                      >
                        Assess
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AnimatedCard>

          <AnimatedCard delay={0.3} className="card action-card" onClick={() => navigate('/dashboard/uni-assessments')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="stat-icon blue"><BookOpen size={20} /></div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Record a Visit Assessment</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>After visiting a student at their attachment site, capture your assessment</div>
                </div>
              </div>
              <ArrowRight size={18} color="var(--accent)" />
            </div>
          </AnimatedCard>
        </>
      )}
    </div>
  );
}
