import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { listBuildings } from '../services/buildings.service.js';
import { listDepartments } from '../services/departments.service.js';
import { listOffices } from '../services/offices.service.js';
import { listOrganizations } from '../services/organizations.service.js';

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

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [b, d, o, org] = await Promise.all([
        listBuildings(),
        listDepartments(),
        listOffices(),
        listOrganizations(),
      ]);
      setBuildings(b);
      setDepartments(d);
      setOffices(o);
      setOrganizations(org);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const value = {
    isLoading, error,
    buildings, departments, offices, organizations,
    refetch,
  };

  return <CampusDataContext.Provider value={value}>{children}</CampusDataContext.Provider>;
}
