// What a building still needs before its public pages look finished.
const filled = (v) => (Array.isArray(v) ? v.some((x) => String(x || '').trim()) : Boolean(String(v ?? '').trim()));

export function missingInfo(b) {
  const missing = [];
  if (!filled(b.desc)) missing.push('Description');
  if (!filled(b.photo)) missing.push('Photo');
  if (!filled(b.offices)) missing.push('Offices');
  if (!filled(b.location)) missing.push('Campus location');
  if (b.type === 'academic' && !filled(b.programs)) missing.push('Programs');
  return missing;
}
