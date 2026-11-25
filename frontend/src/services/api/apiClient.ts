import { ENV } from '../../config/env';
import { clearSession, readSession, writeSession, type StoredSession } from '../../core/storage/session';
import type { ApiResponse, AuthTokens } from '../../types/api';
import { parseRetryAfterHeader } from '../../utils/errorNormalization';
import { logger } from '../../utils/logger';
import { ApiError } from './apiError';

export { ApiError };

export interface RequestOptions {
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

interface InternalRequestOptions extends RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  retryCount?: number;
}

/**
 * ApiClient
 * Solely responsible for backend connection build-up, request lifecycle,
 * token injection, single-flight 401 refresh-token rotation, timeouts,
 * Retry-After handling, request cancellation on logout, and redacted dev logging.
 */
export class ApiClient {
  private readonly customBaseUrl?: string;
  private readonly defaultTimeoutMs: number;
  private refreshPromise: Promise<string | null> | null = null;
  private unauthorizedListeners = new Set<() => void>();
  private activeControllers = new Set<AbortController>();
  private sessionGeneration = 0;

  constructor(baseUrl?: string, defaultTimeoutMs?: number) {
    this.customBaseUrl = baseUrl;
    this.defaultTimeoutMs = defaultTimeoutMs || ENV.TIMEOUT_MS;
  }

  onUnauthorized(listener: () => void): () => void {
    this.unauthorizedListeners.add(listener);
    return () => {
      this.unauthorizedListeners.delete(listener);
    };
  }

  /**
   * Aborts all in-flight requests and bumps the session generation so
   * stale refresh promises or queued retries never restore an old session.
   */
  cancelAllRequests(): void {
    this.sessionGeneration += 1;
    this.refreshPromise = null;
    for (const controller of this.activeControllers) {
      try {
        controller.abort();
      } catch {
        // Ignore abort errors
      }
    }
    this.activeControllers.clear();
  }

  private notifyUnauthorized(): void {
    for (const listener of this.unauthorizedListeners) {
      try {
        listener();
      } catch {
        // Ignore listener errors
      }
    }
  }

  getBaseUrl(): string {
    return (this.customBaseUrl || ENV.API_BASE_URL).replace(/\/+$/, '');
  }

  async request<T>(endpoint: string, options: InternalRequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      requiresAuth = true,
      timeoutMs = this.defaultTimeoutMs,
      signal: externalSignal,
      retryCount = 0,
    } = options;

    if (externalSignal?.aborted) {
      const abortErr = new Error('Request cancelled');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    const generationAtStart = this.sessionGeneration;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.getBaseUrl()}${cleanEndpoint}`;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      ...customHeaders,
    };

    if (requiresAuth && !headers.Authorization) {
      const session = await readSession();
      if (this.sessionGeneration !== generationAtStart) {
        const abortErr = new Error('Request cancelled');
        abortErr.name = 'AbortError';
        throw abortErr;
      }
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }

    const controller = new AbortController();
    this.activeControllers.add(controller);
    let timedOut = false;
    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    if (ENV.ENABLE_NETWORK_LOGS) {
      const sanitizedHeaders = {
        ...headers,
        ...(headers.Authorization ? { Authorization: 'Bearer [REDACTED]' } : {}),
      };
      logger.debug(`[ApiClient] -> ${method} ${url}`, { headers: sanitizedHeaders, body });
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      this.activeControllers.delete(controller);
      externalSignal?.removeEventListener('abort', onExternalAbort);
      const isAbort = (err as { name?: string })?.name === 'AbortError';
      if (isAbort && !timedOut && (externalSignal?.aborted || this.sessionGeneration !== generationAtStart)) {
        const cancelErr = new Error('Request cancelled');
        cancelErr.name = 'AbortError';
        throw cancelErr;
      }
      const message = isAbort
        ? 'Request timed out. Please check your internet connection and try again.'
        : 'Unable to connect. Please check your internet connection and try again.';

      if (ENV.ENABLE_NETWORK_LOGS) {
        logger.warn(`[ApiClient] Connection error on ${method} ${url}`, { status: isAbort ? 408 : 0 });
      }

      throw new ApiError({
        message,
        status: isAbort ? 408 : 0,
        requestId,
        isNetworkError: true,
      });
    } finally {
      clearTimeout(timer);
      this.activeControllers.delete(controller);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }

    if (this.sessionGeneration !== generationAtStart) {
      const cancelErr = new Error('Request cancelled');
      cancelErr.name = 'AbortError';
      throw cancelErr;
    }

    // Automatic single-flight Token Refresh on 401 Unauthorized
    if (response.status === 401 && requiresAuth && retryCount === 0) {
      if (ENV.ENABLE_NETWORK_LOGS) {
        logger.debug(`[ApiClient] 401 received on ${url}. Refreshing access token...`);
      }

      const refreshedToken = await this.refreshTokenFlow(generationAtStart);
      if (this.sessionGeneration !== generationAtStart) {
        const cancelErr = new Error('Request cancelled');
        cancelErr.name = 'AbortError';
        throw cancelErr;
      }
      if (refreshedToken) {
        return this.request<T>(endpoint, {
          ...options,
          headers: {
            ...customHeaders,
            Authorization: `Bearer ${refreshedToken}`,
          },
          retryCount: retryCount + 1,
        });
      }
      this.notifyUnauthorized();
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (ENV.ENABLE_NETWORK_LOGS) {
      logger.debug(`[ApiClient] <- ${response.status} ${method} ${url}`, json);
    }

    if (!response.ok) {
      const errorPayload = json as { message?: string; error?: string; code?: string; data?: unknown } | null;
      const retryAfterSeconds = response.status === 429
        ? parseRetryAfterHeader(response.headers?.get?.('Retry-After'))
        : undefined;
      const message =
        errorPayload?.message ||
        errorPayload?.error ||
        `Request failed with HTTP status ${response.status}`;

      if (ENV.ENABLE_NETWORK_LOGS) {
        logger.warn(`[ApiClient] ${response.status} ${method} ${url}`, {
          error: message,
          code: errorPayload?.code,
        });
      }

      throw new ApiError({
        message,
        status: response.status,
        code: errorPayload?.code,
        requestId,
        data: errorPayload?.data,
        retryAfterSeconds,
      });
    }

    return (json as ApiResponse<T>) ?? { success: true, message: 'OK', data: json as T };
  }

  /**
   * Single-flight refresh token rotation.
   * Only clears the stored session when the server rejects the refresh token
   * (or none exists), preserving session if a transient network error occurred.
   */
  private async refreshTokenFlow(generationAtStart: number): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const session = await readSession();
        if (this.sessionGeneration !== generationAtStart) return null;
        if (!session?.refreshToken) {
          await clearSession();
          return null;
        }

        const controller = new AbortController();
        this.activeControllers.add(controller);
        const timer = setTimeout(() => controller.abort(), this.defaultTimeoutMs);
        let refreshRes: Response;
        try {
          refreshRes = await fetch(`${this.getBaseUrl()}/v1/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ refreshToken: session.refreshToken }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
          this.activeControllers.delete(controller);
        }

        if (this.sessionGeneration !== generationAtStart) return null;

        if (!refreshRes.ok) {
          if (refreshRes.status === 400 || refreshRes.status === 401 || refreshRes.status === 403) {
            await clearSession();
          }
          return null;
        }

        const body = (await refreshRes.json()) as ApiResponse<AuthTokens>;
        const newAccess = body.data?.accessToken;
        const newRefresh = body.data?.refreshToken ?? session.refreshToken;

        if (newAccess) {
          const updatedSession: StoredSession = {
            ...session,
            accessToken: newAccess,
            refreshToken: newRefresh,
          };
          await writeSession(updatedSession);
          return newAccess;
        }

        await clearSession();
        return null;
      } catch {
        // Do not wipe stored session on transient offline/timeout errors
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  delete<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }
}

export const apiClient = new ApiClient();
