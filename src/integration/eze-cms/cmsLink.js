export function resolveCmsLink(value, fallback) {
  if (value && typeof value === 'object' && typeof value.label === 'string' && typeof value.href === 'string') return value;
  return fallback;
}
