import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { listBuildings } from "../services/buildings.service";
import { listDepartments } from "../services/departments.service";
import { listOffices } from "../services/offices.service";
import { listOrganizations } from "../services/organizations.service";

const DataContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useCampusData = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error(
      "useCampusData must be used within <DataProvider>"
    );
  }

  return context;
};

export const DataProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    const initialData = async () => {
        setIsLoading(true);
        try {
        const [
          buildings,
          departments,
          offices,
          organizations,
        ] = await Promise.all([
            listBuildings(),
            listDepartments(),
            listOffices(),
            listOrganizations(),
        ]);
        setBuildings(buildings);
        setDepartments(departments);
        setOffices(offices);
        setOrganizations(organizations);

        setError(null);
        } catch (err) {
        setError(err);
        } finally {
        setIsLoading(false);
        }
    };

    initialData();
  }, []);

  const value = {
    isLoading,
    error,
    buildings, departments, offices, organizations
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};