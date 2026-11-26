export interface FieldValidationError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}

export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: FieldValidationError[];
}

export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ResponseMeta {
  timestamp: string;
  correlationId?: string;
  path?: string;
  pagination?: PageMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: ApiError | null;
  meta: ResponseMeta;
}

export interface HealthStatusResponse {
  status: string;
  service: string;
  timestamp: string;
}
