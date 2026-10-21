const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

export function linkedDepartment(building, departments = [], buildings = []) {
  if (!building || building.type !== 'academic') return null;
  const usedByOther = (deptId) => buildings.some((b) => b._id !== building._id && b.dept === deptId);
  return (
    (building.dept && departments.find((d) => d.id === building.dept)) ||
    departments.find((d) => d.id === building.id && !usedByOther(d.id)) ||
    (building.abbr ? departments.find((d) => same(d.abbr, building.abbr) && !usedByOther(d.id)) : null) ||
    null
  );
}