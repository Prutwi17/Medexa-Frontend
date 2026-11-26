import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { emitAppError, normalizeApiError } from '@/lib/errorHandler';
import type { ApiResponse } from '@/types/api';
import type { AuthTokenResponse } from '@/types/auth';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mdx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

let inMemoryAccessToken: string | null = null;
let sessionRefreshedHandler: ((session: AuthTokenResponse) => void) | null = null;
let sessionExpiredHandler: (() => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function registerAuthBridge(handlers: {
  onRefreshed: (session: AuthTokenResponse) => void;
  onExpired: () => void;
}): void {
  sessionRefreshedHandler = handlers.onRefreshed;
  sessionExpiredHandler = handlers.onExpired;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const AUTH_NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/admin/login',
  '/auth/google',
  '/auth/refresh',
  '/auth/logout',
  '/auth/register/',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function shouldAttemptRefresh(url?: string): boolean {
  if (!url) return false;
  return !AUTH_NO_REFRESH_PATHS.some((path) => url.includes(path));
}

async function performSilentRefresh(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/refresh');
      const data = response.data.data;
      if (response.data.success && data?.accessToken) {
        inMemoryAccessToken = data.accessToken;
        sessionRefreshedHandler?.(data);
        return data.accessToken;
      }
      inMemoryAccessToken = null;
      sessionExpiredHandler?.();
      return null;
    } catch {
      inMemoryAccessToken = null;
      sessionExpiredHandler?.();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers.get('X-Correlation-Id')) {
    config.headers.set('X-Correlation-Id', generateCorrelationId());
  }
  if (inMemoryAccessToken && !config.headers.get('Authorization')) {
    config.headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }
  return config;
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
      const originalRequest = error.config as RetryableRequestConfig;
      if (!originalRequest._retry && shouldAttemptRefresh(originalRequest.url)) {
        originalRequest._retry = true;
        const freshToken = await performSilentRefresh();
        if (freshToken) {
          originalRequest.headers.set('Authorization', `Bearer ${freshToken}`);
          return apiClient(originalRequest);
        }
      }
    }

    const normalized = normalizeApiError(error);
    if (normalized.status >= 500 || normalized.isNetworkError) {
      emitAppError(normalized);
    }
    return Promise.reject(normalized);
  }
);

export async function unwrapApiResponse<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise;
  if (!response.data.success || response.data.data === null) {
    throw new Error(response.data.error?.message || response.data.message || 'Empty API payload');
  }
  return response.data.data;
}
