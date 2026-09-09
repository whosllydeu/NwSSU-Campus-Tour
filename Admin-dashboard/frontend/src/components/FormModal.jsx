import { useState, useEffect } from 'react';

function toEditableValue(field, raw) {
  if (field.type === 'list') return Array.isArray(raw) ? raw.join('\n') : '';
  return raw ?? '';
}

function fromEditableValue(field, raw) {
  if (field.type === 'list') return String(raw).split('\n').map((s) => s.trim()).filter(Boolean);
  if (field.type === 'number') return raw === '' ? '' : Number(raw);
  return raw;
}

export default function FormModal({ open, title, fields, initialValues, onSubmit, onClose }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    const next = {};
    fields.forEach((f) => { next[f.key] = toEditableValue(f, initialValues?.[f.key]); });
    setValues(next);
    setErrors({});
  }, [open, initialValues, fields]);

  if (!open) return null;

  function handleChange(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    fields.forEach((f) => {
      if (f.required && !String(values[f.key] ?? '').trim()) nextErrors[f.key] = 'Required';
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const out = {};
    fields.forEach((f) => { out[f.key] = fromEditableValue(f, values[f.key]); });
    onSubmit(out);
  }

  return (
    <div className="ad-overlay" onClick={onClose}>
      <form className="ad-form-box" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="ad-form-header">
          <h3>{title}</h3>
          <button type="button" className="ad-icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="ad-form-grid">
          {fields.map((f) => (
            <div key={f.key} className={`ad-field${f.wide ? ' wide' : ''}`}>
              <label>{f.label}{f.required && <span className="ad-req">*</span>}</label>
              {f.type === 'textarea' || f.type === 'list' ? (
                <textarea
                  rows={f.type === 'list' ? 4 : 3}
                  value={values[f.key] ?? ''}
                  placeholder={f.type === 'list' ? 'One item per line' : ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                />
              ) : f.type === 'select' ? (
                <select value={values[f.key] ?? ''} onChange={(e) => handleChange(f.key, e.target.value)}>
                  <option value="" disabled>Select…</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'color' ? 'color' : 'text'}
                  value={values[f.key] ?? ''}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  step={f.type === 'number' ? 'any' : undefined}
                />
              )}
              {errors[f.key] && <span className="ad-error">{errors[f.key]}</span>}
            </div>
          ))}
        </div>
        <div className="ad-form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}
