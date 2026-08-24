export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div className="ad-overlay" onClick={onCancel}>
      <div className="ad-confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="ad-confirm-icon">{danger ? '⚠️' : '❓'}</div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="ad-confirm-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'ad-btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
