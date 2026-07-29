/** Thrown by server actions on a non-2xx API response, carrying the HTTP status. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ValidationErrorLike {
  constraints?: Record<string, string>;
  children?: ValidationErrorLike[];
}

function collectConstraintMessages(errors: ValidationErrorLike[]): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    if (error.constraints) messages.push(...Object.values(error.constraints));
    if (error.children?.length) messages.push(...collectConstraintMessages(error.children));
  }

  return messages;
}

/**
 * Normalizes the API's two error response shapes into a displayable string:
 * plain HttpException errors (`message: string | string[]`) and DTO validation
 * failures (`message` as an array of class-validator error objects, since the
 * API's I18nValidationExceptionFilter uses `detailedErrors: true`).
 */
export function extractApiErrorMessage(body: unknown, fallback: string): string {
  const message = (body as { message?: unknown } | null)?.message;

  if (typeof message === 'string') return message;

  if (Array.isArray(message)) {
    if (message.length === 0) return fallback;

    if (typeof message[0] === 'string') return (message as string[]).join(', ');

    const constraintMessages = collectConstraintMessages(message as ValidationErrorLike[]);
    return constraintMessages.length > 0 ? constraintMessages.join(', ') : fallback;
  }

  return fallback;
}
