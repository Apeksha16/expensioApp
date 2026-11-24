import { ENV } from '../../config/env';
import { clearSession, readSession, writeSession, type StoredSession } from '../../core/storage/session';
import type { ApiErrorOptions, ApiResponse, AuthTokens } from '../../types/api';

/**
 * Custom API Error containing HTTP status, request correlation ID, and backend code.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly data?: unknown;
  readonly isNetworkError: boolean;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.data = options.data;
    this.isNetworkError = options.isNetworkError ?? false;
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  timeoutMs?: number;
}

interface InternalRequestOptions extends RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  retryCount?: number;
}

/**
 * ApiClient
 * Solely responsible for backend connection build-up, request lifecycle,
 * token injection, 401 refresh-token rotation, timeouts, and error normalization.
 */
export class ApiClient {
  private readonly customBaseUrl?: string;
  private readonly defaultTimeoutMs: number;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl?: string, defaultTimeoutMs?: number) {
    this.customBaseUrl = baseUrl;
    this.defaultTimeoutMs = defaultTimeoutMs || ENV.TIMEOUT_MS;
  }

  /**
   * Retrieves the current base URL dynamically from ENV.
   */
  getBaseUrl(): string {
    return (this.customBaseUrl || ENV.API_BASE_URL).replace(/\/+$/, '');
  }

  /**
   * Core request dispatcher
   */
  async request<T>(endpoint: string, options: InternalRequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      requiresAuth = true,
      timeoutMs = this.defaultTimeoutMs,
      retryCount = 0,
    } = options;

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.getBaseUrl()}${cleanEndpoint}`;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      ...customHeaders,
    };

    // Auto-inject Bearer Token when authentication is required
    if (requiresAuth && !headers.Authorization) {
      const session = await readSession();
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (ENV.ENABLE_NETWORK_LOGS) {
      console.log(`[ApiClient] 🚀 ${method} ${url}`, { headers, body });
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
      const isAbort = (err as { name?: string })?.name === 'AbortError';
      const message = isAbort
        ? 'Request timed out. Please check your internet connection and try again.'
        : 'Unable to connect. Please check your internet connection and try again.';

      if (ENV.ENABLE_NETWORK_LOGS) {
        console.warn(`[ApiClient] ❌ Connection error on ${method} ${url}:`, err);
      }

      throw new ApiError({
        message,
        status: isAbort ? 408 : 0,
        requestId,
        isNetworkError: true,
      });
    } finally {
      clearTimeout(timer);
    }

    // Automatic Token Refresh on 401 Unauthorized (Single retry guarded)
    if (response.status === 401 && requiresAuth && retryCount === 0) {
      if (ENV.ENABLE_NETWORK_LOGS) {
        console.log(`[ApiClient] 🔄 401 received on ${url}. Refreshing access token...`);
      }

      const refreshedToken = await this.refreshTokenFlow();
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
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (ENV.ENABLE_NETWORK_LOGS) {
      console.log(`[ApiClient] 📥 ${response.status} ${method} ${url}`, json);
    }

    if (!response.ok) {
      const errorPayload = json as { message?: string; error?: string; code?: string; data?: unknown } | null;
      const message =
        errorPayload?.message ||
        errorPayload?.error ||
        `Request failed with HTTP status ${response.status}`;

      if (ENV.ENABLE_NETWORK_LOGS) {
        console.warn(`[ApiClient] ❌ ${response.status} ${method} ${url}:`, {
          error: message,
          payload: json,
        });
      }

      throw new ApiError({
        message,
        status: response.status,
        code: errorPayload?.code,
        requestId,
        data: errorPayload?.data,
      });
    }

    return (json as ApiResponse<T>) ?? { success: true, message: 'OK', data: json as T };
  }

  /**
   * Thread-safe refresh token exchange with mutex promise to prevent concurrent refresh storms
   */
  private async refreshTokenFlow(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const session = await readSession();
        if (!session?.refreshToken) {
          await clearSession();
          return null;
        }

        const refreshRes = await fetch(`${this.getBaseUrl()}/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });

        if (!refreshRes.ok) {
          await clearSession();
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
        await clearSession();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ---------------------------------------------------------------------------
  // Convenience HTTP Methods
  // ---------------------------------------------------------------------------

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
