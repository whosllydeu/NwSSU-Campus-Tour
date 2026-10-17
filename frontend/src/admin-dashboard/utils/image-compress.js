export const IMAGE_LIMITS = {
  maxSourceMB: 60,
  maxUploadMB: 5,

  photoMaxEdge: 2560,
  photoTargetMB: 2,

  panoramaMaxWidth: 4096,
  panoramaTargetMB: 2,

  qualitySteps: [0.86, 0.8, 0.74, 0.68, 0.62],
};

const MB = 1024 * 1024;

const preparedInfo = new WeakMap();

export function getPreparedInfo(file) {
  return file ? preparedInfo.get(file) || null : null;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

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
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);
    canvas.toBlob((blob) => {
      canvas.width = 0;
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

    if (scale === 1 && file.size <= targetBytes && file.type === 'image/jpeg') {
      preparedInfo.set(file, { originalBytes: file.size, width: srcW, height: srcH, panorama, optimized: false });
      return file;
    }

    let blob = null;
    let width = srcW;
    let height = srcH;

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