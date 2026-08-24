import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { seedBuildings, seedDepartments, seedOffices, seedOrganizations } from '../data/adminData.js';

const AdminContext = createContext(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within <AdminProvider>');
  return ctx;
}

const LS_PREFIX = 'nwssu_admin_v1_';
const COLLECTIONS = {
  buildings: seedBuildings,
  departments: seedDepartments,
  offices: seedOffices,
  organizations: seedOrganizations,
};

function loadCollection(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted storage, fall back to seed
  }
  return COLLECTIONS[key]();
}

function loadActivity() {
  try {
    const raw = localStorage.getItem(LS_PREFIX + 'activity');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function AdminProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [activity, setActivity] = useState([]);

  // Simulate an initial fetch so the UI has a real loading state to show,
  // matching the pattern the rest of the app expects from async data.
  useEffect(() => {
    const t = setTimeout(() => {
      setBuildings(loadCollection('buildings'));
      setDepartments(loadCollection('departments'));
      setOffices(loadCollection('offices'));
      setOrganizations(loadCollection('organizations'));
      setActivity(loadActivity());
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { if (!isLoading) localStorage.setItem(LS_PREFIX + 'buildings', JSON.stringify(buildings)); }, [buildings, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LS_PREFIX + 'departments', JSON.stringify(departments)); }, [departments, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LS_PREFIX + 'offices', JSON.stringify(offices)); }, [offices, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LS_PREFIX + 'organizations', JSON.stringify(organizations)); }, [organizations, isLoading]);
  useEffect(() => { if (!isLoading) localStorage.setItem(LS_PREFIX + 'activity', JSON.stringify(activity)); }, [activity, isLoading]);

  const setters = { buildings: setBuildings, departments: setDepartments, offices: setOffices, organizations: setOrganizations };

  const logActivity = useCallback((action, entityLabel, recordLabel) => {
    setActivity((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: new Date().toISOString(), action, entity: entityLabel, label: recordLabel },
      ...prev,
    ].slice(0, 50));
  }, []);

  const addRecord = useCallback((collection, entityLabel, data) => {
    const _id = data._id || `${collection}-${Date.now()}`;
    setters[collection]((prev) => [...prev, { ...data, _id }]);
    logActivity('created', entityLabel, data.name || _id);
  }, [logActivity]);

  const updateRecord = useCallback((collection, entityLabel, _id, data) => {
    setters[collection]((prev) => prev.map((r) => (r._id === _id ? { ...r, ...data, _id } : r)));
    logActivity('updated', entityLabel, data.name || _id);
  }, [logActivity]);

  const deleteRecord = useCallback((collection, entityLabel, _id, label) => {
    setters[collection]((prev) => prev.filter((r) => r._id !== _id));
    logActivity('deleted', entityLabel, label || _id);
  }, [logActivity]);

  const resetAllData = useCallback(() => {
    Object.keys(COLLECTIONS).forEach((key) => localStorage.removeItem(LS_PREFIX + key));
    localStorage.removeItem(LS_PREFIX + 'activity');
    setBuildings(COLLECTIONS.buildings());
    setDepartments(COLLECTIONS.departments());
    setOffices(COLLECTIONS.offices());
    setOrganizations(COLLECTIONS.organizations());
    setActivity([]);
  }, []);

  const stats = useMemo(() => {
    const byType = buildings.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {});
    const totalPrograms = departments.reduce((sum, d) => sum + (d.programs?.length || 0), 0);
    const totalFaculty = departments.reduce((sum, d) => sum + (d.faculty?.length || 0), 0);
    const byCollege = organizations.reduce((acc, o) => {
      acc[o.college] = (acc[o.college] || 0) + 1;
      return acc;
    }, {});
    return {
      totalBuildings: buildings.length,
      totalDepartments: departments.length,
      totalOffices: offices.length,
      totalOrganizations: organizations.length,
      byType,
      byCollege,
      totalPrograms,
      totalFaculty,
    };
  }, [buildings, departments, offices, organizations]);

  const value = {
    isLoading,
    buildings, departments, offices, organizations,
    activity,
    stats,
    addRecord, updateRecord, deleteRecord,
    resetAllData,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
