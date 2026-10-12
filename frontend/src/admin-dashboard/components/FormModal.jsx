import { useState, useCallback, useEffect, useRef } from "react";
import LocationPicker from "./LocationPicker.jsx";
import { ImageUploadField, GalleryField } from "./ImageFields.jsx";
import PathwayLinkField, { initialPathwayLinkValue } from "./PathwayLinkField.jsx";
import { fromEditableValue, isValidCoordinate, toEditableValue } from "../utils/admin-map-leaflet.js";
import { getPreparedInfo } from "../utils/image-compress.js";

// Native dropdown lists ignore the dark admin theme, so give every
// <option> an explicit readable colour (dark text on white).
const OPTION_STYLE = { color: '#111827', backgroundColor: '#ffffff' };

let uidCounter = 0;
const nextUid = () => {
  uidCounter += 1;
  return `g-${Date.now()}-${uidCounter}`;
};

function initialImageValue(raw) {
  return { url: typeof raw === 'string' ? raw : '', file: null, preview: '' };
}

function initialGalleryValue(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((img) => img && img.url)
    .map((img) => ({
      uid: nextUid(),
      id: img.id || '',
      url: img.url,
      path: img.path || '',
      file: null,
      preview: '',
      lat: img.lat ?? '',
      lng: img.lng ?? '',
      caption: img.caption || '',
      // undefined for images saved before the 360° flag existed
      panorama: typeof img.panorama === 'boolean' ? img.panorama : undefined,
      heading: Number.isFinite(Number(img.heading)) && img.heading !== null ? img.heading : '',
      links: Array.isArray(img.links) ? img.links.map((l) => ({ to: l.to || '', yaw: l.yaw ?? '' })) : [],
    }));
}

function inRange(value, min, max) {
  const n = Number(value);
  return isValidCoordinate(value) && n >= min && n <= max;
}

/**
 * Generic add/edit form used by every admin page.
 *
 * Field types: text | number | color | select | textarea | list | map
 *              image   — single file upload (uploads on save)
 *              gallery — multiple images, each with its own lat/lng
 *              pathwayLink — connects the gallery's 360° images to a pathway
 *                            photo (uses field.galleryKey, default 'images')
 *
 * `onUploadImage(file, values)` is required when the form has image or
 * gallery fields; it must resolve to `{ url, path }`.
 * `onDiscardUploads(paths)` (optional) is called with freshly-uploaded
 * storage paths if saving fails, so orphaned files can be cleaned up.
 */
const FormModal = ({ open, title, fields, initialValues, onSubmit, onClose, onUploadImage, onDiscardUploads }) => {
  const [values, setValues] = useState(() => {
    const next = {};
    fields.forEach((field) => {
      if (field.type === 'map') return;
      if (field.type === 'image') {
        next[field.key] = initialImageValue(initialValues?.[field.key]);
        return;
      }
      if (field.type === 'gallery') {
        next[field.key] = initialGalleryValue(initialValues?.[field.key]);
        return;
      }
      if (field.type === 'pathwayLink') {
        next[field.key] = initialPathwayLinkValue(initialValues?.[field.key]);
        return;
      }
      next[field.key] = toEditableValue(field, initialValues?.[field.key]);
    });
    next.lat = initialValues?.lat ?? '';
    next.lng = initialValues?.lng ?? '';
    return next;
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Every blob: preview URL we create, so they can be released.
  const blobUrls = useRef(new Set());

  useEffect(() => {
    const urls = blobUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const makePreview = useCallback((file) => {
    const url = URL.createObjectURL(file);
    blobUrls.current.add(url);
    return url;
  }, []);

  const releasePreview = useCallback((url) => {
    if (url && blobUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrls.current.delete(url);
    }
  }, []);

  const handleChange = useCallback((key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, []);

  const handleLocationChange = useCallback(({ lat, lng }) => {
    setValues((current) => ({ ...current, lat, lng }));
    setErrors((current) => ({ ...current, coordinates: undefined }));
  }, []);

  // ── Single image handlers ──
  const handleImageSelect = useCallback((key, file) => {
    setValues((current) => {
      releasePreview(current[key]?.preview);
      return { ...current, [key]: { ...current[key], file, preview: makePreview(file) } };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, [makePreview, releasePreview]);

  const handleImageClear = useCallback((key) => {
    setValues((current) => {
      releasePreview(current[key]?.preview);
      return { ...current, [key]: { url: '', file: null, preview: '' } };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }, [releasePreview]);

  // ── Gallery handlers ──
  const updateGallery = useCallback((key, updater) => {
    setValues((current) => ({ ...current, [key]: updater(current[key] || []) }));
  }, []);

  const clearGalleryError = useCallback((key, uid) => {
    setErrors((current) => {
      const gallery = current[key];
      if (!gallery || typeof gallery !== 'object') return current;
      const rest = { ...(gallery.items || {}) };
      delete rest[uid];
      return { ...current, [key]: { ...gallery, items: rest } };
    });
  }, []);

  const handleGalleryAdd = useCallback((key, files) => {
    const additions = files.map((file) => ({
      uid: nextUid(),
      id: '',
      url: '',
      path: '',
      file,
      preview: makePreview(file),
      lat: '',
      lng: '',
      caption: '',
      panorama: Boolean(getPreparedInfo(file)?.panorama),
      heading: '',
      links: [],
    }));
    updateGallery(key, (items) => [...items, ...additions]);
  }, [makePreview, updateGallery]);

  const handleGalleryReplace = useCallback((key, uid, file) => {
    updateGallery(key, (items) => items.map((item) => {
      if (item.uid !== uid) return item;
      releasePreview(item.preview);
      return { ...item, file, preview: makePreview(file), panorama: Boolean(getPreparedInfo(file)?.panorama) };
    }));
  }, [makePreview, releasePreview, updateGallery]);

  const handleGalleryChange = useCallback((key, uid, patch) => {
    updateGallery(key, (items) => items.map((item) => (item.uid === uid ? { ...item, ...patch } : item)));
    clearGalleryError(key, uid);
  }, [updateGallery, clearGalleryError]);

  // Gallery order = the order of the building's 360° tour.
  const handleGalleryMove = useCallback((key, uid, step) => {
    updateGallery(key, (items) => {
      const from = items.findIndex((item) => item.uid === uid);
      const to = from + step;
      if (from < 0 || to < 0 || to >= items.length) return items;
      const next = [...items];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }, [updateGallery]);

  const handleGalleryRemove = useCallback((key, uid) => {
    updateGallery(key, (items) => items.filter((item) => {
      if (item.uid === uid) {
        releasePreview(item.preview);
        return false;
      }
      return true;
    }));
    clearGalleryError(key, uid);
  }, [releasePreview, updateGallery, clearGalleryError]);

  const handleFieldError = useCallback((key, message) => {
    setErrors((current) => ({ ...current, [key]: message }));
  }, []);

  if (!open) return null;

  const validate = () => {
    const nextErrors = {};

    fields.forEach((field) => {
      if (field.type === 'map') return;

      if (field.type === 'image') {
        const v = values[field.key];
        if (field.required && !v?.file && !v?.url) nextErrors[field.key] = 'Please choose an image';
        return;
      }

      if (field.type === 'gallery') {
        const items = values[field.key] || [];
        const itemErrors = {};
        items.forEach((item) => {
          const e = {};
          if (!item.file && !item.url) e.image = 'Image missing';
          if (!isValidCoordinate(item.lat)) e.lat = 'Required';
          else if (!inRange(item.lat, -90, 90)) e.lat = 'Must be between -90 and 90';
          if (!isValidCoordinate(item.lng)) e.lng = 'Required';
          else if (!inRange(item.lng, -180, 180)) e.lng = 'Must be between -180 and 180';
          if (item.heading !== '' && item.heading !== undefined && !inRange(item.heading, -360, 360)) {
            e.heading = 'Must be between -360 and 360';
          }
          (item.links || []).forEach((l) => {
            if (!l.to) e.links = 'Choose where each extra arrow goes';
            else if (l.yaw === '' || !inRange(l.yaw, -360, 360)) e.links = 'Each extra arrow needs a direction between -360 and 360';
          });
          if (Object.keys(e).length) itemErrors[item.uid] = e;
        });
        if (Object.keys(itemErrors).length) {
          nextErrors[field.key] = {
            message: 'Every image needs a valid latitude and longitude.',
            items: itemErrors,
          };
        } else if (field.required && items.length === 0) {
          nextErrors[field.key] = { message: 'Add at least one image.', items: {} };
        }
        return;
      }

      if (field.type === 'pathwayLink') {
        const link = values[field.key] || {};
        if (!link.pathwayNode) return; // not connected — nothing to check
        const gallery = values[field.galleryKey || 'images'] || [];
        const entry = gallery.find((item) => (item.id || item.uid) === link.entryImage);
        if (!link.entryImage || !entry) {
          nextErrors[field.key] = 'Choose the entrance photo (one of the 360° images above).';
        } else if (entry.panorama !== true) {
          nextErrors[field.key] = 'The entrance photo must be an image marked as a 360° panorama.';
        } else if (link.pinYaw !== '' && !inRange(link.pinYaw, -360, 360)) {
          nextErrors[field.key] = 'Pin direction must be between -360 and 360 (or blank).';
        } else if (link.returnYaw !== '' && !inRange(link.returnYaw, -360, 360)) {
          nextErrors[field.key] = 'Return arrow direction must be between -360 and 360 (or blank).';
        }
        return;
      }

      if (field.required && !String(values[field.key] ?? '').trim()) {
        nextErrors[field.key] = 'Required';
      }
    });

    const mapField = fields.find((field) => field.type === 'map');
    if (mapField && (!inRange(values.lat, -90, 90) || !inRange(values.lng, -180, 180))) {
      nextErrors[mapField.key] = 'Please select a location on the map';
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError('Please fix the highlighted fields.');
      return;
    }

    const needsUpload = fields.some((field) => (
      (field.type === 'image' && values[field.key]?.file) ||
      (field.type === 'gallery' && (values[field.key] || []).some((item) => item.file))
    ));
    if (needsUpload && typeof onUploadImage !== 'function') {
      setFormError('Image upload is not configured for this form.');
      return;
    }

    setSubmitting(true);
    const uploadedPaths = [];

    try {
      const out = {};

      for (const field of fields) {
        if (field.type === 'map') continue;

        if (field.type === 'image') {
          const v = values[field.key];
          if (v?.file) {
            const uploaded = await onUploadImage(v.file, values);
            uploadedPaths.push(uploaded.path);
            out[field.key] = uploaded.url;
          } else {
            out[field.key] = v?.url || '';
          }
          continue;
        }

        if (field.type === 'gallery') {
          const result = [];
          const galleryIds = new Set((values[field.key] || []).map((g) => g.id || g.uid));
          for (const item of values[field.key] || []) {
            let { url, path } = item;
            if (item.file) {
              const uploaded = await onUploadImage(item.file, values);
              uploadedPaths.push(uploaded.path);
              url = uploaded.url;
              path = uploaded.path;
            }
            result.push({
              id: item.id || item.uid,
              url,
              path: path || '',
              lat: Number(item.lat),
              lng: Number(item.lng),
              caption: String(item.caption || '').trim(),
              ...(typeof item.panorama === 'boolean' ? { panorama: item.panorama } : {}),
              ...(item.heading !== '' && item.heading !== undefined && Number.isFinite(Number(item.heading))
                ? { heading: Number(item.heading) }
                : {}),
              // extra arrows (3–4 way junctions); drop arrows to removed images
              links: (item.links || [])
                .filter((l) => l.to && galleryIds.has(l.to) && Number.isFinite(Number(l.yaw)))
                .map((l) => ({ to: l.to, yaw: Number(l.yaw) })),
            });
          }
          out[field.key] = result;
          continue;
        }

        if (field.type === 'pathwayLink') {
          const link = values[field.key] || {};
          const num = (v) => (v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);
          out[field.key] = link.pathwayNode
            ? {
                pathwayNode: link.pathwayNode,
                entryImage: link.entryImage,
                label: String(link.label || '').trim(),
                pinYaw: num(link.pinYaw),
                returnYaw: num(link.returnYaw),
              }
            : null;
          continue;
        }

        out[field.key] = fromEditableValue(field, values[field.key]);
      }

      if (fields.some((field) => field.type === 'map')) {
        out.lat = Number(values.lat);
        out.lng = Number(values.lng);
      }

      await onSubmit(out);
    } catch (err) {
      setFormError(err?.message || 'Something went wrong while saving.');
      if (uploadedPaths.length && typeof onDiscardUploads === 'function') {
        onDiscardUploads(uploadedPaths);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = (err) => (typeof err === 'string' ? err : err?.message);

  return (
    <div className="ad-overlay" onClick={submitting ? undefined : onClose}>
      <form className="ad-form-box" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
        <div className="ad-form-header">
          <h3>{title}</h3>
          <button type="button" className="ad-icon-btn" onClick={onClose} disabled={submitting}>✕</button>
        </div>

        <div className="ad-form-grid">
          {fields.map((field) => {
            if (field.type === 'map') {
              return (
                <div key={field.key} className={`ad-field wide${errors[field.key] ? ' has-error' : ''}`}>
                  <label>{field.label}{field.required && <span className="ad-req">*</span>}</label>
                  <LocationPicker latitude={values.lat} longitude={values.lng} onChange={handleLocationChange} />
                  {errors[field.key] && <span className="ad-error">{errorText(errors[field.key])}</span>}
                </div>
              );
            }

            if (field.type === 'image') {
              return (
                <div key={field.key} className={`ad-field${field.wide ? ' wide' : ''}${errors[field.key] ? ' has-error' : ''}`}>
                  <label>{field.label}{field.required && <span className="ad-req">*</span>}</label>
                  <ImageUploadField
                    value={values[field.key]}
                    disabled={submitting}
                    onSelectFile={(file) => handleImageSelect(field.key, file)}
                    onClear={() => handleImageClear(field.key)}
                    onError={(msg) => handleFieldError(field.key, msg)}
                  />
                  {errors[field.key] && <span className="ad-error">{errorText(errors[field.key])}</span>}
                </div>
              );
            }

            if (field.type === 'gallery') {
              const galleryError = errors[field.key];
              return (
                <div key={field.key} className={`ad-field wide${galleryError ? ' has-error' : ''}`}>
                  <label>{field.label}{field.required && <span className="ad-req">*</span>}</label>
                  {field.help && <span className="ad-field-help">{field.help}</span>}
                  <GalleryField
                    items={values[field.key] || []}
                    errors={typeof galleryError === 'object' ? galleryError.items : {}}
                    disabled={submitting}
                    buildingLat={values.lat}
                    buildingLng={values.lng}
                    onAddFiles={(files) => handleGalleryAdd(field.key, files)}
                    onReplaceFile={(uid, file) => handleGalleryReplace(field.key, uid, file)}
                    onChangeItem={(uid, patch) => handleGalleryChange(field.key, uid, patch)}
                    onRemoveItem={(uid) => handleGalleryRemove(field.key, uid)}
                    onMoveItem={(uid, step) => handleGalleryMove(field.key, uid, step)}
                    onError={(msg) => handleFieldError(field.key, msg)}
                  />
                  {galleryError && <span className="ad-error">{errorText(galleryError)}</span>}
                </div>
              );
            }

            if (field.type === 'pathwayLink') {
              return (
                <div key={field.key} className={`ad-field wide${errors[field.key] ? ' has-error' : ''}`}>
                  <label>{field.label}</label>
                  {field.help && <span className="ad-field-help">{field.help}</span>}
                  <PathwayLinkField
                    value={values[field.key]}
                    onChange={(next) => handleChange(field.key, next)}
                    galleryItems={values[field.galleryKey || 'images'] || []}
                    buildingLat={values.lat}
                    buildingLng={values.lng}
                    buildingName={values.name}
                    recordId={initialValues?._id}
                    disabled={submitting}
                  />
                  {errors[field.key] && <span className="ad-error">{errorText(errors[field.key])}</span>}
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
                    disabled={submitting}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <select value={values[field.key] ?? ''} disabled={submitting} onChange={(e) => handleChange(field.key, e.target.value)}>
                    <option value="" disabled style={OPTION_STYLE}>Select…</option>
                    {field.options.map((option) => <option key={option} value={option} style={OPTION_STYLE}>{option}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'color' ? 'color' : 'text'}
                    value={values[field.key] ?? ''}
                    disabled={submitting}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    step={field.type === 'number' ? 'any' : undefined}
                  />
                )}

                {field.help && <span className="ad-field-help">{field.help}</span>}
                {errors[field.key] && <span className="ad-error">{errorText(errors[field.key])}</span>}
              </div>
            );
          })}
        </div>

        {formError && <div className="ad-form-error" role="alert">{formError}</div>}

        <div className="ad-form-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormModal;