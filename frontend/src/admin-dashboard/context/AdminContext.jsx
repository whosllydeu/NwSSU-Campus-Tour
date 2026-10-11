import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as buildingsApi from '../services/buildings.service.js';
import * as departmentsApi from '../services/departments.service.js';
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
};

// Maps a collection name to its service's function-name suffix,
// e.g. 'buildings' -> createBuilding/updateBuilding/deleteBuilding.
const SINGULAR = {
  buildings: 'Building',
  departments: 'Department',
};

const ACADEMIC = 'academic';

function sameText(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

// Picks a department id that doesn't collide with an existing one.
function uniqueDepartmentId(base, takenIds) {
  if (!takenIds.has(base)) return base;
  let candidate = `${base}-dept`;
  let n = 2;
  while (takenIds.has(candidate)) {
    candidate = `${base}-dept-${n}`;
    n += 1;
  }
  return candidate;
}

// Loads everything the dashboard needs in one round-trip. Pure (no state),
// so it can be used both on mount and by the "Re-sync" button.
async function fetchAllData() {
  const [buildings, departments, activity] = await Promise.all([
    buildingsApi.listBuildings(),
    departmentsApi.listDepartments(),
    listActivity(),
  ]);
  return { buildings, departments, activity };
}

export function AdminProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activity, setActivity] = useState([]);

  // Manual re-sync (Settings page). Called from an event handler, not an effect.
  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllData();
      setBuildings(data.buildings);
      setDepartments(data.departments);
      setActivity(data.activity);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load. State is only set inside the promise callbacks (after the
  // data arrives), which is what the react-hooks/set-state-in-effect rule
  // expects. `isLoading` already starts as true, so no synchronous set here.
  useEffect(() => {
    let cancelled = false;
    fetchAllData()
      .then((data) => {
        if (cancelled) return;
        setBuildings(data.buildings);
        setDepartments(data.departments);
        setActivity(data.activity);
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load admin data:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const setters = useMemo(() => ({ buildings: setBuildings, departments: setDepartments }), []);

  const addRecord = useCallback(async (collection, _entityLabel, data) => {
    const created = await API[collection][`create${SINGULAR[collection]}`](data);
    setters[collection]((prev) => [...prev, created]);
    listActivity().then(setActivity).catch(() => {});
    return created;
  }, [setters]);

  const updateRecord = useCallback(async (collection, _entityLabel, _id, data) => {
    const updated = await API[collection][`update${SINGULAR[collection]}`](_id, data);
    setters[collection]((prev) => prev.map((r) => (r._id === _id ? updated : r)));
    listActivity().then(setActivity).catch(() => {});
    return updated;
  }, [setters]);

  const deleteRecord = useCallback(async (collection, _entityLabel, _id) => {
    await API[collection][`delete${SINGULAR[collection]}`](_id);
    setters[collection]((prev) => prev.filter((r) => r._id !== _id));
    listActivity().then(setActivity).catch(() => {});
  }, [setters]);

  /**
   * Saves a building and keeps Department Management in sync:
   *  - type "academic"  -> links the building to a department, re-using an
   *    existing one (already linked, same id, or same abbreviation and not
   *    linked to another building) and only creating a new department when
   *    none exists. Saving again never creates a duplicate.
   *  - any other type   -> clears the building's department link only. The
   *    department record itself is never deleted, so faculty, officers and
   *    other department data stay intact.
   *
   * @returns {{ building, department, departmentCreated, departmentUnlinked }}
   */
  const saveBuilding = useCallback(async (existingId, data) => {
    let saved = existingId
      ? await buildingsApi.updateBuilding(existingId, data)
      : await buildingsApi.createBuilding(data);

    let department = null;
    let departmentCreated = false;
    let departmentUnlinked = false;

    if (saved.type === ACADEMIC) {
      // Fresh copies so the duplicate check never runs on stale state.
      const [freshDepartments, freshBuildings] = await Promise.all([
        departmentsApi.listDepartments(),
        buildingsApi.listBuildings(),
      ]);

      const linkedElsewhere = (deptId) =>
        freshBuildings.some((b) => b._id !== saved._id && b.dept === deptId);

      department =
        (saved.dept && freshDepartments.find((d) => d.id === saved.dept)) ||
        freshDepartments.find((d) => d.id === saved.id) ||
        (saved.abbr
          ? freshDepartments.find((d) => sameText(d.abbr, saved.abbr) && !linkedElsewhere(d.id))
          : null) ||
        null;

      if (!department) {
        const takenIds = new Set(freshDepartments.map((d) => d.id));
        department = await departmentsApi.createDepartment({
          id: uniqueDepartmentId(saved.id, takenIds),
          name: saved.name,
          abbr: saved.abbr,
          color: saved.color || '#2a6624',
          photo: '',
          programs: Array.isArray(saved.programs) ? saved.programs : [],
          faculty: [],
          officers: [],
          organizations: [],
          offices: Array.isArray(saved.offices) ? saved.offices : [],
        });
        departmentCreated = true;
      }

      if (saved.dept !== department.id) {
        saved = await buildingsApi.updateBuilding(saved._id, { dept: department.id });
      }
    } else if (saved.dept) {
      saved = await buildingsApi.updateBuilding(saved._id, { dept: null });
      departmentUnlinked = true;
    }

    const finalBuilding = saved;
    setBuildings((prev) => (
      prev.some((b) => b._id === finalBuilding._id)
        ? prev.map((b) => (b._id === finalBuilding._id ? finalBuilding : b))
        : [...prev, finalBuilding]
    ));

    if (departmentCreated) {
      const createdDept = department;
      setDepartments((prev) => [...prev, createdDept].sort((a, b) => String(a.name).localeCompare(String(b.name))));
    }

    listActivity().then(setActivity).catch(() => {});

    return { building: finalBuilding, department, departmentCreated, departmentUnlinked };
  }, []);

  // Real data now lives in Supabase, so "reset" re-syncs from the database
  // instead of wiping it (see backend-architecture.md, section 7).
  const resetAllData = useCallback(async () => { await refetchAll(); }, [refetchAll]);

  const stats = useMemo(() => {
    const byType = buildings.reduce((acc, b) => { acc[b.type] = (acc[b.type] || 0) + 1; return acc; }, {});
    const totalPrograms = departments.reduce((sum, d) => sum + (d.programs?.length || 0), 0);
    const totalFaculty = departments.reduce((sum, d) => sum + (d.faculty?.length || 0), 0);
    const totalGalleryImages = buildings.reduce((sum, b) => sum + (Array.isArray(b.images) ? b.images.length : 0), 0);
    const buildingsWithPhoto = buildings.filter((b) => Boolean(b.photo)).length;
    return {
      totalBuildings: buildings.length,
      totalDepartments: departments.length,
      totalGalleryImages,
      buildingsWithPhoto,
      byType, totalPrograms, totalFaculty,
    };
  }, [buildings, departments]);

  const value = {
    isLoading,
    buildings, departments,
    activity, stats,
    addRecord, updateRecord, deleteRecord,
    saveBuilding,
    resetAllData,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}