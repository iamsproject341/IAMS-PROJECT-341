import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track the "real" user ID to ignore session hijacks from admin client
  const realUserIdRef = useRef(null);

  useEffect(() => {
    // Check if this is a fresh browser session (tab/window was closed and reopened)
    // sessionStorage persists within a tab but clears when the browser/tab closes
    const isExistingSession = sessionStorage.getItem('iams_active');

    if (!isExistingSession) {
      // Fresh visit — clear any saved Supabase session so user must log in again
      sessionStorage.setItem('iams_active', 'true');

      // Remove all Supabase auth keys from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      setLoading(false);
      return;
    }
    // Safety timeout — never hang more than 4 seconds
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        realUserIdRef.current = session.user.id;
        setUser(session.user);
        fetchProfile(session.user.id).finally(() => {
          clearTimeout(safetyTimer);
        });
      } else {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    }).catch(() => {
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        realUserIdRef.current = null;
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        // If we already have a "real" user logged in, ignore any session
        // that's for a different user (caused by admin.createUser)
        if (realUserIdRef.current && session.user.id !== realUserIdRef.current) {
          console.warn('Ignoring session switch from admin client');
          // Restore the real session
          supabase.auth.getSession().then(({ data: { session: realSession } }) => {
            if (realSession && realSession.user.id === realUserIdRef.current) {
              setUser(realSession.user);
            }
          });
          return;
        }

        // Normal sign-in
        realUserIdRef.current = session.user.id;
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        setProfile(null);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
    setLoading(false);
  }

  async function signUp({ email, password, fullName, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }
      }
    });
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    realUserIdRef.current = data.user.id;
    return data;
  }

  async function signOut() {
    realUserIdRef.current = null;
    setProfile(null);
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchProfile: () => user && fetchProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
