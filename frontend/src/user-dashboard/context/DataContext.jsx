import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { listBuildings } from "../services/buildings.service";
import { listDepartments } from "../services/departments.service";
import { applyAdminBuildingTours } from "../utils/adminTours";

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

const connectTours = (buildings) => {
  // Buildings connected to a pathway from the Admin Dashboard join the
  // 360° tour + "Walk there!" before anything renders with them.
  try {
    applyAdminBuildingTours(buildings);
  } catch (tourErr) {
    console.error("[admin-tour] could not connect admin buildings:", tourErr);
  }
};

export const DataProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Load buildings and departments from Supabase once.
  useEffect(() => {
    let active = true;

    Promise.all([listBuildings(), listDepartments()])
      .then(([buildingRows, departmentRows]) => {
        if (!active) return;
        connectTours(buildingRows);
        setBuildings(buildingRows);
        setDepartments(departmentRows);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load campus data:", err);
        setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = {
    isLoading,
    error,
    buildings,
    departments,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};