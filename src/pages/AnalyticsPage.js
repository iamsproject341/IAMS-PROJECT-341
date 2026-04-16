import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  BarChart3, TrendingUp, Users, Building2, BookOpen, Award,
  CheckCircle2, Clock, XCircle, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRIMARY = '#14b8a6';
const BLUE = '#3b82f6';
const AMBER = '#f59e0b';
const ROSE = '#ef4444';
const PURPLE = '#a855f7';

export default function AnalyticsPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    counts: {},
    matchStatus: { pending: 0, approved: 0, rejected: 0 },
    placementsByOrg: [],
    scoreDistribution: [],
    logbookTimeline: [],
    avgSupervisorScore: 0,
    avgUniScore: 0,
    reportsSubmitted: 0,
    totalPlacedStudents: 0,
  });

  useEffect(() => {
    if (user && role === 'coordinator') loadAnalytics();
    else setLoading(false);
    // eslint-disable-next-line
  }, [user, role]);

  async function loadAnalytics() {
    try {
      const [
        studentsRes, orgsRes, matchesRes, logbooksRes,
        supReportsRes, uniAssRes, studentReportsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'organization'),
        supabase.from('matches').select('*, org:profiles!matches_org_id_fkey(full_name)'),
        supabase.from('logbooks').select('created_at, week_starting'),
        supabase.from('supervisor_reports').select('overall_score, student_id, recommend_for_hire'),
        supabase.from('university_assessments').select('overall_score, student_id'),
        supabase.from('student_reports').select('id', { count: 'exact', head: true }),
      ]);

      const matches = matchesRes.data || [];
      const approved = matches.filter(m => m.status === 'approved');
      const pending = matches.filter(m => m.status === 'pending').length;
      const rejected = matches.filter(m => m.status === 'rejected').length;

      // Placements grouped by org
      const byOrg = {};
      approved.forEach(m => {
        const n = m.org?.full_name || 'Unknown';
        byOrg[n] = (byOrg[n] || 0) + 1;
      });
      const placementsByOrg = Object.entries(byOrg)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Score distribution buckets (0-100 in 10-pt buckets) from supervisor reports
      const supReports = supReportsRes.data || [];
      const buckets = Array.from({ length: 10 }, (_, i) => ({
        range: `${i * 10 + 1}-${(i + 1) * 10}`,
        count: 0,
      }));
      supReports.forEach(r => {
        if (r.overall_score) {
          let idx = Math.floor((r.overall_score - 1) / 10);
          if (idx < 0) idx = 0;
          if (idx > 9) idx = 9;
          buckets[idx].count += 1;
        }
      });

      const avgSup = supReports.length
        ? supReports.reduce((s, r) => s + (r.overall_score || 0), 0) / supReports.length
        : 0;
      const uniAss = uniAssRes.data || [];
      const avgUni = uniAss.length
        ? uniAss.reduce((s, a) => s + (a.overall_score || 0), 0) / uniAss.length
        : 0;

      // Logbook submission timeline (last 12 weeks)
      const logs = logbooksRes.data || [];
      const weekMap = {};
      logs.forEach(l => {
        const d = new Date(l.created_at);
        const weekKey = `${d.getFullYear()}-W${String(getWeekNum(d)).padStart(2, '0')}`;
        weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
      });
      const timeline = Object.entries(weekMap)
        .sort()
        .slice(-12)
        .map(([week, count]) => ({ week, count }));

      setData({
        counts: {
          students: studentsRes.count || 0,
          organizations: orgsRes.count || 0,
          totalMatches: matches.length,
          logbooks: logs.length,
        },
        matchStatus: { pending, approved: approved.length, rejected },
        placementsByOrg,
        scoreDistribution: buckets,
        logbookTimeline: timeline,
        avgSupervisorScore: Math.round(avgSup),
        avgUniScore: Math.round(avgUni),
        reportsSubmitted: studentReportsRes.count || 0,
        totalPlacedStudents: approved.length,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics');
    }
    setLoading(false);
  }

  function exportCSV() {
    const rows = [
      ['Metric', 'Value'],
      ['Total Students', data.counts.students],
      ['Total Organizations', data.counts.organizations],
      ['Total Matches', data.counts.totalMatches],
      ['Approved Placements', data.matchStatus.approved],
      ['Pending Matches', data.matchStatus.pending],
      ['Rejected Matches', data.matchStatus.rejected],
      ['Total Logbook Entries', data.counts.logbooks],
      ['Final Reports Submitted', data.reportsSubmitted],
      ['Avg Industrial Supervisor Score', data.avgSupervisorScore],
      ['Avg University Supervisor Score', data.avgUniScore],
      [],
      ['Placements by Organization', ''],
      ...data.placementsByOrg.map(p => [p.name, p.count]),
    ];
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iams-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported');
  }

  if (role !== 'coordinator') {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><BarChart3 size={28} /></div>
          <h3>Coordinator Feature</h3>
          <p>Performance analytics is only available for coordinators.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">Overview of placements, submissions, and student performance.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon={<Users size={18} />} label="Students" value={data.counts.students} color={BLUE} />
        <StatCard icon={<Building2 size={18} />} label="Organizations" value={data.counts.organizations} color={PURPLE} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Active Placements" value={data.matchStatus.approved} color={PRIMARY} />
        <StatCard icon={<BookOpen size={18} />} label="Logbook Entries" value={data.counts.logbooks} color={AMBER} />
        <StatCard icon={<Award size={18} />} label="Final Reports" value={data.reportsSubmitted} color="#ec4899" />
      </div>

      {/* Match status row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Match Status Breakdown</div>
          </div>
          <DonutChart
            segments={[
              { label: 'Approved', value: data.matchStatus.approved, color: PRIMARY },
              { label: 'Pending', value: data.matchStatus.pending, color: AMBER },
              { label: 'Rejected', value: data.matchStatus.rejected, color: ROSE },
            ]}
          />
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Assessment Averages</div>
          </div>
          <div style={{ display: 'grid', gap: 18, paddingTop: 4 }}>
            <ScoreBar label="Industrial Supervisor Avg" score={data.avgSupervisorScore} color={PRIMARY} />
            <ScoreBar label="University Supervisor Avg" score={data.avgUniScore} color={BLUE} />
          </div>
        </div>
      </div>

      {/* Placements by org */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Placements per Organization</div>
        </div>
        {data.placementsByOrg.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p>No approved placements yet.</p>
          </div>
        ) : (
          <HorizontalBarChart
            data={data.placementsByOrg}
            color={PRIMARY}
          />
        )}
      </div>

      {/* Score distribution */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Supervisor Assessment Score Distribution</div>
        </div>
        {data.scoreDistribution.every(b => b.count === 0) ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p>No supervisor reports have been submitted yet.</p>
          </div>
        ) : (
          <VerticalBarChart
            data={data.scoreDistribution.map(b => ({ label: b.range, value: b.count }))}
            color={BLUE}
          />
        )}
      </div>

      {/* Logbook timeline */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Logbook Submissions (Recent Weeks)</div>
        </div>
        {data.logbookTimeline.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p>No logbook entries yet.</p>
          </div>
        ) : (
          <LineChart data={data.logbookTimeline} color={AMBER} />
        )}
      </div>
    </div>
  );
}

// ---- ISO week number ----
function getWeekNum(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// ---- Chart components ----

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}20`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function ScoreBar({ label, score, color }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color }}>{score}/100</span>
      </div>
      <div style={{
        height: 10, borderRadius: 999, background: 'var(--input-bg)',
        overflow: 'hidden', border: '1px solid var(--border)',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 999, transition: 'width 0.5s',
        }} />
      </div>
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return <div className="empty-state" style={{ padding: 20 }}><p>No data yet.</p></div>;
  }
  const size = 160;
  const radius = 60;
  const stroke = 24;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
          {segments.map((seg, i) => {
            const len = (seg.value / total) * circumference;
            const circle = (
              <circle
                key={i}
                r={radius}
                cx={0}
                cy={0}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circumference}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return circle;
          })}
        </g>
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="700">{total}</text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fill="var(--text-muted)" fontSize="11">Total</text>
      </svg>
      <div style={{ display: 'grid', gap: 6, flex: 1, minWidth: 120 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color }} />
            <span style={{ color: 'var(--text-muted)', flex: 1 }}>{seg.label}</span>
            <strong style={{ color: 'var(--text-primary)' }}>{seg.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {data.map(d => (
        <div key={d.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{d.name}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.count}</span>
          </div>
          <div style={{
            height: 10, borderRadius: 999, background: 'var(--input-bg)',
            overflow: 'hidden', border: '1px solid var(--border)',
          }}>
            <div style={{
              height: '100%', width: `${(d.count / max) * 100}%`,
              background: color, borderRadius: 999, transition: 'width 0.5s',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function VerticalBarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 44;
  const gap = 6;
  const chartWidth = data.length * (w + gap);
  const chartHeight = 180;
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={Math.max(chartWidth + 20, 400)} height={chartHeight + 40}>
        {data.map((d, i) => {
          const h = (d.value / max) * chartHeight;
          const x = i * (w + gap) + 10;
          const y = chartHeight - h + 4;
          return (
            <g key={i}>
              {d.value > 0 && (
                <text x={x + w / 2} y={y - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="600">
                  {d.value}
                </text>
              )}
              <rect x={x} y={y} width={w} height={h} fill={color} rx={4} opacity={0.85} />
              <text x={x + w / 2} y={chartHeight + 22} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChart({ data, color }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 600;
  const h = 180;
  const padX = 40;
  const padY = 20;
  const usableW = w - padX * 2;
  const usableH = h - padY * 2;
  const step = data.length > 1 ? usableW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padX + i * step;
    const y = padY + usableH - (d.count / max) * usableH;
    return { x, y, ...d };
  });

  const pathD = points.length
    ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
    : '';

  const fillD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${padY + usableH} L ${points[0].x} ${padY + usableH} Z`
    : '';

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={w} height={h + 30} viewBox={`0 0 ${w} ${h + 30}`} style={{ minWidth: 400 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={t}
            x1={padX} x2={w - padX}
            y1={padY + usableH * t} y2={padY + usableH * t}
            stroke="var(--border)" strokeDasharray="2,4"
          />
        ))}
        {/* Fill */}
        <path d={fillD} fill={color} opacity={0.15} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={color} />
            <text x={p.x} y={h} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
              {p.week.split('-W')[1] ? `W${p.week.split('-W')[1]}` : ''}
            </text>
          </g>
        ))}
        {/* Y axis max */}
        <text x={padX - 6} y={padY + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">{max}</text>
        <text x={padX - 6} y={padY + usableH + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">0</text>
      </svg>
    </div>
  );
}
