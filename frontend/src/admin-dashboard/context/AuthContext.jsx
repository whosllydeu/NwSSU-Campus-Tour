import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSession, getProfile, onAuthStateChange, signIn, signOut } from '../services/auth.service.js';
import {
  claimAdminSession,
  releaseAdminSession,
  busyMessage,
  HEARTBEAT_MS,
} from '../services/adminSession.service.js';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const dropSession = useCallback(async (message) => {
    await signOut().catch(() => {});
    setSession(null);
    setProfile(null);
    if (message) setNotice(message);
  }, []);

  const loadProfileQuiet = useCallback(async (sess) => {
    if (!sess?.user) { setProfile(null); return; }
    try {
      const p = await getProfile(sess.user.id);
      if (p?.role === 'admin') {
        const lock = await claimAdminSession();
        if (!lock.ok) {
          await dropSession(busyMessage(lock));
          return;
        }
      }
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, [dropSession]);

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

  const login = useCallback(async (email, password) => {
    setNotice('');
    const { session: sess } = await signIn(email, password);
    setSession(sess);

    let p;
    try {
      p = await getProfile(sess.user.id);
    } catch (err) {
      await signOut().catch(() => {});
      setSession(null);
      alert(`Signed in, but couldn't load your profile: ${err.message}`);
    }

    if (!p) {
      await signOut().catch(() => {});
      setSession(null);
      throw new Error('Signed out.');
    }
    if (p.role !== 'admin') {
      await signOut().catch(() => {});
      setSession(null);
      setProfile(null);
      throw new Error(`This account is signed in but is role="${p.role}", not admin.`);
    }

    let lock;
    try {
      lock = await claimAdminSession();
    } catch (err) {
      await dropSession();
      throw err;
    }
    if (!lock.ok) {
      await dropSession();
      throw new Error(busyMessage(lock));
    }

    setProfile(p);
  }, [dropSession]);

  const logout = useCallback(async () => {
    await releaseAdminSession();
    await signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!session || !isAdmin) return undefined;
    let stopped = false;
    const beat = async () => {
      try {
        const lock = await claimAdminSession();
        if (!stopped && !lock.ok) {
          await dropSession(`You were logged out because ${busyMessage(lock).charAt(0).toLowerCase()}${busyMessage(lock).slice(1)}`);
        }
      } catch {
      }
    };
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => { stopped = true; clearInterval(timer); };
  }, [session, isAdmin, dropSession]);

  const value = {
    session,
    profile,
    isAdmin,
    isAuthenticated: Boolean(session),
    loading,
    notice,
    clearNotice: () => setNotice(''),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}