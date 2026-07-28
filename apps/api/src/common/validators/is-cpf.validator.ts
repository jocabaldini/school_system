import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calculateCheckDigit = (base: string): number => {
    let sum = 0;
    let weight = base.length + 1;
    for (const char of base) {
      sum += Number(char) * weight;
      weight -= 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstNine = digits.slice(0, 9);
  const firstCheckDigit = calculateCheckDigit(firstNine);
  const firstTenDigits = firstNine + String(firstCheckDigit);
  const secondCheckDigit = calculateCheckDigit(firstTenDigits);

  return digits === firstTenDigits + String(secondCheckDigit);
}

@ValidatorConstraint({ name: 'isCPF', async: false })
class IsCPFConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidCPF(value);
  }
}

export function IsCPF(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCPFConstraint,
    });
  };
}
