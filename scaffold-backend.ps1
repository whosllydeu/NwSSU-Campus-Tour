# ============================================================
# scaffold-backend.ps1
# Run this from your NwSSU-Campus-Tour ROOT folder (the one that
# contains Admin-dashboard/ and user-dashboard/), in the VS Code
# terminal:
#
#   powershell -ExecutionPolicy Bypass -File scaffold-backend.ps1
#
# It creates every NEW file from the architecture doc with working
# code, then installs @supabase/supabase-js in both frontends.
# Safe to re-run — it overwrites only the files it creates.
# ============================================================

$ErrorActionPreference = "Stop"

$adminRoot = "Admin-dashboard/frontend"
$userRoot  = "user-dashboard/frontend"

if (-not (Test-Path $adminRoot) -or -not (Test-Path $userRoot)) {
  Write-Error "Run this script from the NwSSU-Campus-Tour root (parent of Admin-dashboard/ and user-dashboard/)."
  exit 1
}

function New-Dir($path) {
  New-Item -ItemType Directory -Force -Path $path | Out-Null
}

function Write-File($path, [string]$content) {
  Set-Content -Path $path -Value $content -Encoding UTF8 -NoNewline
  Write-Host "  + $path"
}

Write-Host "Creating folders..."
New-Dir "$adminRoot/src/lib"
New-Dir "$adminRoot/src/services"
New-Dir "$userRoot/src/lib"
New-Dir "$userRoot/src/services"

# ------------------------------------------------------------
# Shared: .env.local templates
# ------------------------------------------------------------
$envTemplate = @'
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
'@
Write-File "$adminRoot/.env.local" $envTemplate
Write-File "$userRoot/.env.local" $envTemplate

# ------------------------------------------------------------
# Shared: supabaseClient.js (identical in both apps)
# ------------------------------------------------------------
$supabaseClient = @'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
'@
Write-File "$adminRoot/src/lib/supabaseClient.js" $supabaseClient
Write-File "$userRoot/src/lib/supabaseClient.js" $supabaseClient

# ------------------------------------------------------------
# Shared: slugify.js (used when creating new buildings/departments/offices,
# since the admin forms don't collect an id/slug field themselves)
# ------------------------------------------------------------
$slugify = @'
export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
'@
Write-File "$adminRoot/src/lib/slugify.js" $slugify

# ------------------------------------------------------------
# Admin: services/departments.service.js
# ------------------------------------------------------------
$deptService = @'
import { supabase } from '../lib/supabaseClient.js';
import { slugify } from '../lib/slugify.js';

const TABLE = 'departments';

function fromDb(row) {
  return row ? { ...row, _id: row.id } : row;
}

export async function listDepartments() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function createDepartment(data) {
  const { _id, ...rest } = data;
  const id = rest.id || slugify(rest.name || rest.abbr || `dept-${Date.now()}`);
  const { data: row, error } = await supabase.from(TABLE).insert({ ...rest, id }).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function updateDepartment(id, data) {
  const { _id, ...rest } = data;
  const { data: row, error } = await supabase.from(TABLE).update(rest).eq('id', id).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function deleteDepartment(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
'@
Write-File "$adminRoot/src/services/departments.service.js" $deptService

# ------------------------------------------------------------
# Admin: services/buildings.service.js
# ------------------------------------------------------------
$buildingsService = @'
import { supabase } from '../lib/supabaseClient.js';
import { slugify } from '../lib/slugify.js';

const TABLE = 'buildings';

function fromDb(row) {
  if (!row) return row;
  const { description, department_id, ...rest } = row;
  return { ...rest, desc: description, dept: department_id, _id: row.id };
}

function toDb(data) {
  const { desc, dept, _id, id, ...rest } = data;
  return {
    ...rest,
    ...(desc !== undefined ? { description: desc } : {}),
    ...(dept !== undefined ? { department_id: dept || null } : {}),
  };
}

export async function listBuildings() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function createBuilding(data) {
  const id = data.id || slugify(data.name || data.abbr || `building-${Date.now()}`);
  const { data: row, error } = await supabase.from(TABLE).insert({ ...toDb(data), id }).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function updateBuilding(id, data) {
  const { data: row, error } = await supabase.from(TABLE).update(toDb(data)).eq('id', id).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function deleteBuilding(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
'@
Write-File "$adminRoot/src/services/buildings.service.js" $buildingsService

# ------------------------------------------------------------
# Admin: services/offices.service.js
# ------------------------------------------------------------
$officesService = @'
import { supabase } from '../lib/supabaseClient.js';
import { slugify } from '../lib/slugify.js';

const TABLE = 'offices';

function fromDb(row) {
  if (!row) return row;
  const { description, ...rest } = row;
  return { ...rest, desc: description, _id: row.id };
}

function toDb(data) {
  const { desc, _id, slug, ...rest } = data;
  return { ...rest, ...(desc !== undefined ? { description: desc } : {}) };
}

export async function listOffices() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function createOffice(data) {
  const slug = slugify(data.name || `office-${Date.now()}`);
  const { data: row, error } = await supabase.from(TABLE).insert({ ...toDb(data), slug }).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function updateOffice(id, data) {
  const { data: row, error } = await supabase.from(TABLE).update(toDb(data)).eq('id', id).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function deleteOffice(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
'@
Write-File "$adminRoot/src/services/offices.service.js" $officesService

# ------------------------------------------------------------
# Admin: services/organizations.service.js
# ------------------------------------------------------------
$orgsService = @'
import { supabase } from '../lib/supabaseClient.js';

const TABLE = 'organizations';

function fromDb(row) {
  if (!row) return row;
  const { college_abbr, ...rest } = row;
  return { ...rest, college: college_abbr, _id: row.id };
}

function toDb(data) {
  const { college, _id, ...rest } = data;
  return { ...rest, ...(college !== undefined ? { college_abbr: college } : {}) };
}

export async function listOrganizations() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function createOrganization(data) {
  const { data: row, error } = await supabase.from(TABLE).insert(toDb(data)).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function updateOrganization(id, data) {
  const { data: row, error } = await supabase.from(TABLE).update(toDb(data)).eq('id', id).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function deleteOrganization(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
'@
Write-File "$adminRoot/src/services/organizations.service.js" $orgsService

# ------------------------------------------------------------
# Admin: services/activity.service.js
# ------------------------------------------------------------
$activityService = @'
import { supabase } from '../lib/supabaseClient.js';

export async function listActivity(limit = 50) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    ts: row.created_at,
    action: row.action,
    entity: row.entity,
    label: row.record_label,
  }));
}
'@
Write-File "$adminRoot/src/services/activity.service.js" $activityService

# ------------------------------------------------------------
# Admin: services/auth.service.js
# ------------------------------------------------------------
$authService = @'
import { supabase } from '../lib/supabaseClient.js';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}
'@
Write-File "$adminRoot/src/services/auth.service.js" $authService

# ------------------------------------------------------------
# Admin: context/AuthContext.jsx
# ------------------------------------------------------------
$authContext = @'
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

  const loadProfile = useCallback(async (sess) => {
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
      await loadProfile(sess);
      setLoading(false);
    });
    const sub = onAuthStateChange(async (sess) => {
      setSession(sess);
      await loadProfile(sess);
    });
    return () => { mounted = false; sub.unsubscribe(); };
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    const { session: sess } = await signIn(email, password);
    setSession(sess);
    await loadProfile(sess);
  }, [loadProfile]);

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
'@
Write-File "$adminRoot/src/context/AuthContext.jsx" $authContext

# ------------------------------------------------------------
# Admin: components/ProtectedRoute.jsx (glue needed to gate /admin)
# ------------------------------------------------------------
$protectedRoute = @'
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="ad-loading">Checking session…</div>;
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return children;
}
'@
Write-File "$adminRoot/src/components/ProtectedRoute.jsx" $protectedRoute

# ------------------------------------------------------------
# Admin: pages/Login.jsx
# ------------------------------------------------------------
$loginPage = @'
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ad-login-screen">
      <form className="ad-login-card" onSubmit={handleSubmit}>
        <h1>NWSSU Campus Tour — Admin</h1>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="ad-login-error">{error}</p>}
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
'@
Write-File "$adminRoot/src/pages/Login.jsx" $loginPage

# ------------------------------------------------------------
# Admin: context/AdminContext.jsx  (MODIFIED — Supabase instead of localStorage)
# ------------------------------------------------------------
$adminContext = @'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as buildingsApi from '../services/buildings.service.js';
import * as departmentsApi from '../services/departments.service.js';
import * as officesApi from '../services/offices.service.js';
import * as organizationsApi from '../services/organizations.service.js';
import { listActivity } from '../services/activity.service.js';

const AdminContext = createContext(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within <AdminProvider>');
  return ctx;
}

const API = {
  buildings: buildingsApi,
  departments: departmentsApi,
  offices: officesApi,
  organizations: organizationsApi,
};

// Maps a collection name to its service's function-name suffix,
// e.g. 'buildings' -> createBuilding/updateBuilding/deleteBuilding.
const SINGULAR = {
  buildings: 'Building',
  departments: 'Department',
  offices: 'Office',
  organizations: 'Organization',
};

export function AdminProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [activity, setActivity] = useState([]);

  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    const [b, d, o, org, act] = await Promise.all([
      buildingsApi.listBuildings(),
      departmentsApi.listDepartments(),
      officesApi.listOffices(),
      organizationsApi.listOrganizations(),
      listActivity(),
    ]);
    setBuildings(b);
    setDepartments(d);
    setOffices(o);
    setOrganizations(org);
    setActivity(act);
    setIsLoading(false);
  }, []);

  useEffect(() => { refetchAll(); }, [refetchAll]);

  const setters = { buildings: setBuildings, departments: setDepartments, offices: setOffices, organizations: setOrganizations };

  const addRecord = useCallback(async (collection, _entityLabel, data) => {
    const created = await API[collection][`create${SINGULAR[collection]}`](data);
    setters[collection]((prev) => [...prev, created]);
    listActivity().then(setActivity);
  }, []);

  const updateRecord = useCallback(async (collection, _entityLabel, _id, data) => {
    const updated = await API[collection][`update${SINGULAR[collection]}`](_id, data);
    setters[collection]((prev) => prev.map((r) => (r._id === _id ? updated : r)));
    listActivity().then(setActivity);
  }, []);

  const deleteRecord = useCallback(async (collection, _entityLabel, _id) => {
    await API[collection][`delete${SINGULAR[collection]}`](_id);
    setters[collection]((prev) => prev.filter((r) => r._id !== _id));
    listActivity().then(setActivity);
  }, []);

  // Real data now lives in Supabase, so "reset" re-syncs from the database
  // instead of wiping it (see backend-architecture.md, section 7).
  const resetAllData = useCallback(async () => { await refetchAll(); }, [refetchAll]);

  const stats = useMemo(() => {
    const byType = buildings.reduce((acc, b) => { acc[b.type] = (acc[b.type] || 0) + 1; return acc; }, {});
    const totalPrograms = departments.reduce((sum, d) => sum + (d.programs?.length || 0), 0);
    const totalFaculty = departments.reduce((sum, d) => sum + (d.faculty?.length || 0), 0);
    const byCollege = organizations.reduce((acc, o) => { acc[o.college] = (acc[o.college] || 0) + 1; return acc; }, {});
    return {
      totalBuildings: buildings.length,
      totalDepartments: departments.length,
      totalOffices: offices.length,
      totalOrganizations: organizations.length,
      byType, byCollege, totalPrograms, totalFaculty,
    };
  }, [buildings, departments, offices, organizations]);

  const value = {
    isLoading,
    buildings, departments, offices, organizations,
    activity, stats,
    addRecord, updateRecord, deleteRecord,
    resetAllData,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
'@
Write-File "$adminRoot/src/context/AdminContext.jsx" $adminContext

# ------------------------------------------------------------
# User: services/buildings.service.js  (read-only)
# ------------------------------------------------------------
$userBuildings = @'
import { supabase } from '../lib/supabaseClient.js';

function fromDb(row) {
  if (!row) return row;
  const { description, department_id, ...rest } = row;
  return { ...rest, desc: description, dept: department_id };
}

export async function listBuildings() {
  const { data, error } = await supabase.from('buildings').select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function getBuilding(id) {
  const { data, error } = await supabase.from('buildings').select('*').eq('id', id).single();
  if (error) throw error;
  return fromDb(data);
}
'@
Write-File "$userRoot/src/services/buildings.service.js" $userBuildings

# ------------------------------------------------------------
# User: services/departments.service.js  (read-only)
# ------------------------------------------------------------
$userDepartments = @'
import { supabase } from '../lib/supabaseClient.js';

export async function listDepartments() {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function getDepartment(id) {
  const { data, error } = await supabase.from('departments').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
'@
Write-File "$userRoot/src/services/departments.service.js" $userDepartments

# ------------------------------------------------------------
# User: services/offices.service.js  (read-only)
# ------------------------------------------------------------
$userOffices = @'
import { supabase } from '../lib/supabaseClient.js';

function fromDb(row) {
  if (!row) return row;
  const { description, ...rest } = row;
  return { ...rest, desc: description };
}

export async function listOffices() {
  const { data, error } = await supabase.from('offices').select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}
'@
Write-File "$userRoot/src/services/offices.service.js" $userOffices

# ------------------------------------------------------------
# User: services/organizations.service.js  (read-only)
# ------------------------------------------------------------
$userOrgs = @'
import { supabase } from '../lib/supabaseClient.js';

function fromDb(row) {
  if (!row) return row;
  const { college_abbr, ...rest } = row;
  return { ...rest, college: college_abbr };
}

export async function listOrganizations() {
  const { data, error } = await supabase.from('organizations').select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}
'@
Write-File "$userRoot/src/services/organizations.service.js" $userOrgs

# ------------------------------------------------------------
# User: services/arWaypoints.service.js  (replaces static arDestinations.js)
# ------------------------------------------------------------
$arWaypoints = @'
import { supabase } from '../lib/supabaseClient.js';

let cache = null;

export async function listWaypoints() {
  if (cache) return cache;
  const { data, error } = await supabase.from('ar_waypoints').select('*');
  if (error) throw error;
  cache = data;
  return data;
}

// Mirrors the old arDestinations.js resolveCoord() shape: { lat, lng, name } | null
export async function resolveCoord(key) {
  const rows = await listWaypoints();
  const row = rows.find((r) => r.destination_key === key);
  if (!row || row.lat == null || row.lng == null) return null;
  return { lat: row.lat, lng: row.lng, name: row.display_name };
}

export function hasARSync(key, rows) {
  const row = rows.find((r) => r.destination_key === key);
  return Boolean(row && row.lat != null && row.lng != null);
}
'@
Write-File "$userRoot/src/services/arWaypoints.service.js" $arWaypoints

# ------------------------------------------------------------
# Install the Supabase client library in both frontends
# ------------------------------------------------------------
Write-Host "`nInstalling @supabase/supabase-js in Admin-dashboard/frontend..."
Push-Location $adminRoot
npm install @supabase/supabase-js
Pop-Location

Write-Host "`nInstalling @supabase/supabase-js in user-dashboard/frontend..."
Push-Location $userRoot
npm install @supabase/supabase-js
Pop-Location

Write-Host "`nDone. Next steps:"
Write-Host "  1. Fill in the real values in both .env.local files."
Write-Host "  2. Add '.env.local' to each frontend's .gitignore if it isn't already."
Write-Host "  3. Wrap App.jsx routes with <AuthProvider> and add the /admin/login route + <ProtectedRoute>."
