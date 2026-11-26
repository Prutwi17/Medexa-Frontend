import { apiClient, unwrapApiResponse } from '@/lib/apiClient';
import type { ApiResponse, PageMeta } from '@/types/api';
import type { PublicMedicine } from '@/types/catalog';
import type {
  CartSummary,
  ClassificationRule,
  CustomerAddress,
  CustomerProfile,
  DeliveryZoneCheck,
  DispatchEligibility,
  Prescription,
  PrescriptionStatus,
  StorefrontHomeData,
  WishlistEntry,
} from '@/types/storefront';

export interface PagedItems<T> {
  items: T[];
  pagination?: PageMeta;
}

async function unwrapPaged<T>(promise: Promise<{ data: ApiResponse<T[]> }>): Promise<PagedItems<T>> {
  const res = await promise;
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || res.data.message || 'Failed to fetch data');
  }
  return {
    items: res.data.data,
    pagination: res.data.meta?.pagination,
  };
}

export const storefrontApi = {
  // Public Storefront & Compliance
  getHomeData: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<StorefrontHomeData>>('/public/storefront/home')),

  listClassificationRules: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<ClassificationRule[]>>('/public/medicines/classifications')),

  checkPostalDelivery: (postalCode: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<DeliveryZoneCheck>>('/public/delivery-zones/check', {
        params: { postalCode },
      })
    ),

  // Customer Profile
  getCustomerProfile: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<CustomerProfile>>('/customer/profile')),

  updateCustomerProfile: (payload: {
    fullName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    allergies?: string;
    chronicConditions?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    preferredLanguage?: string;
  }) => unwrapApiResponse(apiClient.put<ApiResponse<CustomerProfile>>('/customer/profile', payload)),

  // Recently Viewed
  listRecentlyViewed: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<PublicMedicine[]>>('/customer/recently-viewed')),

  // Addresses
  listAddresses: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<CustomerAddress[]>>('/customer/addresses')),

  addAddress: (payload: {
    label: string;
    recipientName: string;
    recipientPhone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    defaultAddress?: boolean;
  }) => unwrapApiResponse(apiClient.post<ApiResponse<CustomerAddress>>('/customer/addresses', payload)),

  updateAddress: (
    addressId: number,
    payload: {
      label: string;
      recipientName: string;
      recipientPhone: string;
      addressLine1: string;
      addressLine2?: string;
      landmark?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
      defaultAddress?: boolean;
    }
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<CustomerAddress>>(`/customer/addresses/${addressId}`, payload)
    ),

  setDefaultAddress: (addressId: number) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<CustomerAddress>>(`/customer/addresses/${addressId}/default`)
    ),

  deleteAddress: (addressId: number) =>
    apiClient.delete<ApiResponse<null>>(`/customer/addresses/${addressId}`),

  // Prescriptions (Customer)
  uploadPrescription: (
    file: File,
    meta: {
      pharmacyId?: number;
      patientName: string;
      patientAge?: number;
      doctorName: string;
      doctorRegistrationNumber?: string;
      clinicName?: string;
      issuedDate?: string;
      validUntil?: string;
      notes?: string;
    }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    const params: Record<string, string | number> = {
      patientName: meta.patientName,
      doctorName: meta.doctorName,
    };
    if (meta.pharmacyId) params.pharmacyId = meta.pharmacyId;
    if (meta.patientAge !== undefined) params.patientAge = meta.patientAge;
    if (meta.doctorRegistrationNumber) params.doctorRegistrationNumber = meta.doctorRegistrationNumber;
    if (meta.clinicName) params.clinicName = meta.clinicName;
    if (meta.issuedDate) params.issuedDate = meta.issuedDate;
    if (meta.validUntil) params.validUntil = meta.validUntil;
    if (meta.notes) params.notes = meta.notes;

    return unwrapApiResponse(
      apiClient.post<ApiResponse<Prescription>>('/customer/prescriptions', formData, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  listCustomerPrescriptions: (params?: { status?: PrescriptionStatus; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<Prescription[]>>('/customer/prescriptions', { params })),

  getCustomerPrescription: (prescriptionId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<Prescription>>(`/customer/prescriptions/${prescriptionId}`)),

  cancelCustomerPrescription: (prescriptionId: number) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<Prescription>>(`/customer/prescriptions/${prescriptionId}/cancel`)
    ),

  validateDispatchEligibility: (payload: { medicineId: number; prescriptionId?: number }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<DispatchEligibility>>('/customer/prescriptions/validate-dispatch', payload)
    ),

  fetchCustomerPrescriptionBlob: async (prescriptionId: number): Promise<Blob> => {
    const res = await apiClient.get<Blob>(`/customer/prescriptions/${prescriptionId}/document`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Prescriptions (Pharmacy)
  listPharmacyPrescriptions: (params?: { status?: PrescriptionStatus; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<Prescription[]>>('/pharmacy/prescriptions', { params })),

  getPharmacyPrescription: (prescriptionId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<Prescription>>(`/pharmacy/prescriptions/${prescriptionId}`)),

  reviewPharmacyPrescription: (
    prescriptionId: number,
    payload: {
      approved: boolean;
      rejectionReason?: string;
      reviewNotes?: string;
      validUntilOverride?: string;
    }
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<Prescription>>(`/pharmacy/prescriptions/${prescriptionId}/review`, payload)
    ),

  fetchPharmacyPrescriptionBlob: async (prescriptionId: number): Promise<Blob> => {
    const res = await apiClient.get<Blob>(`/pharmacy/prescriptions/${prescriptionId}/document`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Cart
  getCart: (addressId?: number) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<CartSummary>>('/customer/cart', {
        params: addressId ? { addressId } : undefined,
      })
    ),

  addToCart: (
    payload: { medicineId: number; quantity: number; prescriptionId?: number },
    addressId?: number
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<CartSummary>>('/customer/cart/items', payload, {
        params: addressId ? { addressId } : undefined,
      })
    ),

  updateCartItem: (
    cartItemId: number,
    payload: { quantity: number; prescriptionId?: number; clearPrescription?: boolean },
    addressId?: number
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<CartSummary>>(`/customer/cart/items/${cartItemId}`, payload, {
        params: addressId ? { addressId } : undefined,
      })
    ),

  removeCartItem: (cartItemId: number, addressId?: number) =>
    unwrapApiResponse(
      apiClient.delete<ApiResponse<CartSummary>>(`/customer/cart/items/${cartItemId}`, {
        params: addressId ? { addressId } : undefined,
      })
    ),

  clearCart: () => unwrapApiResponse(apiClient.delete<ApiResponse<CartSummary>>('/customer/cart')),

  // Wishlist
  listWishlist: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<WishlistEntry[]>>('/customer/wishlist')),

  addToWishlist: (medicineId: number) =>
    unwrapApiResponse(apiClient.post<ApiResponse<WishlistEntry>>(`/customer/wishlist/${medicineId}`)),

  removeFromWishlist: (medicineId: number) =>
    apiClient.delete<ApiResponse<null>>(`/customer/wishlist/${medicineId}`),
};
