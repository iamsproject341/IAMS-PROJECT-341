import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tswpcrejjlpkcfdbzjio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3BjcmVqamxwa2NmZGJ6amlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDc4MDEsImV4cCI6MjA4NjkyMzgwMX0.enA3lhX72jCEvaAdigFOEBORmWvGK36MB6aHLISR6CU';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3BjcmVqamxwa2NmZGJ6amlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM0NzgwMSwiZXhwIjoyMDg2OTIzODAxfQ.DSmul3Oivf0l3keYkWBEuUdOH_wXfZrXbzz61VCy2fg';

// Main client - for normal user operations (login, reading own data)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client - service role key, bypasses RLS and email confirmation
// Used ONLY by coordinator AdminPage to create/manage accounts
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
