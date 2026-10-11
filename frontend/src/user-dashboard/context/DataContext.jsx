import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { listBuildings } from "../services/buildings.service";
import { listDepartments } from "../services/departments.service";

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

  useEffect(() => {
    const initialData = async () => {
        setIsLoading(true);
        try {
        const [
          buildings,
          departments,
        ] = await Promise.all([
            listBuildings(),
            listDepartments(),
        ]);
        setBuildings(buildings);
        setDepartments(departments);

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
    buildings, departments
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};