// Small notice at the top of the screen while the phone has no internet.
import { WifiOff } from "lucide-react";
import { useCampusData } from "../context/DataContext";

const formatSaved = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function OfflineBanner() {
  const { isOnline, fromCache, savedAt } = useCampusData();
  if (isOnline && !fromCache) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: "calc(100% - 32px)",
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(14, 32, 20, 0.92)",
        border: "1px solid rgba(212, 178, 90, 0.45)",
        color: "#eef4ef",
        fontSize: 12.5,
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
      }}
    >
      <WifiOff size={15} color="#d4b25a" aria-hidden="true" />
      <span>
        Offline — showing saved data{savedAt ? ` from ${formatSaved(savedAt)}` : ""}
      </span>
    </div>
  );
}