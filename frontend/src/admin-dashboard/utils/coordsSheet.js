const HEADER = ['Image name', 'Coordinates'];
const isNum = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

export const imageDisplayName = (item, index) => String(item?.caption || '').trim() || `Image ${index + 1}`;

const normName = (s) => String(s ?? '').trim().toLowerCase();

export function parseCoordinateText(value) {
  const nums = String(value ?? '').match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  const lat = Number(nums[0]);
  const lng = Number(nums[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function loadXlsx() {
  return import('xlsx');
}

async function buildWorkbookBytes(items) {
  const XLSX = await loadXlsx();
  const rows = [HEADER, ...items.map((item, i) => [
    imageDisplayName(item, i),
    isNum(item.lat) && isNum(item.lng) ? `${item.lat}, ${item.lng}` : '',
  ])];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 28 }, { wch: 34 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Coordinates');
  return XLSX.write(book, { bookType: 'xlsx', type: 'array' });
}

export async function readCoordinateRows(fileOrBuffer) {
  const XLSX = await loadXlsx();
  const data = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();
  const book = XLSX.read(data, { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  const out = [];
  rows.forEach((row, i) => {
    if (i === 0 && normName(row[0]) === normName(HEADER[0])) return;
    const name = String(row[0] ?? '').trim();
    if (!name) return;
    const coords = row.length >= 3 && String(row[2]).trim() !== ''
      ? parseCoordinateText(`${row[1]}, ${row[2]}`)
      : parseCoordinateText(row[1]);
    out.push({ name, coords });
  });
  return out;
}

export function applyCoordinateRows(rows, items, onChangeItem) {
  const byName = new Map();
  items.forEach((item, i) => byName.set(normName(imageDisplayName(item, i)), item));
  let applied = 0;
  const unknown = [];
  for (const { name, coords } of rows) {
    const item = byName.get(normName(name));
    if (!item) { unknown.push(name); continue; }
    if (!coords) continue;
    if (Number(item.lat) === coords.lat && Number(item.lng) === coords.lng) continue;
    onChangeItem(item.uid, { lat: coords.lat, lng: coords.lng });
    applied += 1;
  }
  return { applied, unknown };
}

export const canWatchFiles = () => typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';

export async function saveCoordinateSheet(items, suggestedName) {
  const bytes = await buildWorkbookBytes(items);
  if (canWatchFiles()) {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'Excel workbook', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(bytes);
    await writable.close();
    return handle;
  }
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return null;
}

export function watchCoordinateSheet(handle, onRows, intervalMs = 2000) {
  let last = null;
  let stopped = false;
  let busy = false;
  const tick = async () => {
    if (stopped || busy) return;
    busy = true;
    try {
      const file = await handle.getFile();
      if (last === null) last = file.lastModified;
      else if (file.lastModified !== last) {
        last = file.lastModified;
        onRows(await readCoordinateRows(file));
      }
    } catch {
    } finally {
      busy = false;
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  return () => { stopped = true; clearInterval(timer); };
}