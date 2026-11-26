import { apiClient, unwrapApiResponse } from '@/lib/apiClient';
import type { ApiResponse, PageMeta } from '@/types/api';
import type {
  Category,
  DeliveryZone,
  MedicineApprovalStatus,
  MedicineBatch,
  MedicineImage,
  PharmacyLicense,
  PharmacyMedicine,
  PharmacyProfile,
  PublicMedicine,
  PublicPharmacy,
  StockMovement,
  StockMovementType,
  VerificationStatus,
} from '@/types/catalog';

export interface PagedResult<T> {
  items: T[];
  pagination?: PageMeta;
}

async function unwrapPaged<T>(promise: Promise<{ data: ApiResponse<T[]> }>): Promise<PagedResult<T>> {
  const res = await promise;
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || res.data.message || 'Failed to fetch list');
  }
  return {
    items: res.data.data,
    pagination: res.data.meta?.pagination,
  };
}

export interface MedicineSearchParams {
  q?: string;
  categoryId?: number;
  pharmacyId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  prescriptionRequired?: boolean;
  sort?: string;
  page?: number;
  size?: number;
}

export const catalogApi = {
  // Public
  listPublicCategories: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<Category[]>>('/public/categories')),

  searchPublicMedicines: (params: MedicineSearchParams) =>
    unwrapPaged(apiClient.get<ApiResponse<PublicMedicine[]>>('/public/medicines', { params })),

  getPublicMedicineBySlug: (slug: string) =>
    unwrapApiResponse(apiClient.get<ApiResponse<PublicMedicine>>(`/public/medicines/${encodeURIComponent(slug)}`)),

  listPublicPharmacies: (params: { q?: string; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<PublicPharmacy[]>>('/public/pharmacies', { params })),

  // Pharmacy Portal
  getPharmacyProfile: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<PharmacyProfile>>('/pharmacy/profile')),

  updatePharmacyProfile: (payload: {
    pharmacyName: string;
    contactPhone: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    acceptingOrders?: boolean;
  }) => unwrapApiResponse(apiClient.put<ApiResponse<PharmacyProfile>>('/pharmacy/profile', payload)),

  submitLicense: (payload: {
    licenseNumber: string;
    issuingAuthority: string;
    pharmacistName: string;
    pharmacistRegistrationNumber: string;
    expiryDate: string;
    documentUrl?: string;
  }) => unwrapApiResponse(apiClient.post<ApiResponse<PharmacyLicense>>('/pharmacy/licenses', payload)),

  uploadLicenseDocument: (licenseId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<PharmacyLicense>>(`/pharmacy/licenses/${licenseId}/document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  createDeliveryZone: (payload: {
    zoneName: string;
    postalCode: string;
    city: string;
    deliveryFee: number;
    minOrderAmount: number;
    estimatedDeliveryMinutes: number;
  }) => unwrapApiResponse(apiClient.post<ApiResponse<DeliveryZone>>('/pharmacy/delivery-zones', payload)),

  updateDeliveryZone: (
    zoneId: number,
    payload: {
      zoneName: string;
      postalCode: string;
      city: string;
      deliveryFee: number;
      minOrderAmount: number;
      estimatedDeliveryMinutes: number;
    }
  ) => unwrapApiResponse(apiClient.put<ApiResponse<DeliveryZone>>(`/pharmacy/delivery-zones/${zoneId}`, payload)),

  toggleDeliveryZoneStatus: (zoneId: number, active: boolean) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<DeliveryZone>>(`/pharmacy/delivery-zones/${zoneId}/status`, { active })
    ),

  deleteDeliveryZone: (zoneId: number) =>
    apiClient.delete<ApiResponse<null>>(`/pharmacy/delivery-zones/${zoneId}`),

  listPharmacyMedicines: (params: {
    status?: MedicineApprovalStatus;
    q?: string;
    page?: number;
    size?: number;
  }) => unwrapPaged(apiClient.get<ApiResponse<PharmacyMedicine[]>>('/pharmacy/medicines', { params })),

  createMedicine: (payload: {
    categoryId: number;
    name: string;
    brand: string;
    manufacturer: string;
    composition: string;
    dosageForm: string;
    packSize: string;
    description?: string;
    mrpPrice: number;
    sellingPrice: number;
    prescriptionRequired: boolean;
    active?: boolean;
  }) => unwrapApiResponse(apiClient.post<ApiResponse<PharmacyMedicine>>('/pharmacy/medicines', payload)),

  updateMedicine: (
    medicineId: number,
    payload: {
      categoryId: number;
      name: string;
      brand: string;
      manufacturer: string;
      composition: string;
      dosageForm: string;
      packSize: string;
      description?: string;
      mrpPrice: number;
      sellingPrice: number;
      prescriptionRequired: boolean;
      active?: boolean;
    }
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<PharmacyMedicine>>(`/pharmacy/medicines/${medicineId}`, payload)
    ),

  deleteMedicine: (medicineId: number) =>
    apiClient.delete<ApiResponse<null>>(`/pharmacy/medicines/${medicineId}`),

  uploadMedicineImage: (medicineId: number, file: File, primary: boolean, altText?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MedicineImage>>(`/pharmacy/medicines/${medicineId}/images`, formData, {
        params: { primary, altText },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  deleteMedicineImage: (medicineId: number, imageId: number) =>
    apiClient.delete<ApiResponse<null>>(`/pharmacy/medicines/${medicineId}/images/${imageId}`),

  listBatches: (params: { medicineId?: number; includeExpired?: boolean; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<MedicineBatch[]>>('/pharmacy/inventory/batches', { params })),

  getExpiryAlerts: (days = 60) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MedicineBatch[]>>('/pharmacy/inventory/expiry-alerts', { params: { days } })
    ),

  addBatch: (payload: {
    medicineId: number;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
  }) => unwrapApiResponse(apiClient.post<ApiResponse<MedicineBatch>>('/pharmacy/inventory/batches', payload)),

  adjustStock: (
    batchId: number,
    payload: { quantityDelta: number; movementType: StockMovementType; reason: string }
  ) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<MedicineBatch>>(`/pharmacy/inventory/batches/${batchId}/adjust`, payload)
    ),

  listStockMovements: (params: { medicineId?: number; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<StockMovement[]>>('/pharmacy/inventory/movements', { params })),

  // Admin Portal
  listAdminPharmacies: (params: { status?: VerificationStatus; q?: string; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<PharmacyProfile[]>>('/admin/pharmacies', { params })),

  verifyPharmacy: (pharmacyId: number, payload: { approved: boolean; notes?: string }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PharmacyProfile>>(`/admin/pharmacies/${pharmacyId}/verify`, payload)
    ),

  updatePharmacyStatus: (pharmacyId: number, payload: { suspended: boolean; reason?: string }) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<PharmacyProfile>>(`/admin/pharmacies/${pharmacyId}/status`, payload)
    ),

  listAdminMedicines: (params: { status?: MedicineApprovalStatus; q?: string; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<PharmacyMedicine[]>>('/admin/medicines', { params })),

  reviewMedicine: (medicineId: number, payload: { approved: boolean; rejectionReason?: string }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PharmacyMedicine>>(`/admin/medicines/${medicineId}/review`, payload)
    ),

  listAdminCategories: () =>
    unwrapApiResponse(apiClient.get<ApiResponse<Category[]>>('/admin/categories')),

  createCategory: (payload: {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    displayOrder?: number;
  }) => unwrapApiResponse(apiClient.post<ApiResponse<Category>>('/admin/categories', payload)),

  updateCategory: (
    categoryId: number,
    payload: {
      name: string;
      slug?: string;
      description?: string;
      imageUrl?: string;
      displayOrder?: number;
    }
  ) => unwrapApiResponse(apiClient.put<ApiResponse<Category>>(`/admin/categories/${categoryId}`, payload)),

  setCategoryStatus: (categoryId: number, active: boolean) =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<Category>>(`/admin/categories/${categoryId}/status`, { active })
    ),

  uploadCategoryImage: (categoryId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<Category>>(`/admin/categories/${categoryId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
};
