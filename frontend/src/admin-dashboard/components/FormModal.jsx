import { useState, useCallback } from "react";
import LocationPicker from "./LocationPicker.jsx";
import { fromEditableValue, isValidCoordinate, toEditableValue } from "../utils/admin-map-leaflet.js";

const FormModal = ({ open, title, fields, initialValues, onSubmit, onClose }) => {
  const [values, setValues] = useState(() => {
    const next = {};
    fields.forEach((field) => {
      if (field.type === 'map') return;
      next[field.key] = toEditableValue(field, initialValues?.[field.key]);
    });
    next.lat = initialValues?.lat ?? '';
    next.lng = initialValues?.lng ?? '';
    return next;
  });

  const [errors, setErrors] = useState({});

  const handleChange = useCallback((key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, []);

  const handleLocationChange = useCallback(({ lat, lng }) => {
    setValues((current) => ({ ...current, lat, lng }));
    setErrors((current) => ({ ...current, coordinates: undefined }));
  }, []);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};

    fields.forEach((field) => {
      if (field.type === 'map') return;
      if (field.required && !String(values[field.key] ?? '').trim()) {
        nextErrors[field.key] = 'Required';
      }
    });

    const mapField = fields.find((field) => field.type === 'map');
    if (mapField && (!isValidCoordinate(values.lat) || !isValidCoordinate(values.lng))) {
      nextErrors[mapField.key] = 'Please select a location on the map';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const out = {};
    fields.forEach((field) => {
      if (field.type === 'map') return;
      out[field.key] = fromEditableValue(field, values[field.key]);
    });

    out.lat = Number(values.lat);
    out.lng = Number(values.lng);
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
          {fields.map((field) => {
            if (field.type === 'map') {
              return (
                <div key={field.key} className={`ad-field wide${errors[field.key] ? ' has-error' : ''}`}>
                  <label>{field.label}{field.required && <span className="ad-req">*</span>}</label>
                  <LocationPicker latitude={values.lat} longitude={values.lng} onChange={handleLocationChange} />
                  {errors[field.key] && <span className="ad-error">{errors[field.key]}</span>}
                </div>
              );
            }

            return (
              <div key={field.key} className={`ad-field${field.wide ? ' wide' : ''}`}>
                <label>{field.label}{field.required && <span className="ad-req">*</span>}</label>

                {field.type === 'textarea' || field.type === 'list' ? (
                  <textarea
                    rows={field.type === 'list' ? 4 : 3}
                    value={values[field.key] ?? ''}
                    placeholder={field.type === 'list' ? 'One item per line' : ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <select value={values[field.key] ?? ''} onChange={(e) => handleChange(field.key, e.target.value)}>
                    <option value="" disabled>Select…</option>
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'color' ? 'color' : 'text'}
                    value={values[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    step={field.type === 'number' ? 'any' : undefined}
                  />
                )}

                {errors[field.key] && <span className="ad-error">{errors[field.key]}</span>}
              </div>
            );
          })}
        </div>

        <div className="ad-form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

export default FormModal;