export default function StatCard({ icon, label, value, accent = 'green' }) {
  return (
    <div className={`ad-stat-card accent-${accent}`}>
      <div className="ad-stat-icon">{icon}</div>
      <div className="ad-stat-body">
        <div className="ad-stat-value">{value}</div>
        <div className="ad-stat-label">{label}</div>
      </div>
    </div>
  );
}
