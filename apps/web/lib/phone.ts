/** Formats digits progressively as (00) 0000-0000 (10 digits) or (00) 00000-0000 (11 digits). */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';

  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) return `(${ddd}`;

  const rest = digits.slice(2);
  const localLen = digits.length > 10 ? 5 : 4;
  const localPart = rest.slice(0, localLen);
  const lineEnd = rest.slice(localLen, localLen + 4);

  return lineEnd ? `(${ddd}) ${localPart}-${lineEnd}` : `(${ddd}) ${localPart}`;
}

/** Phone is optional — empty is valid; otherwise requires 10 or 11 digits (area code + number). */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (!digits) return true;
  return digits.length === 10 || digits.length === 11;
}
