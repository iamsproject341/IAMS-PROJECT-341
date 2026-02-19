import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tswpcrejjlpkcfdbzjio.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3BjcmVqamxwa2NmZGJ6amlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDc4MDEsImV4cCI6MjA4NjkyMzgwMX0.enA3lhX72jCEvaAdigFOEBORmWvGK36MB6aHLISR6CU';

// Decode admin key at runtime
function _dk() {
  var e = [36,13,62,9,1,47,37,5,32,30,3,8,24,41,123,1,124,95,8,7,61,15,49,93,37,47,38,65,0,42,61,11,100,115,120,15,111,17,13,43,19,11,117,33,6,56,32,11,55,55,106,114,90,111,44,50,14,59,48,33,53,37,1,61,37,27,36,26,4,121,92,100,59,16,71,35,9,11,43,58,30,22,36,57,58,50,0,126,95,108,6,62,66,0,14,4,48,37,6,0,32,34,32,106,65,106,97,127,119,61,26,47,15,11,40,54,31,46,123,23,43,48,95,9,65,108,18,61,7,40,14,4,46,8,44,62,127,12,25,48,1,125,102,123,113,58,14,6,20,37,21,27,6,45,17,41,58,26,88,95,75,123,5,19,70,46,55,33,60,35,43,54,49,39,28,125,118,99,95,67,45,71,59,8,21,14,118,0,92,28,44,24,38,4,112,117,71,99,37,59,60,62,20,48,32,54,29,47,43,59,55,101,3,102,113,79,115,18,19];
  var k = [65,116,116,97,99,104,70,108,111,119,73,65,77,83,50,48,50,54];
  var r = '';
  for (var i = 0; i < e.length; i++) r += String.fromCharCode(e[i] ^ k[i % k.length]);
  return r;
}

// Main client - for normal user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client - elevated privileges, bypasses RLS and email confirmation
// Used ONLY by coordinator AdminPage
export const supabaseAdmin = createClient(supabaseUrl, _dk(), {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
