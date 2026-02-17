import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AnimatedCard, CountUp } from '../components/AnimatedCard';
import {
  GraduationCap, Building2, BookOpen, Shuffle,
  ArrowRight, CheckCircle2, Clock, AlertCircle,
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

  async function loadStats() {
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
          supabase.from('matches').select('*, org:profiles!matches_org_id_fkey(full_name)').eq('student_id', user.id).eq('status', 'approved').maybeSingle(),
        ]);
        setStats({ prefsSet: prefs.data?.length > 0, logbookCount: logbooks.count || 0, match: match.data });
      } else if (role === 'organization') {
        const [prefs, matches] = await Promise.all([
          supabase.from('org_preferences').select('id').eq('org_id', user.id),
          supabase.from('matches').select('id', { count: 'exact', head: true }).eq('org_id', user.id).eq('status', 'approved'),
        ]);
        setStats({ prefsSet: prefs.data?.length > 0, matchedStudents: matches.count || 0 });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

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

      {/* Coordinator */}
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

      {/* Student */}
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
                <span className="badge badge-green">Approved Placement</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{stats.match.org?.full_name || 'Organization'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>You have been matched. Check your logbook section to start logging weekly progress.</div>
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

      {/* Organization */}
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
                <div className="stat-value"><CountUp end={stats.matchedStudents} /></div>
                <div className="stat-label">Matched Students</div>
              </div>
            </AnimatedCard>
          </div>
          {!stats.prefsSet && (
            <AnimatedCard delay={0.25} className="card action-card" onClick={() => navigate('/dashboard/org-preferences')}>
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

      {/* Supervisor */}
      {role === 'supervisor' && (
        <AnimatedCard delay={0.1} className="card">
          <div className="empty-state" style={{ padding: '40px 24px' }}>
            <div className="empty-state-icon"><BookOpen size={28} /></div>
            <h3>Supervisor Dashboard</h3>
            <p>Assessment and report features will be available in Release 2. Your account is set up and ready.</p>
          </div>
        </AnimatedCard>
      )}
    </div>
  );
}
