// ============================================================
// Small text helpers.
// Note: escHtml / escAttr from the original are intentionally
// dropped — React escapes all interpolated text by default.
// ============================================================

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
