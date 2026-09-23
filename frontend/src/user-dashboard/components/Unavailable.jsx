import { useUI } from '../context/UIContext.jsx';

// ============================================================
// Unavailable — full-screen "not ready yet" placeholder screen.
// Shown (instead of a toast) whenever the person taps something —
// Navigate Here, Start Virtual Tour — that has no tour data set up
// for that place yet.
// ============================================================
export default function Unavailable() {
  const { unavailable, closeUnavailable } = useUI();
  if (!unavailable) return null;

  return (
    <div className="unavail-root">
      <style>{CSS}</style>
      <button className="unavail-close" onClick={closeUnavailable} aria-label="Close">✕</button>
      <div className="unavail-icon">🚧</div>
      <h1 className="unavail-title">Currently Unavailable</h1>
      <p className="unavail-sub">{unavailable.message}</p>
      <button className="unavail-back" onClick={closeUnavailable}>← Go Back</button>
    </div>
  );
}

const CSS = `
.unavail-root{
  position:fixed;inset:0;z-index:2100;
  background:radial-gradient(120% 90% at 50% 0%,#0c2a1c,#050810 70%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:14px;padding:32px;text-align:center;
  font-family:'Sora',system-ui,sans-serif;color:#fff;
}
.unavail-icon{font-size:52px;}
.unavail-title{font-size:26px;font-weight:800;margin:0;}
.unavail-sub{font-size:14px;color:#9fb0c8;max-width:340px;line-height:1.6;margin:0;}
.unavail-back{
  margin-top:10px;border:1px solid rgba(255,255,255,.25);background:transparent;
  color:#fff;font-weight:700;font-size:14px;padding:12px 26px;border-radius:40px;cursor:pointer;
}
.unavail-back:hover{background:rgba(255,255,255,.08);}
.unavail-back:active{transform:scale(.96);}
.unavail-close{
  position:absolute;top:calc(16px + env(safe-area-inset-top));right:16px;
  width:36px;height:36px;border-radius:50%;border:none;
  background:rgba(255,255,255,.12);color:#fff;font-size:16px;cursor:pointer;
}
.unavail-close:hover{background:rgba(255,255,255,.22);}
`;
