import type { AccountStatus } from '@/types/auth';

export type VerificationStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type MedicineApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type StockMovementType =
  | 'BATCH_ADDED'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RESERVED'
  | 'RELEASED'
  | 'DISPATCHED'
  | 'EXPIRED_WRITE_OFF';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  active: boolean;
}

export interface DeliveryZone {
  id: number;
  zoneName: string;
  postalCode: string;
  city: string;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryMinutes: number;
  active: boolean;
}

export interface PharmacyLicense {
  id: number;
  licenseNumber: string;
  issuingAuthority: string;
  pharmacistName: string;
  pharmacistRegistrationNumber: string;
  expiryDate: string;
  documentUrl?: string | null;
  verificationStatus: VerificationStatus;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

export interface PharmacyProfile {
  id: number;
  userId: number;
  ownerName: string;
  ownerEmail: string;
  accountStatus: AccountStatus;
  pharmacyName: string;
  slug: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  acceptingOrders: boolean;
  verifiedAt?: string | null;
  licenses: PharmacyLicense[];
  deliveryZones: DeliveryZone[];
}

export interface PublicPharmacy {
  id: number;
  pharmacyName: string;
  slug: string;
  city: string;
  state: string;
  postalCode: string;
  acceptingOrders: boolean;
  deliveryZones: DeliveryZone[];
}

export interface MedicineImage {
  id: number;
  imageUrl: string;
  altText?: string | null;
  primaryImage: boolean;
  displayOrder: number;
}

export interface PharmacyMedicine {
  id: number;
  categoryId: number;
  categoryName: string;
  pharmacyId: number;
  pharmacyName: string;
  name: string;
  slug: string;
  brand: string;
  manufacturer: string;
  composition: string;
  dosageForm: string;
  packSize: string;
  description?: string | null;
  mrpPrice: number;
  sellingPrice: number;
  prescriptionRequired: boolean;
  approvalStatus: MedicineApprovalStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  active: boolean;
  totalAvailableQuantity: number;
  images: MedicineImage[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicMedicine {
  id: number;
  name: string;
  slug: string;
  brand: string;
  manufacturer: string;
  composition: string;
  dosageForm: string;
  packSize: string;
  description?: string | null;
  mrpPrice: number;
  sellingPrice: number;
  prescriptionRequired: boolean;
  classificationCode?: string;
  classificationDisplayName?: string;
  autoSubstitutionAllowed?: boolean;
  maxUnitsPerOrder?: number;
  classificationWarning?: string | null;
  inStock: boolean;
  availableQuantity: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  pharmacyId: number;
  pharmacyName: string;
  pharmacySlug: string;
  pharmacyCity: string;
  primaryImageUrl?: string | null;
  images: MedicineImage[];
}

export interface MedicineBatch {
  id: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  expired: boolean;
  initialQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  active: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: number;
  medicineId: number;
  medicineName: string;
  batchId: number;
  batchNumber: string;
  movementType: StockMovementType;
  quantityDelta: number;
  balanceAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdAt: string;
}
