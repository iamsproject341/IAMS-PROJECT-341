import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, Upload, Download, CheckCircle2, Lock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_SIZE_MB = 10;
const BUCKET = 'student-reports';

export default function StudentReportPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  const [match, setMatch] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && role === 'student') loadData();
    else setLoading(false);
    // eslint-disable-next-line
  }, [user, role]);

  async function loadData() {
    try {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*, org:profiles!matches_org_id_fkey(full_name)')
        .eq('student_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      setMatch(matchData || false);

      const { data: reportData } = await supabase
        .from('student_reports')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      setReport(reportData || null);
      if (reportData) {
        setTitle(reportData.title);
        setSummary(reportData.summary);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large (max ${MAX_SIZE_MB} MB)`);
      return;
    }
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      toast.error('Only PDF, DOC or DOCX files are accepted');
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 5) {
      toast.error('Title must be at least 5 characters'); return;
    }
    if (!summary.trim() || summary.trim().length < 30) {
      toast.error('Summary must be at least 30 characters'); return;
    }
    if (!file && !report?.file_url) {
      toast.error('Please select a file to upload'); return;
    }

    setSubmitting(true);
    try {
      let fileUrl = report?.file_url || null;
      let fileName = report?.file_name || null;
      let fileSize = report?.file_size || null;

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/report-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        fileUrl = pub.publicUrl;
        fileName = file.name;
        fileSize = file.size;
      }

      const { error } = await supabase.from('student_reports').upsert({
        student_id: user.id,
        title: title.trim(),
        summary: summary.trim(),
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
      }, { onConflict: 'student_id' });
      if (error) throw error;
      toast.success(report ? 'Report updated' : 'Report submitted successfully!');
      setFile(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
    setSubmitting(false);
  }

  async function handleRemove() {
    if (!report || !window.confirm('Remove your submitted report? You can re-submit later.')) return;
    try {
      await supabase.from('student_reports').delete().eq('student_id', user.id);
      toast.success('Report removed');
      setReport(null);
      setTitle(''); setSummary(''); setFile(null);
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  }

  if (role !== 'student') {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><FileText size={28} /></div>
          <h3>Student Feature</h3>
          <p>Final report submission is only available for students.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  }

  if (!match) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Final Report</h1>
            <p className="page-subtitle">Submit your attachment final report.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty-state" style={{ padding: '60px 24px' }}>
            <div className="empty-state-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Lock size={28} color="#f59e0b" />
            </div>
            <h3>Final Report Locked</h3>
            <p style={{ maxWidth: 420 }}>
              You need to be matched with an organization before you can submit your final report.
              Complete your placement first, then return here to submit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Final Report</h1>
          <p className="page-subtitle">Submit your attachment final report. Your coordinator and industrial supervisor can view it.</p>
        </div>
      </div>

      {report && (
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px', border: '1px solid rgba(20,184,166,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: 'rgba(20,184,166,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={18} color="#14b8a6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Report Submitted</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {report.file_name} {report.file_size && `· ${(report.file_size / 1024 / 1024).toFixed(2)} MB`} · Submitted {new Date(report.submitted_at).toLocaleDateString()}
              </div>
            </div>
            {report.file_url && (
              <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <Download size={14} /> Download
              </a>
            )}
            <button onClick={handleRemove} className="btn btn-ghost btn-sm" title="Remove report">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">{report ? 'Update Report' : 'Submit New Report'}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Report Title *</label>
            <input
              className="form-input" maxLength={200}
              placeholder="e.g. Industrial Attachment Final Report — ACME Technologies"
              value={title} onChange={e => setTitle(e.target.value)}
            />
            <div className="form-hint">Min 5 characters. {title.length}/200</div>
          </div>

          <div className="form-group">
            <label className="form-label">Summary *</label>
            <textarea
              className="form-textarea" rows={5} maxLength={3000}
              placeholder="Briefly summarize what you did during attachment, key skills gained, and main takeaways..."
              value={summary} onChange={e => setSummary(e.target.value)}
            />
            <div className="form-hint">Min 30 characters. {summary.length}/3000</div>
          </div>

          <div className="form-group">
            <label className="form-label">Report File *</label>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              background: 'var(--input-bg)',
            }}>
              <input
                type="file"
                id="report-file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="report-file" style={{ cursor: 'pointer', display: 'block' }}>
                <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {file ? file.name : (report?.file_name || 'Click to upload report')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB — click to change`
                    : `PDF, DOC, or DOCX (max ${MAX_SIZE_MB} MB)`
                  }
                </div>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting
              ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              : <><Upload size={16} /> {report ? 'Update Report' : 'Submit Report'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
