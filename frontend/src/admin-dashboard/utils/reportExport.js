// Report exports for the Reports page: a styled Excel workbook and a plain CSV.
// exceljs is loaded only when the admin clicks "Export Excel" (keeps the admin bundle small).

const GREEN = 'FF1E4D1A';
const LIGHT = 'FFEEF3EC';
const STRIPE = 'FFF6F8F5';

export const TYPE_LABEL = { academic: 'Academic', admin: 'Administrative', facility: 'Facility' };
const list = (v) => (Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter(Boolean) : []);
const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

const fileStamp = () => new Date().toISOString().slice(0, 10);

/* ---------- rows shared by Excel and CSV ---------- */
function buildingRows(buildings, departments) {
  const deptName = (id) => departments.find((d) => d.id === id)?.name || '';
  return buildings.map((b, i) => ({
    no: i + 1,
    name: b.name || '',
    abbr: b.abbr || '',
    type: TYPE_LABEL[b.type] || cap(b.type),
    department: deptName(b.dept),
    location: b.location || '',
    description: b.desc || '',
    offices: list(b.offices).join('; '),
    programsCount: list(b.programs).length,
    programs: list(b.programs).join('; '),
    photo: b.photo ? 'Yes' : 'No',
    images: Array.isArray(b.images) ? b.images.length : 0,
    lat: num(b.lat),
    lng: num(b.lng),
  }));
}

function departmentRows(departments, buildings) {
  const bName = (id) => buildings.find((b) => b.dept === id)?.name || '';
  return departments.map((d, i) => ({
    no: i + 1,
    name: d.name || '',
    abbr: d.abbr || '',
    building: bName(d.id),
    programsCount: list(d.programs).length,
    programs: list(d.programs).join('; '),
    facultyCount: list(d.faculty).length,
    faculty: list(d.faculty).join('; '),
    offices: list(d.offices).join('; '),
    officers: list(d.officers).join('; '),
    organizations: list(d.organizations).join('; '),
  }));
}

// Excel has no time zones: shift so the cell shows the admin's local (PH) time
const localAsUtc = (iso) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000); };

function activityRows(activity) {
  return activity.map((a, i) => ({
    no: i + 1,
    date: a.ts ? localAsUtc(a.ts) : null,
    action: cap(a.action),
    record: cap(a.entity),
    item: a.label || '',
  }));
}

const BUILDING_COLS = [
  { header: '#', key: 'no', width: 5 },
  { header: 'Building Name', key: 'name', width: 34 },
  { header: 'Abbreviation', key: 'abbr', width: 13 },
  { header: 'Building Type', key: 'type', width: 15 },
  { header: 'Department', key: 'department', width: 30 },
  { header: 'Location on Campus', key: 'location', width: 24 },
  { header: 'Description', key: 'description', width: 50 },
  { header: 'Offices Inside', key: 'offices', width: 34 },
  { header: 'No. of Programs', key: 'programsCount', width: 10 },
  { header: 'Programs Offered', key: 'programs', width: 44 },
  { header: 'Has Photo', key: 'photo', width: 10 },
  { header: 'Additional Images', key: 'images', width: 11 },
  { header: 'Latitude', key: 'lat', width: 12 },
  { header: 'Longitude', key: 'lng', width: 12 },
];

const DEPARTMENT_COLS = [
  { header: '#', key: 'no', width: 5 },
  { header: 'College / Department', key: 'name', width: 36 },
  { header: 'Abbreviation', key: 'abbr', width: 13 },
  { header: 'Building', key: 'building', width: 30 },
  { header: 'No. of Programs', key: 'programsCount', width: 10 },
  { header: 'Programs Offered', key: 'programs', width: 50 },
  { header: 'No. of Faculty', key: 'facultyCount', width: 10 },
  { header: 'Faculty', key: 'faculty', width: 50 },
  { header: 'Offices', key: 'offices', width: 30 },
  { header: 'Student Council Officers', key: 'officers', width: 40 },
  { header: 'Affiliated Organizations', key: 'organizations', width: 36 },
];

const ACTIVITY_COLS = [
  { header: '#', key: 'no', width: 5 },
  { header: 'Date and Time', key: 'date', width: 22 },
  { header: 'Action', key: 'action', width: 12 },
  { header: 'Record', key: 'record', width: 14 },
  { header: 'Item', key: 'item', width: 44 },
];

/* ---------- Excel ---------- */
function titleBlock(ws, title, meta, lastCol) {
  ws.mergeCells(1, 1, 1, lastCol);
  ws.getCell(1, 1).value = 'Northwest Samar State University — CampusTour';
  ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: GREEN } };
  ws.mergeCells(2, 1, 2, lastCol);
  ws.getCell(2, 1).value = title;
  ws.getCell(2, 1).font = { bold: true, size: 12 };
  ws.mergeCells(3, 1, 3, lastCol);
  ws.getCell(3, 1).value = meta;
  ws.getCell(3, 1).font = { italic: true, size: 9, color: { argb: 'FF555555' } };
}

function addTable(ws, cols, rows, title, meta) {
  ws.columns = cols.map(({ key, width }) => ({ key, width }));
  titleBlock(ws, title, meta, cols.length);
  const headerRow = ws.getRow(5);
  cols.forEach((c, i) => { headerRow.getCell(i + 1).value = c.header; });
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  rows.forEach((r, idx) => {
    const row = ws.addRow(r);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9DED7' } } };
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STRIPE } };
    });
  });
  if (rows.length === 0) ws.addRow({ [cols[1].key]: 'No records' });
  ws.views = [{ state: 'frozen', ySplit: 5 }];
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: cols.length } };
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, printTitlesRow: '5:5' };
}

export async function exportReportExcel({ buildings, allBuildings, departments, activity, stats, filters, preparedBy }) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = preparedBy || 'CampusTour Admin';
  wb.created = new Date();
  const generated = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const meta = `Generated ${generated} · Prepared by ${preparedBy} · Building type: ${filters.typeLabel} · Activity: last ${filters.days} days`;

  /* Summary */
  const ws = wb.addWorksheet('Summary');
  ws.columns = [{ width: 34 }, { width: 18 }];
  titleBlock(ws, 'System Report — Summary', meta, 2);
  const summary = [
    ['Total buildings', stats.totalBuildings],
    ['Buildings with photo', stats.buildingsWithPhoto],
    ['Additional images', stats.totalGalleryImages],
    ['Colleges / departments', stats.totalDepartments],
    ['Academic programs', stats.totalPrograms],
    ['Faculty listed', stats.totalFaculty],
    ...Object.entries(stats.byType).map(([t, n]) => [`${TYPE_LABEL[t] || cap(t)} buildings`, n]),
    ['Buildings in this report (filtered)', buildings.length],
    [`Admin edits (last ${filters.days} days)`, activity.length],
  ];
  const head = ws.getRow(5);
  head.values = ['Item', 'Count'];
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
  });
  summary.forEach(([k, v]) => {
    const row = ws.addRow([k, v]);
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
    row.getCell(1).font = { bold: true, color: { argb: GREEN } };
    row.getCell(2).alignment = { horizontal: 'center' };
  });

  addTable(wb.addWorksheet('Buildings'), BUILDING_COLS, buildingRows(buildings, departments), `Buildings (${buildings.length})`, meta);
  addTable(wb.addWorksheet('Departments'), DEPARTMENT_COLS, departmentRows(departments, allBuildings), `Colleges and Departments (${departments.length})`, meta);
  const act = wb.addWorksheet('Admin Activity');
  addTable(act, ACTIVITY_COLS, activityRows(activity), `Admin Activity — last ${filters.days} days (${activity.length})`, meta);
  act.getColumn('date').numFmt = 'mmm d, yyyy h:mm AM/PM';

  const buffer = await wb.xlsx.writeBuffer();
  download(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `CampusTour-Report-${fileStamp()}.xlsx`
  );
}

/* ---------- CSV (buildings) ---------- */
export function exportBuildingsCsv(buildings, departments) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [BUILDING_COLS.map((c) => esc(c.header)).join(',')];
  buildingRows(buildings, departments).forEach((r) => lines.push(BUILDING_COLS.map((c) => esc(r[c.key])).join(',')));
  // \uFEFF tells Excel the file is UTF-8, so ñ, °, é show correctly
  download(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }), `CampusTour-Buildings-${fileStamp()}.csv`);
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}