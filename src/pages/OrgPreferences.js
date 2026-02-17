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

  useEffect(() => {
    loadPrefs();
    // eslint-disable-next-line
  }, []);

  async function loadPrefs() {
    try {
      const { data } = await supabase
        .from('org_preferences')
        .select('*')
        .eq('org_id', user.id)
        .maybeSingle();
      if (data) {
        setExisting(data);
        setDesiredSkills(data.desired_skills || []);
        setProjectTypes(data.project_types || []);
        setLocation(data.location || '');
        setNumStudents(data.num_students || 1);
        setDescription(data.description || '');
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
    if (desiredSkills.length === 0) return toast.error('Select at least one desired skill');
    if (projectTypes.length === 0) return toast.error('Select at least one project type');
    if (!location) return toast.error('Select your location');

    setLoading(true);
    try {
      const payload = {
        org_id: user.id,
        desired_skills: desiredSkills,
        project_types: projectTypes,
        location,
        num_students: numStudents,
        description,
      };

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
          <h1 className="page-title">Organization Preferences</h1>
          {existing && <span className="badge badge-green"><CheckCircle2 size={12} /> Saved</span>}
        </div>
        <p className="page-subtitle">
          Specify the student skills and project areas you are looking for in attachment candidates.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Desired Student Skills</div>
              <div className="card-subtitle">What technical skills should students have?</div>
            </div>
            <span className="badge badge-teal">{desiredSkills.length} selected</span>
          </div>
          <div className="checkbox-grid">
            {DESIRED_SKILLS.map((s) => (
              <label key={s} className={`checkbox-item ${desiredSkills.includes(s) ? 'selected' : ''}`}>
                <input type="checkbox" checked={desiredSkills.includes(s)} onChange={() => toggleItem(desiredSkills, setDesiredSkills, s)} />
                <span className="checkbox-box">{desiredSkills.includes(s) && <CheckCircle2 size={10} />}</span>
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Project Types Available</div>
              <div className="card-subtitle">What kind of work will students be doing?</div>
            </div>
            <span className="badge badge-teal">{projectTypes.length} selected</span>
          </div>
          <div className="checkbox-grid">
            {PROJECT_TYPES.map((pt) => (
              <label key={pt} className={`checkbox-item ${projectTypes.includes(pt) ? 'selected' : ''}`}>
                <input type="checkbox" checked={projectTypes.includes(pt)} onChange={() => toggleItem(projectTypes, setProjectTypes, pt)} />
                <span className="checkbox-box">{projectTypes.includes(pt) && <CheckCircle2 size={10} />}</span>
                {pt}
              </label>
            ))}
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Location</div>
            <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Select location</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Number of Students Needed</div>
            <input
              type="number"
              className="form-input"
              min={1}
              max={50}
              value={numStudents}
              onChange={(e) => setNumStudents(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Organization Description</div>
          <textarea
            className="form-textarea"
            placeholder="Brief description of your organization and the kind of projects available..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Save size={18} /> Save Preferences</>}
        </button>
      </form>
    </div>
  );
}
