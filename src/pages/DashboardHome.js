import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line
  }, [role]);

  async function loadStats() {
    try {
      if (role === 'coordinator') {
        const [students, orgs, matches, logbooks] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'organization'),
          supabase.from('matches').select('id', { count: 'exact', head: true }),
          supabase.from('logbooks').select('id', { count: 'exact', head: true }),
        ]);
        setStats({
          students: students.count || 0,
          organizations: orgs.count || 0,
          matches: matches.count || 0,
          logbooks: logbooks.count || 0,
        });
      } else if (role === 'student') {
        const [prefs, logbooks, match] = await Promise.all([
          supabase.from('student_preferences').select('id').eq('student_id', user.id),
          supabase.from('logbooks').select('id', { count: 'exact', head: true }).eq('student_id', user.id),
          supabase.from('matches').select('*, org:profiles!matches_org_id_fkey(full_name)').eq('student_id', user.id).eq('status', 'approved').maybeSingle(),
        ]);
        setStats({
          prefsSet: prefs.data?.length > 0,
          logbookCount: logbooks.count || 0,
          match: match.data,
        });
      } else if (role === 'organization') {
        const [prefs, matches] = await Promise.all([
          supabase.from('org_preferences').select('id').eq('org_id', user.id),
          supabase.from('matches').select('id', { count: 'exact', head: true }).eq('org_id', user.id).eq('status', 'approved'),
        ]);
        setStats({
          prefsSet: prefs.data?.length > 0,
          matchedStudents: matches.count || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome, {firstName}</h1>
        <p className="page-subtitle">
          {role === 'student' && 'Manage your attachment preferences, logbooks, and track your placement.'}
          {role === 'organization' && 'Set your preferences and manage student attachments.'}
          {role === 'coordinator' && 'Oversee the attachment process, match students and organizations.'}
          {role === 'supervisor' && 'Track student progress and submit assessments.'}
        </p>
      </div>

      {/* Coordinator Dashboard */}
      {role === 'coordinator' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon teal"><GraduationCap size={20} /></div>
              <div>
                <div className="stat-value">{stats.students}</div>
                <div className="stat-label">Registered Students</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><Building2 size={20} /></div>
              <div>
                <div className="stat-value">{stats.organizations}</div>
                <div className="stat-label">Organizations</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><Shuffle size={20} /></div>
              <div>
                <div className="stat-value">{stats.matches}</div>
                <div className="stat-label">Approved Matches</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><BookOpen size={20} /></div>
              <div>
                <div className="stat-value">{stats.logbooks}</div>
                <div className="stat-label">Logbook Entries</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/matching')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="stat-icon teal"><Shuffle size={20} /></div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Run Matching Algorithm</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Match students with organizations based on preferences
                  </div>
                </div>
              </div>
              <ArrowRight size={18} color="var(--accent)" />
            </div>
          </div>
        </>
      )}

      {/* Student Dashboard */}
      {role === 'student' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className={`stat-icon ${stats.prefsSet ? 'green' : 'amber'}`}>
                {stats.prefsSet ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <div className="stat-value">{stats.prefsSet ? 'Set' : 'Pending'}</div>
                <div className="stat-label">Preferences</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><BookOpen size={20} /></div>
              <div>
                <div className="stat-value">{stats.logbookCount}</div>
                <div className="stat-label">Logbook Entries</div>
              </div>
            </div>
            <div className="stat-card">
              <div className={`stat-icon ${stats.match ? 'green' : 'teal'}`}>
                {stats.match ? <CheckCircle2 size={20} /> : <Clock size={20} />}
              </div>
              <div>
                <div className="stat-value">{stats.match ? 'Matched' : 'Waiting'}</div>
                <div className="stat-label">Placement Status</div>
              </div>
            </div>
          </div>

          {stats.match && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="badge badge-green">Approved Placement</div>
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {stats.match.org?.full_name || 'Organization'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                You have been matched. Check your logbook section to start logging weekly progress.
              </div>
            </div>
          )}

          {!stats.prefsSet && (
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/preferences')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="stat-icon amber"><AlertCircle size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Set Your Preferences</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Submit your skills, location, and project preferences to get matched
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--accent)" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Organization Dashboard */}
      {role === 'organization' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className={`stat-icon ${stats.prefsSet ? 'green' : 'amber'}`}>
                {stats.prefsSet ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <div className="stat-value">{stats.prefsSet ? 'Set' : 'Pending'}</div>
                <div className="stat-label">Preferences</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><GraduationCap size={20} /></div>
              <div>
                <div className="stat-value">{stats.matchedStudents}</div>
                <div className="stat-label">Matched Students</div>
              </div>
            </div>
          </div>

          {!stats.prefsSet && (
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/org-preferences')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="stat-icon amber"><AlertCircle size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Set Organization Preferences</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Specify the student skills and project types you are looking for
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} color="var(--accent)" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Supervisor Dashboard */}
      {role === 'supervisor' && (
        <div className="card">
          <div className="empty-state" style={{ padding: '40px 24px' }}>
            <div className="empty-state-icon"><BookOpen size={28} /></div>
            <h3>Supervisor Dashboard</h3>
            <p>Assessment and report features will be available in Release 2. For now, your account is set up and ready.</p>
          </div>
        </div>
      )}
    </div>
  );
}
