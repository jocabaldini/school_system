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

/**
 * Generates a valid, distinct 11-digit CPF from a seed number.
 * Used by e2e tests to avoid colliding on the unique `cpf` constraint
 * across repeated local test runs (the test DB is not wiped for these tables).
 * Mixes in the current time so bases don't repeat across separate suite runs either
 * (a fixed seed range alone collides once enough runs have accumulated data).
 */
export function generateCPF(seed: number): string {
  const base = String(Date.now() * 1000 + seed)
    .padStart(9, '0')
    .slice(-9);
  const firstCheckDigit = calculateCheckDigit(base);
  const firstTenDigits = base + String(firstCheckDigit);
  const secondCheckDigit = calculateCheckDigit(firstTenDigits);
  return firstTenDigits + String(secondCheckDigit);
}
