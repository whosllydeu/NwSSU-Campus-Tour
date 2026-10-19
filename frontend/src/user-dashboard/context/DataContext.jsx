import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { listBuildings } from "../services/buildings.service";
import { listDepartments } from "../services/departments.service";
import { applyAdminBuildingTours } from "../utils/adminTours";
import { listTourOverrides } from "../services/tourOverrides.service";
import { applyTourOverrides } from "../utils/tourOverrides";

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

const connectTours = (buildings, overrides) => {
  try {
    applyAdminBuildingTours(buildings);
  } catch (tourErr) {
    console.error("[admin-tour] could not connect admin buildings:", tourErr);
  }
  try {
    applyTourOverrides(overrides);
  } catch (overrideErr) {
    console.error("[tour] could not apply arrow edits:", overrideErr);
  }
};

export const DataProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    let active = true;

    const overridesRequest = listTourOverrides().catch((err) => {
      console.warn("[tour] arrow edits not loaded:", err?.message || err);
      return [];
    });

    Promise.all([listBuildings(), listDepartments(), overridesRequest])
      .then(([buildingRows, departmentRows, overrideRows]) => {
        if (!active) return;
        connectTours(buildingRows, overrideRows);
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