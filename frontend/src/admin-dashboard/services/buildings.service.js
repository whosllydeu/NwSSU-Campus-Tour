import { supabase } from '../../lib/supabaseClient';
import { slugify } from '../../lib/slugify';

const TABLE = 'buildings';

function cleanImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img) => img && img.url)
    .map((img, index) => ({
      id: img.id || `img-${Date.now()}-${index}`,
      url: img.url,
      path: img.path || '',
      lat: Number(img.lat),
      lng: Number(img.lng),
      caption: img.caption ? String(img.caption).trim() : '',
      ...(typeof img.panorama === 'boolean' ? { panorama: img.panorama } : {}),
      ...(img.heading !== '' && img.heading !== undefined && img.heading !== null && Number.isFinite(Number(img.heading))
        ? { heading: Number(img.heading) }
        : {}),
      ...(img.view !== '' && img.view !== undefined && img.view !== null && Number.isFinite(Number(img.view))
        ? { view: Number(img.view) }
        : {}),
      ...(img.back !== '' && img.back !== undefined && img.back !== null && Number.isFinite(Number(img.back))
        ? { back: Number(img.back) }
        : {}),
      ...(cleanLinks(img.links).length ? { links: cleanLinks(img.links) } : {}),
      ...(img.end === true ? { end: true } : {}),
    }));
}

function cleanLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .filter((l) => l && l.to && l.yaw !== '' && l.yaw !== null && Number.isFinite(Number(l.yaw)))
    .map((l) => ({ to: String(l.to), yaw: Number(l.yaw) }));
}

const optionalNumber = (v) => (
  v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null
);

function cleanPathwayLink(link) {
  if (!link) return null;
  if (!link.pathwayNode) return link.useUploadedTour === true ? { pathwayNode: '', useUploadedTour: true } : null;
  return {
    pathwayNode: String(link.pathwayNode),
    entryImage: link.entryImage ? String(link.entryImage) : '',
    label: link.label ? String(link.label).trim() : '',
    pinYaw: optionalNumber(link.pinYaw),
    returnYaw: optionalNumber(link.returnYaw),
    exitArrow: link.exitArrow === true,
    useUploadedTour: link.useUploadedTour === true,
  };
}

function fromDb(row) {
  if (!row) return row;
  const { description, department_id, images, pathway_link, ...rest } = row;
  return {
    ...rest,
    desc: description,
    dept: department_id,
    images: Array.isArray(images) ? images : [],
    pathwayLink: pathway_link || null,
    _id: row.id,
  };
}

function toDb(data) {
  const { desc, dept, images, pathwayLink, ...rest } = data;
  delete rest._id;
  return {
    ...rest,
    ...(desc !== undefined ? { description: desc } : {}),
    ...(dept !== undefined ? { department_id: dept || null } : {}),
    ...(images !== undefined ? { images: cleanImages(images) } : {}),
    ...(pathwayLink !== undefined ? { pathway_link: cleanPathwayLink(pathwayLink) } : {}),
  };
}

export async function listBuildings() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name');
  if (error) throw error;
  return data.map(fromDb);
}

export async function createBuilding(data) {
  const id = data.id || slugify(data.name || data.abbr || `building-${Date.now()}`);
  const { data: row, error } = await supabase.from(TABLE).insert({ ...toDb(data), id }).select().single();
  if (error) throw error;
  return fromDb(row);
}

export async function updateBuilding(id, data) {
  const { data: rows, error } = await supabase.from(TABLE).update(toDb(data)).eq('id', id).select();
  if (error) throw error;
  if (!rows || rows.length === 0) {
    throw new Error('Update was blocked — you may not be signed in as an admin, or your session expired.');
  }
  return fromDb(rows[0]);
}

export async function deleteBuilding(id) {
  const { data: rows, error } = await supabase.from(TABLE).delete().eq('id', id).select();
  if (error) throw error;
  if (!rows || rows.length === 0) {
    throw new Error('Delete was blocked — you may not be signed in as an admin, or your session expired.');
  }
}