import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const SKILLS = [
  'JavaScript', 'Python', 'Java', 'C/C++', 'React', 'Flutter',
  'Node.js', 'SQL/Databases', 'Machine Learning', 'Cybersecurity',
  'Networking', 'Mobile Dev', 'Cloud/DevOps', 'UI/UX Design',
  'Data Analysis', 'Embedded Systems',
];

const PROJECT_TYPES = [
  'Web Development', 'Mobile App Development', 'Data Science',
  'System Administration', 'Network Engineering', 'Software Testing',
  'Research & Development', 'IT Support', 'Cybersecurity', 'Game Development',
];

const LOCATIONS = [
  'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Palapye',
  'Selebi-Phikwe', 'Lobatse', 'Molepolole', 'Any Location',
];

export default function StudentPreferences() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [hasMatch, setHasMatch] = useState(false);

  useEffect(() => {
    loadPrefs();
    checkMatch();
    // eslint-disable-next-line
  }, []);

  async function checkMatch() {
    try {
      const { data } = await supabase.from('matches').select('id').eq('student_id', user.id).eq('status', 'approved').maybeSingle();
      setHasMatch(!!data);
    } catch (err) { /* ignore */ }
  }

  async function loadPrefs() {
    try {
      const { data } = await supabase
        .from('student_preferences')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      if (data) {
        setExisting(data);
        setSkills(data.skills || []);
        setProjectTypes(data.project_types || []);
        setLocations(data.locations || []);
        setAdditionalNotes(data.additional_notes || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  function toggleItem(list, setList, item) {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (skills.length === 0) return toast.error('Select at least one skill');
    if (projectTypes.length === 0) return toast.error('Select at least one project type');
    if (locations.length === 0) return toast.error('Select at least one location');

    setLoading(true);
    try {
      const payload = {
        student_id: user.id,
        skills,
        project_types: projectTypes,
        locations,
        additional_notes: additionalNotes,
      };

      if (existing) {
        const { error } = await supabase
          .from('student_preferences')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_preferences')
          .insert(payload);
        if (error) throw error;
      }
      toast.success('Preferences saved successfully!');
      loadPrefs();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className="page-title">Attachment Preferences</h1>
          {existing && <span className="badge badge-green"><CheckCircle2 size={12} /> Saved</span>}
        </div>
        <p className="page-subtitle">
          Select your skills, preferred project types, and location preferences for your industrial attachment.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Technical Skills</div>
              <div className="card-subtitle">Select all skills that apply to you</div>
            </div>
            <span className="badge badge-teal">{skills.length} selected</span>
          </div>
          <div className="checkbox-grid">
            {SKILLS.map((skill) => (
              <label key={skill} className={`checkbox-item ${skills.includes(skill) ? 'selected' : ''}`}>
                <input type="checkbox" checked={skills.includes(skill)} onChange={() => toggleItem(skills, setSkills, skill)} />
                <span className="checkbox-box">
                  {skills.includes(skill) && <CheckCircle2 size={10} />}
                </span>
                {skill}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Preferred Project Types</div>
              <div className="card-subtitle">What kind of work interests you?</div>
            </div>
            <span className="badge badge-teal">{projectTypes.length} selected</span>
          </div>
          <div className="checkbox-grid">
            {PROJECT_TYPES.map((pt) => (
              <label key={pt} className={`checkbox-item ${projectTypes.includes(pt) ? 'selected' : ''}`}>
                <input type="checkbox" checked={projectTypes.includes(pt)} onChange={() => toggleItem(projectTypes, setProjectTypes, pt)} />
                <span className="checkbox-box">
                  {projectTypes.includes(pt) && <CheckCircle2 size={10} />}
                </span>
                {pt}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Location Preferences</div>
              <div className="card-subtitle">Where would you prefer to do your attachment?</div>
            </div>
            <span className="badge badge-teal">{locations.length} selected</span>
          </div>
          <div className="checkbox-grid">
            {LOCATIONS.map((loc) => (
              <label key={loc} className={`checkbox-item ${locations.includes(loc) ? 'selected' : ''}`}>
                <input type="checkbox" checked={locations.includes(loc)} onChange={() => toggleItem(locations, setLocations, loc)} />
                <span className="checkbox-box">
                  {locations.includes(loc) && <CheckCircle2 size={10} />}
                </span>
                {loc}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Additional Notes</div>
          <textarea
            className="form-textarea"
            placeholder="Anything else you'd like the coordinator to know about your preferences..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={4}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Save size={18} /> {existing ? 'Update Preferences' : 'Save Preferences'}</>}
          </button>

          {existing && !hasMatch && (
            <button type="button" className="btn btn-danger" onClick={async () => {
              if (!window.confirm('Delete your preferences? This cannot be undone.')) return;
              try {
                await supabase.from('student_preferences').delete().eq('id', existing.id);
                toast.success('Preferences deleted');
                setExisting(null); setSkills([]); setProjectTypes([]); setLocations([]); setAdditionalNotes('');
              } catch (err) { toast.error('Failed to delete'); }
            }}>
              <Trash2 size={16} /> Delete Preferences
            </button>
          )}
        </div>

        {hasMatch && existing && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              You have an approved placement. You can update preferences for future matching, but you cannot delete them while placed. Your current placement is not affected.
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
