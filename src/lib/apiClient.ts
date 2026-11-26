import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { emitAppError, normalizeApiError } from '@/lib/errorHandler';
import type { ApiResponse } from '@/types/api';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mdx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers.get('X-Correlation-Id')) {
    config.headers.set('X-Correlation-Id', generateCorrelationId());
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
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
