import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapApiResponse } from '@/lib/apiClient';
import type { ApiResponse, HealthStatusResponse } from '@/types/api';

export function useHealthCheck() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => unwrapApiResponse(apiClient.get<ApiResponse<HealthStatusResponse>>('/health')),
    retry: false,
    staleTime: 60_000,
  });
}
