export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export const DESC_FALLBACK = 'Description coming soon';

const TYPE_LABELS = {
  academic: 'Academic building',
  admin: 'Administrative building',
  facility: 'Facility',
};

// One-line "what is this and what's inside" label (replaces raw coordinates).
export function buildingSubtitle(b) {
  if (!b) return '';
  if (b.subtitle) return b.subtitle;
  const type = TYPE_LABELS[b.type] || '';
  const offices = Array.isArray(b.offices) ? b.offices.filter(Boolean) : [];
  const programs = Array.isArray(b.programs) ? b.programs.filter(Boolean) : [];
  let inside = '';
  if (offices.length) {
    inside = offices.slice(0, 2).join(', ') + (offices.length > 2 ? ` +${offices.length - 2} more` : '');
  } else if (programs.length) {
    inside = `${programs.length} program${programs.length === 1 ? '' : 's'}`;
  }
  return [type, inside].filter(Boolean).join(' · ');
}
