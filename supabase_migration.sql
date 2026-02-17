-- ============================================
-- IAMS (AttachFlow) Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'organization', 'coordinator', 'supervisor')),
  phone TEXT,
  student_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Student Preferences
CREATE TABLE IF NOT EXISTS student_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  project_types TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- 3. Organization Preferences
CREATE TABLE IF NOT EXISTS org_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  desired_skills TEXT[] DEFAULT '{}',
  project_types TEXT[] DEFAULT '{}',
  location TEXT,
  num_students INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id)
);

-- 4. Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, org_id)
);

-- 5. Logbooks
CREATE TABLE IF NOT EXISTS logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  week_starting DATE NOT NULL,
  activities_performed TEXT NOT NULL,
  skills_learned TEXT,
  challenges TEXT,
  next_week_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbooks ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read, users can update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Student Preferences: students manage own, coordinators can read all
CREATE POLICY "Students can manage own prefs" ON student_preferences FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Coordinators can read student prefs" ON student_preferences FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coordinator')
);

-- Org Preferences: orgs manage own, coordinators can read all
CREATE POLICY "Orgs can manage own prefs" ON org_preferences FOR ALL USING (auth.uid() = org_id);
CREATE POLICY "Coordinators can read org prefs" ON org_preferences FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coordinator')
);

-- Matches: coordinators can manage, students/orgs can read their own
CREATE POLICY "Coordinators manage matches" ON matches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coordinator')
);
CREATE POLICY "Students can read own matches" ON matches FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Orgs can read own matches" ON matches FOR SELECT USING (auth.uid() = org_id);

-- Logbooks: students manage own, coordinators/supervisors can read all
CREATE POLICY "Students manage own logbooks" ON logbooks FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Coordinators can read logbooks" ON logbooks FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coordinator', 'supervisor'))
);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_student_prefs_updated_at BEFORE UPDATE ON student_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_org_prefs_updated_at BEFORE UPDATE ON org_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
