import { supabase } from '../../lib/supabaseClient';
import { slugify } from '../../lib/slugify';
import { IMAGE_LIMITS } from '../utils/image-compress.js';

// Supabase Storage bucket for building photos. Created by
// supabase/migrations/building_images_and_departments.sql — override with
// VITE_SUPABASE_BUILDING_BUCKET only if you named the bucket differently.
export const BUILDING_BUCKET = import.meta.env.VITE_SUPABASE_BUILDING_BUCKET || 'building-images';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Size limits live in ../utils/image-compress.js (IMAGE_LIMITS) so they can
// be adjusted in one place.
export const MAX_SOURCE_BYTES = IMAGE_LIMITS.maxSourceMB * 1024 * 1024;
export const MAX_UPLOAD_BYTES = IMAGE_LIMITS.maxUploadMB * 1024 * 1024;

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Checks a file the admin just SELECTED (before optimisation).
 * Returns an error message, or '' when the file is OK.
 */
export function validateImageFile(file) {
  if (!file) return 'No file selected.';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported file type. Use JPG, PNG, WEBP or GIF.';
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${IMAGE_LIMITS.maxSourceMB} MB.`;
  }
  return '';
}

/**
 * Checks a file right before UPLOAD (after optimisation).
 */
export function validateUploadFile(file) {
  if (!file) return 'No file selected.';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported file type. Use JPG, PNG, WEBP or GIF.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Image is still ${(file.size / 1024 / 1024).toFixed(1)} MB after optimising. Maximum upload is ${IMAGE_LIMITS.maxUploadMB} MB.`;
  }
  return '';
}

/**
 * Uploads one image to Supabase Storage.
 * @param {File} file
 * @param {string} folderKey  building id or name — used as the folder
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadBuildingImage(file, folderKey) {
  const problem = validateUploadFile(file);
  if (problem) throw new Error(problem);

  const folder = slugify(folderKey || 'building') || 'building';
  const ext = EXT_BY_TYPE[file.type] || 'jpg';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `buildings/${folder}/${unique}.${ext}`;

  const { error } = await supabase.storage
    .from(BUILDING_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUILDING_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Extracts the storage path from a public URL of OUR bucket.
 * Returns '' for local filenames or URLs from anywhere else, so those are
 * never touched by cleanup.
 */
export function storagePathFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const marker = `/storage/v1/object/public/${BUILDING_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at === -1) return '';
  return decodeURIComponent(url.slice(at + marker.length).split('?')[0]);
}

/**
 * Best-effort removal of storage objects that are no longer referenced.
 * Never throws — a leftover file is harmless, a failed save is not.
 */
export async function removeBuildingImages(paths) {
  const clean = [...new Set((paths || []).filter(Boolean))];
  if (clean.length === 0) return;
  try {
    const { error } = await supabase.storage.from(BUILDING_BUCKET).remove(clean);
    if (error) console.warn('Could not remove old building images:', error.message);
  } catch (err) {
    console.warn('Could not remove old building images:', err);
  }
}

/**
 * Lists every storage path referenced by a building record
 * (main photo + gallery images).
 */
export function collectBuildingImagePaths(building) {
  if (!building) return [];
  const paths = [storagePathFromUrl(building.photo)];
  (Array.isArray(building.images) ? building.images : []).forEach((img) => {
    paths.push(img?.path || storagePathFromUrl(img?.url));
  });
  return paths.filter(Boolean);
}