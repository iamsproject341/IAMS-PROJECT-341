import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DESIRED_SKILLS = [
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
  'Selebi-Phikwe', 'Lobatse', 'Molepolole',
];

export default function OrgPreferences() {
  const { user } = useAuth();
  const [desiredSkills, setDesiredSkills] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [location, setLocation] = useState('');
  const [numStudents, setNumStudents] = useState(1);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => { loadPrefs(); }, []); // eslint-disable-line

  async function loadPrefs() {
    try {
      const { data } = await supabase.from('org_preferences').select('*').eq('org_id', user.id).maybeSingle();
      if (data) {
        setExisting(data);
        setDesiredSkills(data.desired_skills || []);
        setProjectTypes(data.project_types || []);
        setLocation(data.location || '');
        setNumStudents(data.num_students || 1);
        setDescription(data.description || '');
      }
    } catch (err) { console.error(err); }
    finally { setFetching(false); }
  }

  function toggleItem(list, setList, item) {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  }

  // Prevent negative numbers - only allow positive integers
  function handleNumChange(val) {
    const cleaned = val.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned) || 0;
    if (num > 100) return;
    setNumStudents(num);
    setErrors(p => ({...p, numStudents: ''}));
  }

  function validate() {
    const e = {};
    if (desiredSkills.length === 0) e.skills = 'Select at least one desired skill';
    if (projectTypes.length === 0) e.projects = 'Select at least one project type';
    if (!location) e.location = 'Please select your location';
    if (!numStudents || numStudents < 1) e.numStudents = 'Must be at least 1 student';
    if (numStudents > 100) e.numStudents = 'Maximum 100 students';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) {
      // Show first error as toast
      const firstErr = Object.values(errors).find(Boolean) || 'Please fix the errors above';
      toast.error(firstErr);
      return;
    }
    setLoading(true);
    try {
      const payload = { org_id: user.id, desired_skills: desiredSkills, project_types: projectTypes, location, num_students: numStudents, description };
      if (existing) {
        const { error } = await supabase.from('org_preferences').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('org_preferences').insert(payload);
        if (error) throw error;
      }
      toast.success('Preferences saved!');
      loadPrefs();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally { setLoading(false); }
  }

  if (fetching) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className="page-title">Organization Preferences</h1>
          {existing && <span className="badge badge-green"><CheckCircle2 size={11} /> Saved</span>}
        </div>
        <p className="page-subtitle">Specify the student skills and project areas you are looking for.</p>
      </div>
      <form onSubmit={handleSave} noValidate>
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div><div className="card-title">Desired Student Skills <span style={{ color: 'var(--error)' }}>*</span></div><div className="card-subtitle">What technical skills should students have?</div></div>
            <span className="badge badge-teal">{desiredSkills.length} selected</span>
          </div>
          <div className="checkbox-grid">
            {DESIRED_SKILLS.map(s => (
              <label key={s} className={`checkbox-item ${desiredSkills.includes(s) ? 'selected' : ''}`}>
                <input type="checkbox" checked={desiredSkills.includes(s)} onChange={() => toggleItem(desiredSkills, setDesiredSkills, s)} />
                <span className="checkbox-box">{desiredSkills.includes(s) && <CheckCircle2 size={9} />}</span>{s}
              </label>
            ))}
          </div>
          {errors.skills && <div className="form-error" style={{ marginTop: 8 }}>{errors.skills}</div>}
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header">
            <div><div className="card-title">Project Types Available <span style={{ color: 'var(--error)' }}>*</span></div><div className="card-subtitle">What kind of work will students be doing?</div></div>
            <span className="badge badge-teal">{projectTypes.length} selected</span>
          </div>
          <div className="checkbox-grid">
            {PROJECT_TYPES.map(pt => (
              <label key={pt} className={`checkbox-item ${projectTypes.includes(pt) ? 'selected' : ''}`}>
                <input type="checkbox" checked={projectTypes.includes(pt)} onChange={() => toggleItem(projectTypes, setProjectTypes, pt)} />
                <span className="checkbox-box">{projectTypes.includes(pt) && <CheckCircle2 size={9} />}</span>{pt}
              </label>
            ))}
          </div>
          {errors.projects && <div className="form-error" style={{ marginTop: 8 }}>{errors.projects}</div>}
        </div>

        <div className="form-row" style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>Location <span style={{ color: 'var(--error)' }}>*</span></div>
            <select className={`form-select ${errors.location ? 'input-error' : ''}`} value={location} onChange={(e) => { setLocation(e.target.value); setErrors(p => ({...p, location:''})); }}>
              <option value="">Select location</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {errors.location && <div className="form-error">{errors.location}</div>}
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>Number of Students <span style={{ color: 'var(--error)' }}>*</span></div>
            <input type="text" inputMode="numeric" className={`form-input ${errors.numStudents ? 'input-error' : ''}`}
              value={numStudents} onChange={(e) => handleNumChange(e.target.value)}
              placeholder="e.g. 5" />
            {errors.numStudents && <div className="form-error">{errors.numStudents}</div>}
            {!errors.numStudents && <div className="form-hint">Between 1 and 100</div>}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 22 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>Organization Description</div>
          <textarea className="form-textarea" placeholder="Brief description of your organization and the kind of projects available..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Save size={17} /> Save Preferences</>}
        </button>
      </form>
    </div>
  );
}
