// ============================================================
// Browser-side image optimisation for the admin upload fields.
//
// Big photos (and especially 360° panoramas from a phone or camera,
// often 15–40 MB) are resized and re-encoded as JPEG in the browser
// BEFORE they are uploaded, so Supabase Storage only receives a
// web-friendly file. No extra npm packages — just <canvas>.
//
// ▸ Want sharper or lighter images? Change IMAGE_LIMITS below.
// ============================================================

export const IMAGE_LIMITS = {
  // Largest file the admin may SELECT (before optimisation).
  maxSourceMB: 60,

  // Largest file that may be UPLOADED (after optimisation).
  // Must be ≤ the bucket's file_size_limit in Supabase (see the SQL file).
  maxUploadMB: 15,

  // Normal photos: longest side in pixels, and the size we aim for.
  photoMaxEdge: 2560,
  photoTargetMB: 2,

  // 360° panoramas (equirectangular, ~2:1): width in pixels and target size.
  // 6144 keeps good detail and loads well on phones. 8192 = sharper but
  // ~1.8× heavier; 4096 = lightest, a bit soft when zoomed in.
  panoramaMaxWidth: 6144,
  panoramaTargetMB: 8,

  // JPEG quality steps tried from best to smallest.
  qualitySteps: [0.86, 0.8, 0.74, 0.68, 0.62],
};

const MB = 1024 * 1024;

// Info about each optimised file (original size, dimensions, panorama?).
const preparedInfo = new WeakMap();

export function getPreparedInfo(file) {
  return file ? preparedInfo.get(file) || null : null;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** True for equirectangular 360° panoramas (about twice as wide as tall). */
export function isPanoramaSize(width, height) {
  if (!width || !height) return false;
  const ratio = width / height;
  return ratio >= 1.9 && ratio <= 2.1 && width >= 2000;
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall through to the <img> path (older browsers)
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This image could not be read. Try exporting it again as JPG.'));
    };
    image.src = url;
  });
}

function encode(source, width, height, quality) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Your browser could not process this image.'));
      return;
    }
    ctx.fillStyle = '#ffffff'; // transparent PNG areas become white, not black
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);
    canvas.toBlob((blob) => {
      canvas.width = 0; // free memory right away
      canvas.height = 0;
      if (blob) resolve(blob);
      else reject(new Error('Image is too large for the browser to resize. Try a smaller export.'));
    }, 'image/jpeg', quality);
  });
}

function jpgName(name) {
  const base = String(name || 'image').replace(/\.[^.]+$/, '');
  return `${base}.jpg`;
}

/**
 * Resizes / compresses an image for upload.
 * GIFs are returned unchanged (re-encoding would drop animation).
 * @param {File} file
 * @returns {Promise<File>}  the optimised file (or the original if it was already small)
 */
export async function prepareImageForUpload(file) {
  const L = IMAGE_LIMITS;

  if (file.type === 'image/gif') {
    preparedInfo.set(file, { originalBytes: file.size, width: null, height: null, panorama: false, optimized: false });
    return file;
  }

  const source = await decodeImage(file);
  const srcW = source.width;
  const srcH = source.height;

  try {
    const panorama = isPanoramaSize(srcW, srcH);
    const maxEdge = panorama ? L.panoramaMaxWidth : L.photoMaxEdge;
    const targetBytes = (panorama ? L.panoramaTargetMB : L.photoTargetMB) * MB;
    const maxUploadBytes = L.maxUploadMB * MB;

    let scale = Math.min(1, maxEdge / Math.max(srcW, srcH));

    // Already small enough and the right size → keep the original file.
    if (scale === 1 && file.size <= targetBytes && file.type === 'image/jpeg') {
      preparedInfo.set(file, { originalBytes: file.size, width: srcW, height: srcH, panorama, optimized: false });
      return file;
    }

    let blob = null;
    let width = srcW;
    let height = srcH;

    // Try each quality step; if still too big, shrink 15% and try again.
    for (let round = 0; round < 6; round += 1) {
      width = Math.max(1, Math.round(srcW * scale));
      height = Math.max(1, Math.round(srcH * scale));
      for (const quality of L.qualitySteps) {
        blob = await encode(source, width, height, quality);
        if (blob.size <= targetBytes) break;
      }
      if (blob.size <= targetBytes) break;
      scale *= 0.85;
    }

    // Never upload something bigger than what the admin picked when it didn't need resizing.
    if (blob.size >= file.size && srcW <= maxEdge && srcH <= maxEdge && file.size <= maxUploadBytes) {
      preparedInfo.set(file, { originalBytes: file.size, width: srcW, height: srcH, panorama, optimized: false });
      return file;
    }

    const optimized = new File([blob], jpgName(file.name), { type: 'image/jpeg', lastModified: Date.now() });
    preparedInfo.set(optimized, {
      originalBytes: file.size,
      width,
      height,
      panorama,
      optimized: true,
    });
    return optimized;
  } finally {
    if (typeof source.close === 'function') source.close();
  }
}