import { useUI } from '../context/UIContext.jsx';

export default function Lightbox() {
  const { lightbox, closeLightbox } = useUI();
  const open = Boolean(lightbox);

  return (
    <div className={`lightbox${open ? ' open' : ''}`} id="lightbox">
      <div className="lb-backdrop" onClick={closeLightbox} />
      <div className="lb-box">
        <button className="lb-close" onClick={closeLightbox}>✕</button>
        <div className="lb-img-wrap">
          {lightbox && <img id="lbImg" src={lightbox.src} alt={lightbox.caption || ''} />}
        </div>
        <div className="lb-caption" id="lbCaption">{lightbox?.caption || ''}</div>
      </div>
    </div>
  );
}
