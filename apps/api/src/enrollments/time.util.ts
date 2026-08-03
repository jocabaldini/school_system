export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function timeStringToDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}
