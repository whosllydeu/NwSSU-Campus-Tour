import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { listBuildings } from "../services/buildings.service";
import { listDepartments } from "../services/departments.service";
import { applyAdminBuildingTours } from "../utils/adminTours";

const DataContext = createContext(null);

// Last data loaded from Supabase, kept on the phone so the app still
// shows buildings/departments when there is no internet.
const CACHE_KEY = "nwssu-campus-data-v1";

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (buildings, departments) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ buildings, departments, savedAt: Date.now() })
    );
  } catch {
    /* storage full or blocked — app still works online */
  }
};

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

// Loads fresh data from Supabase, or the saved copy when offline.
// Returns plain data (no React state), so it can be called from effects.
const fetchCampusData = async () => {
  try {
    const [buildings, departments] = await Promise.all([
      listBuildings(),
      listDepartments(),
    ]);
    writeCache(buildings, departments);
    return { buildings, departments, fromCache: false, savedAt: Date.now(), error: null };
  } catch (err) {
    // Offline (or Supabase unreachable) → use the last saved copy.
    const cached = readCache();
    if (cached?.buildings) {
      return {
        buildings: cached.buildings,
        departments: cached.departments || [],
        fromCache: true,
        savedAt: cached.savedAt || null,
        error: null,
      };
    }
    return { buildings: null, departments: null, fromCache: false, savedAt: null, error: err };
  }
};

export const DataProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  // true when what's on screen is the saved copy (offline)
  const [fromCache, setFromCache] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const applyResult = useCallback((result) => {
    if (result.buildings) {
      connectTours(result.buildings);
      setBuildings(result.buildings);
      setDepartments(result.departments);
    }
    setFromCache(result.fromCache);
    setSavedAt(result.savedAt);
    setError(result.error);
    setIsLoading(false);
  }, []);

  const reload = useCallback(
    () => fetchCampusData().then(applyResult),
    [applyResult]
  );

  // First load.
  useEffect(() => {
    let active = true;
    fetchCampusData().then((result) => {
      if (active) applyResult(result);
    });
    return () => {
      active = false;
    };
  }, [applyResult]);

  // Refresh automatically when the connection comes back.
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      reload();
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [reload]);

  const value = {
    isLoading,
    error,
    buildings,
    departments,
    isOnline,
    fromCache,
    savedAt,
    reload,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};