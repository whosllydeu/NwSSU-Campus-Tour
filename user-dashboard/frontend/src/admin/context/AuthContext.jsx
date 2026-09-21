import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSession, getProfile, onAuthStateChange, signIn, signOut } from '../services/auth.service.js';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Used only for session restore on app load — failing here just means
  // "treat as signed out," so it's fine to swallow.
  const loadProfileQuiet = useCallback(async (sess) => {
    if (!sess?.user) { setProfile(null); return; }
    try {
      const p = await getProfile(sess.user.id);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getSession().then(async (sess) => {
      if (!mounted) return;
      setSession(sess);
      await loadProfileQuiet(sess);
      setLoading(false);
    });
    const sub = onAuthStateChange(async (sess) => {
      setSession(sess);
      await loadProfileQuiet(sess);
    });
    return () => { mounted = false; sub.unsubscribe(); };
  }, [loadProfileQuiet]);

  // Used for the actual login button — here a problem MUST surface to
  // the caller (Login.jsx) as a real error message, not a silent bounce.
  const login = useCallback(async (email, password) => {
    const { session: sess } = await signIn(email, password);
    setSession(sess);

    let p;
    try {
      p = await getProfile(sess.user.id);
    } catch (err) {
      await signOut().catch(() => {});
      setSession(null);
      throw new Error(`Signed in, but couldn't load your profile: ${err.message}`);
    }

    if (!p) {
      await signOut().catch(() => {});
      setSession(null);
      throw new Error('Signed in, but no profile record exists for this account yet.');
    }
    if (p.role !== 'admin') {
      await signOut().catch(() => {});
      setSession(null);
      setProfile(null);
      throw new Error(`This account is signed in but is role="${p.role}", not admin.`);
    }

    setProfile(p);
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = {
    session,
    profile,
    isAdmin: profile?.role === 'admin',
    isAuthenticated: Boolean(session),
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}