import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { listBuildings } from '../services/buildings.service.js';
import { listDepartments } from '../services/departments.service.js';
import { listOffices } from '../services/offices.service.js';
import { listOrganizations } from '../services/organizations.service.js';
import { listWaypoints } from '../services/arWaypoints.service.js';
import { loadSaved } from '../data/arDestinations.js';

const CampusDataContext = createContext(null);

export function useCampusData() {
  const ctx = useContext(CampusDataContext);
  if (!ctx) throw new Error('useCampusData must be used within <CampusDataProvider>');
  return ctx;
}

export function CampusDataProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [waypoints, setWaypoints] = useState([]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [b, d, o, org, w] = await Promise.all([
        listBuildings(),
        listDepartments(),
        listOffices(),
        listOrganizations(),
        listWaypoints(),
      ]);
      setBuildings(b);
      setDepartments(d);
      setOffices(o);
      setOrganizations(org);
      setWaypoints(w);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  // Mirrors the old arDestinations.js getAR/hasAR/resolveCoord behavior —
  // a device-saved override (localStorage) still wins if present, otherwise
  // fall back to the shared waypoint, now loaded from Supabase instead of
  // the static AR_DESTINATIONS object.
  const resolveCoord = useCallback((key) => {
    const row = waypoints.find((w) => w.destination_key === key);
    const name = row?.display_name || 'Destination';
    const saved = loadSaved()[key];
    if (saved && saved.lat != null && saved.lng != null) {
      return { lat: saved.lat, lng: saved.lng, name };
    }
    if (row && row.lat != null && row.lng != null) {
      return { lat: row.lat, lng: row.lng, name: row.display_name };
    }
    return null;
  }, [waypoints]);

  const hasAR = useCallback((key) => Boolean(resolveCoord(key)), [resolveCoord]);

  const value = {
    isLoading, error,
    buildings, departments, offices, organizations, waypoints,
    resolveCoord, hasAR,
    refetch,
  };

  return <CampusDataContext.Provider value={value}>{children}</CampusDataContext.Provider>;
}