import axios from 'axios';
import type { ApiResponse, FieldValidationError } from '@/types/api';

export interface NormalizedAppError {
  status: number;
  code: string;
  message: string;
  correlationId?: string;
  fieldErrors: FieldValidationError[];
  isNetworkError: boolean;
}

type ErrorListener = (error: NormalizedAppError) => void;

const listeners = new Set<ErrorListener>();

export function subscribeAppErrors(listener: ErrorListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitAppError(error: NormalizedAppError): void {
  listeners.forEach((listener) => listener(error));
}

export function normalizeApiError(error: unknown): NormalizedAppError {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const headerCorrelationId = error.response?.headers?.['x-correlation-id'] as string | undefined;

    if (!error.response) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Unable to reach Medexa servers. Please check your internet connection and retry.',
        fieldErrors: [],
        isNetworkError: true,
      };
    }

    if (payload?.error) {
      return {
        status,
        code: payload.error.code || 'API_ERROR',
        message: payload.error.message || 'The request could not be completed.',
        correlationId: payload.meta?.correlationId ?? headerCorrelationId,
        fieldErrors: payload.error.fieldErrors ?? [],
        isNetworkError: false,
      };
    }

    return {
      status,
      code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'HTTP_ERROR',
      message: getDefaultStatusMessage(status),
      correlationId: headerCorrelationId,
      fieldErrors: [],
      isNetworkError: false,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      code: 'CLIENT_ERROR',
      message: error.message || 'An unexpected application error occurred.',
      fieldErrors: [],
      isNetworkError: false,
    };
  }

  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
    fieldErrors: [],
    isNetworkError: false,
  };
}

function getDefaultStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request parameters. Please check your input.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with the current record state.';
    case 422:
      return 'This action violates a platform business rule.';
    case 500:
    case 502:
    case 503:
      return 'Medexa service is temporarily unavailable. Please try again shortly.';
    default:
      return 'Request failed. Please try again.';
  }
}
