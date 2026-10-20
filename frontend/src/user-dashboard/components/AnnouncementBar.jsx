import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { getAnnouncement } from '../services/siteSettings.service';
import '../stylesheets/announcement.css';

const DISMISS_KEY = 'nwssu-announcement-dismissed';

export default function AnnouncementBar() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let alive = true;
    getAnnouncement()
      .then((a) => {
        if (!alive || !a.enabled || !a.text) return;
        let dismissed = null;
        try { dismissed = sessionStorage.getItem(DISMISS_KEY); } catch { /* storage blocked */ }
        if (dismissed === a.text) return;
        setNotice(a);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!notice) return null;

  const close = () => {
    try { sessionStorage.setItem(DISMISS_KEY, notice.text); } catch { /* storage blocked */ }
    setNotice(null);
  };

  return (
    <div className={`announce-bar is-${notice.tone}`} role="status">
      <Megaphone size={18} aria-hidden="true" />
      <span>{notice.text}</span>
      <button type="button" onClick={close} aria-label="Dismiss announcement"><X size={16} /></button>
    </div>
  );
}