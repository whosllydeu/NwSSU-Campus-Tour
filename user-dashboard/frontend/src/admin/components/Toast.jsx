import { useUI } from '../context/ToastContext.jsx';

export default function Toast() {
  const { toast } = useUI();
  return (
    <div className={`toast${toast ? ' show' : ''}`} id="toast">
      {toast}
    </div>
  );
}
