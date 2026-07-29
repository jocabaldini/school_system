function calculateCheckDigit(base: string): number {
  let sum = 0;
  let weight = base.length + 1;
  for (const char of base) {
    sum += Number(char) * weight;
    weight -= 1;
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/** Mirrors apps/api's is-cpf.validator.ts check-digit algorithm. */
export function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const firstNine = digits.slice(0, 9);
  const firstCheckDigit = calculateCheckDigit(firstNine);
  const firstTenDigits = firstNine + String(firstCheckDigit);
  const secondCheckDigit = calculateCheckDigit(firstTenDigits);

  return digits === firstTenDigits + String(secondCheckDigit);
}

/** Formats digits progressively as 000.000.000-00 while the user types. */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  let result = digits.slice(0, 3);
  if (digits.length > 3) result += '.' + digits.slice(3, 6);
  if (digits.length > 6) result += '.' + digits.slice(6, 9);
  if (digits.length > 9) result += '-' + digits.slice(9, 11);

  return result;
}
