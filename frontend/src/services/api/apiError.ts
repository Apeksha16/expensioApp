import type { ApiErrorOptions } from '../../types/api';

/**
 * Custom API Error containing HTTP status, request correlation ID, and backend code.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly data?: unknown;
  readonly isNetworkError: boolean;
  readonly retryAfterSeconds?: number;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.data = options.data;
    this.isNetworkError = options.isNetworkError ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}
