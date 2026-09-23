import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as buildingsApi from '../services/buildings.service.js';
import * as departmentsApi from '../services/departments.service.js';
import * as officesApi from '../services/offices.service.js';
import * as organizationsApi from '../services/organizations.service.js';
import { listActivity } from '../services/activity.service.js';

const AdminContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
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