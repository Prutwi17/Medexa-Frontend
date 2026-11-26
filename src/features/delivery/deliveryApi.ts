import { apiClient, unwrapApiResponse } from '@/lib/apiClient';
import type { ApiResponse, PageMeta } from '@/types/api';
import type {
  AdminDelivery,
  CustomerTracking,
  DeliveryStatus,
  RiderAvailabilityStatus,
  RiderDelivery,
  RiderDeliveryZone,
  RiderEarningsSummary,
  RiderProfile,
  VehicleType,
  VerificationStatus,
} from '@/types/delivery';

async function unwrapPagedList<T>(promise: Promise<{ data: ApiResponse<T[]> }>): Promise<{
  items: T[];
  pagination?: PageMeta;
}> {
  const res = await promise;
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || res.data.message || 'Failed to fetch data');
  }
  return {
    items: res.data.data,
    pagination: res.data.meta?.pagination,
  };
}

export const deliveryApi = {
  // Rider Profile & Zones
  getRiderProfile: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<RiderProfile>>('/rider/profile')),

  updateRiderProfile: (payload: {
    phoneNumber: string;
    vehicleType: VehicleType;
    vehicleRegistrationNumber: string;
    vehicleModel?: string;
    serviceCity: string;
    identityDocumentType?: string;
    identityDocumentNumber?: string;
    drivingLicenseNumber: string;
    drivingLicenseExpiry?: string;
    currentLatitude?: number;
    currentLongitude?: number;
    maxConcurrentDeliveries?: number;
  }) =>
    unwrapApiResponse(apiClient.put<ApiResponse<RiderProfile>>('/rider/profile', payload)),

  uploadRiderDocument: (docType: 'IDENTITY' | 'DRIVING_LICENSE', file: File) => {
    const formData = new FormData();
    formData.append('docType', docType);
    formData.append('file', file);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<RiderProfile>>('/rider/profile/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  fetchRiderOwnDocumentBlob: async (docType: 'IDENTITY' | 'DRIVING_LICENSE') => {
    const res = await apiClient.get<Blob>(`/rider/profile/documents/${docType}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  updateRiderAvailability: (payload: {
    availabilityStatus: RiderAvailabilityStatus;
    currentLatitude?: number;
    currentLongitude?: number;
  }) =>
    unwrapApiResponse(apiClient.patch<ApiResponse<RiderProfile>>('/rider/availability', payload)),

  updateRiderLocation: (payload: { latitude: number; longitude: number }) =>
    unwrapApiResponse(apiClient.patch<ApiResponse<RiderProfile>>('/rider/location', payload)),

  listRiderZones: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<RiderDeliveryZone[]>>('/rider/delivery-zones')),

  addRiderZone: (payload: {
    zoneName: string;
    city: string;
    postalCode: string;
    priorityOrder?: number;
    active?: boolean;
  }) =>
    unwrapApiResponse(apiClient.post<ApiResponse<RiderDeliveryZone>>('/rider/delivery-zones', payload)),

  toggleRiderZone: (zoneId: number, active: boolean) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<RiderDeliveryZone>>(`/rider/delivery-zones/${zoneId}/status`, { active })
    ),

  deleteRiderZone: (zoneId: number) =>
    unwrapApiResponse(apiClient.delete<ApiResponse<void>>(`/rider/delivery-zones/${zoneId}`)),

  getRiderEarnings: (params?: { page?: number; size?: number }) =>
    unwrapApiResponse(apiClient.get<ApiResponse<RiderEarningsSummary>>('/rider/earnings', { params })),

  // Rider Deliveries
  listActiveDeliveries: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<RiderDelivery[]>>('/rider/deliveries/active')),

  listRiderDeliveryHistory: (params?: { status?: DeliveryStatus; page?: number; size?: number }) =>
    unwrapPagedList<RiderDelivery>(apiClient.get<ApiResponse<RiderDelivery[]>>('/rider/deliveries', { params })),

  getRiderDelivery: (deliveryId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<RiderDelivery>>(`/rider/deliveries/${deliveryId}`)),

  decideAssignment: (deliveryId: number, payload: { accepted: boolean; reason?: string }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RiderDelivery>>(`/rider/deliveries/${deliveryId}/decision`, payload)
    ),

  confirmPickup: (deliveryId: number, notes?: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RiderDelivery>>(`/rider/deliveries/${deliveryId}/pickup`, notes ? { notes } : {})
    ),

  markOutForDelivery: (deliveryId: number, loc?: { latitude: number; longitude: number }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RiderDelivery>>(
        `/rider/deliveries/${deliveryId}/out-for-delivery`,
        loc ?? {}
      )
    ),

  updateDeliveryLocation: (deliveryId: number, loc: { latitude: number; longitude: number }) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<RiderDelivery>>(`/rider/deliveries/${deliveryId}/location`, loc)
    ),

  uploadDeliveryProof: (deliveryId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<RiderDelivery>>(`/rider/deliveries/${deliveryId}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  completeDeliveryWithOtp: (
    deliveryId: number,
    payload: { otp: string; recipientName?: string; notes?: string }
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RiderDelivery>>(`/rider/deliveries/${deliveryId}/complete`, payload)
    ),

  reportDeliveryFailure: (deliveryId: number, reason: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RiderDelivery>>(`/rider/deliveries/${deliveryId}/fail`, { reason })
    ),

  // Customer Order & Delivery Tracking
  getCustomerTracking: (orderId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<CustomerTracking>>(`/customer/orders/${orderId}/tracking`)),

  regenerateCustomerOtp: (orderId: number) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<CustomerTracking>>(`/customer/orders/${orderId}/tracking/regenerate-otp`)
    ),

  fetchCustomerProofBlob: async (orderId: number) => {
    const res = await apiClient.get<Blob>(`/customer/orders/${orderId}/tracking/proof`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Admin Riders & Delivery Oversight
  listAdminRiders: (params?: {
    status?: VerificationStatus;
    availabilityStatus?: RiderAvailabilityStatus;
    city?: string;
    q?: string;
    page?: number;
    size?: number;
  }) => unwrapPagedList<RiderProfile>(apiClient.get<ApiResponse<RiderProfile[]>>('/admin/riders', { params })),

  verifyAdminRider: (
    riderId: number,
    payload: {
      approved: boolean;
      notes?: string;
      baseFeePerDelivery?: number;
      maxConcurrentDeliveries?: number;
    }
  ) =>
    unwrapApiResponse(apiClient.post<ApiResponse<RiderProfile>>(`/admin/riders/${riderId}/verify`, payload)),

  updateAdminRiderStatus: (riderId: number, payload: { suspended: boolean; reason?: string }) =>
    unwrapApiResponse(apiClient.patch<ApiResponse<RiderProfile>>(`/admin/riders/${riderId}/status`, payload)),

  fetchAdminRiderDocBlob: async (riderId: number, docType: 'IDENTITY' | 'DRIVING_LICENSE') => {
    const res = await apiClient.get<Blob>(`/admin/riders/${riderId}/documents/${docType}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  listAdminDeliveries: (params?: {
    status?: DeliveryStatus;
    riderId?: number;
    exceptionsOnly?: boolean;
    q?: string;
    page?: number;
    size?: number;
  }) =>
    unwrapPagedList<AdminDelivery>(apiClient.get<ApiResponse<AdminDelivery[]>>('/admin/deliveries', { params })),

  getAdminDelivery: (deliveryId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<AdminDelivery>>(`/admin/deliveries/${deliveryId}`)),

  assignSpecificRider: (deliveryId: number, payload: { riderId: number; notes?: string }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminDelivery>>(`/admin/deliveries/${deliveryId}/assign`, payload)
    ),

  retryAutoAssignment: (deliveryId: number) =>
    unwrapApiResponse(apiClient.post<ApiResponse<AdminDelivery>>(`/admin/deliveries/${deliveryId}/retry-auto`)),

  sweepAssignmentTimeouts: () =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<{ reassignedCount: number }>>('/admin/deliveries/sweep-timeouts')
    ),

  fetchAdminProofBlob: async (deliveryId: number) => {
    const res = await apiClient.get<Blob>(`/admin/deliveries/${deliveryId}/proof`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
