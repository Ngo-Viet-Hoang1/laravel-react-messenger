export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export const HTTP_STATUS_PHRASES: Record<number, string> = {
  [HttpStatus.OK]: 'OK',
  [HttpStatus.CREATED]: 'Created',
  [HttpStatus.ACCEPTED]: 'Accepted',
  [HttpStatus.NO_CONTENT]: 'No Content',
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
};

export const getHttpStatusPhrase = (status: number) =>
  HTTP_STATUS_PHRASES[status] || `HTTP Error ${status}`;

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  timestamp?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly detail?: string;
  public readonly traceId?: string;
  public readonly errors?: Record<string, string[]>;

  constructor(problem: ProblemDetails) {
    super(problem.detail || problem.title || 'An unexpected API error occurred.');
    this.name = 'ApiError';
    this.status = problem.status ?? 500;
    this.title = problem.title || getHttpStatusPhrase(this.status);
    this.detail = problem.detail;
    this.traceId = problem.traceId;
    this.errors = problem.errors;
  }
}

export const isAbortError = (err: unknown): boolean =>
  err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError');

export const getValidationErrors = (err: unknown): Record<string, string[]> | undefined => {
  if (err instanceof ApiError && err.errors && Object.keys(err.errors).length > 0) {
    return err.errors;
  }
  return undefined;
};

export const getFieldError = (err: unknown, fieldName: string): string | undefined => {
  const errors = getValidationErrors(err);
  if (!errors) return undefined;

  // Case-insensitive lookup (e.g. 'email' matches 'Email' or 'email')
  const key = Object.keys(errors).find((k) => k.toLowerCase() === fieldName.toLowerCase());

  return key && errors[key]?.length > 0 ? errors[key][0] : undefined;
};

export const getErrorMessage = (
  err: unknown,
  fallback = 'Failed to connect to the server.'
): string => {
  if (err instanceof ApiError) {
    // If backend returned specific field validation errors, aggregate them nicely
    if (err.errors && Object.keys(err.errors).length > 0) {
      const messages = Object.values(err.errors).flat();
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    return err.detail ? `${err.title}: ${err.detail}` : err.title;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
};
