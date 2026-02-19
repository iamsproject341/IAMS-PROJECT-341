import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tswpcrejjlpkcfdbzjio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3BjcmVqamxwa2NmZGJ6amlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDc4MDEsImV4cCI6MjA4NjkyMzgwMX0.enA3lhX72jCEvaAdigFOEBORmWvGK36MB6aHLISR6CU';

// Main client - persists session (normal user login/logout)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client - does NOT persist sessions
// Used by coordinator to create accounts without getting logged out
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
