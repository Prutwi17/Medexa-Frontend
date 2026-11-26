import type { Category, PublicMedicine, PublicPharmacy } from '@/types/catalog';

export type PrescriptionStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface ClassificationRule {
  classificationCode: string;
  displayName: string;
  prescriptionRequired: boolean;
  defaultRxValidityDays: number;
  maxUnitsPerOrder: number;
  autoSubstitutionAllowed: boolean;
  requiresPharmacistLicenseCheck: boolean;
  warningText?: string | null;
  active: boolean;
}

export interface StorefrontHomeData {
  categories: Category[];
  popularMedicines: PublicMedicine[];
  wellnessMedicines: PublicMedicine[];
  recentMedicines: PublicMedicine[];
  verifiedPharmacies: PublicPharmacy[];
}

export interface CustomerProfile {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  emailVerified: boolean;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  preferredLanguage: string;
  updatedAt?: string | null;
}

export interface ServiceablePharmacyZone {
  pharmacyId: number;
  pharmacyName: string;
  pharmacySlug: string;
  pharmacyCity: string;
  zoneName: string;
  postalCode: string;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryMinutes: number;
}

export interface DeliveryZoneCheck {
  postalCode: string;
  serviceable: boolean;
  pharmacyCount: number;
  zones: ServiceablePharmacyZone[];
}

export interface CustomerAddress {
  id: number;
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  defaultAddress: boolean;
  serviceable: boolean;
  serviceablePharmacyCount: number;
  serviceableZones: ServiceablePharmacyZone[];
}

export interface PrescriptionAuditEntry {
  id: number;
  actorRole: string;
  actorName: string;
  action: string;
  previousStatus?: PrescriptionStatus | null;
  newStatus?: PrescriptionStatus | null;
  notes?: string | null;
  createdAt: string;
}

export interface PrescriptionOrderLink {
  id: number;
  orderId?: number | null;
  orderReference?: string | null;
  medicineId: number;
  medicineName: string;
  pharmacyId: number;
  verificationStatus: string;
  verifiedAt: string;
}

export interface Prescription {
  id: number;
  referenceCode: string;
  customerId: number;
  customerName: string;
  pharmacyId?: number | null;
  pharmacyName?: string | null;
  patientName: string;
  patientAge?: number | null;
  doctorName: string;
  doctorRegistrationNumber?: string | null;
  clinicName?: string | null;
  issuedDate: string;
  validUntil: string;
  expired: boolean;
  originalFilename: string;
  contentType: string;
  fileSizeBytes: number;
  notes?: string | null;
  status: PrescriptionStatus;
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  reviewedByPharmacyId?: number | null;
  reviewedByPharmacyName?: string | null;
  pharmacistName?: string | null;
  pharmacistRegistrationNumber?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  auditHistory: PrescriptionAuditEntry[];
  orderLinks: PrescriptionOrderLink[];
}

export interface DispatchEligibility {
  eligible: boolean;
  prescriptionRequired: boolean;
  classificationCode: string;
  autoSubstitutionAllowed: boolean;
  prescriptionId?: number | null;
  prescriptionReference?: string | null;
  prescriptionStatus?: PrescriptionStatus | null;
  prescriptionValidUntil?: string | null;
  reason: string;
}

export interface CartItem {
  cartItemId: number;
  medicineId: number;
  medicineName: string;
  medicineSlug: string;
  brand: string;
  packSize: string;
  primaryImageUrl?: string | null;
  quantity: number;
  availableStock: number;
  inStock: boolean;
  maxUnitsPerOrder: number;
  mrpPrice: number;
  unitPrice: number;
  lineTotal: number;
  prescriptionRequired: boolean;
  classificationCode: string;
  prescriptionId?: number | null;
  prescriptionReference?: string | null;
  prescriptionStatus?: PrescriptionStatus | null;
  dispatchEligible: boolean;
  blockerMessage?: string | null;
}

export interface PharmacyCartGroup {
  pharmacyId: number;
  pharmacyName: string;
  pharmacySlug: string;
  pharmacyCity: string;
  items: CartItem[];
  itemsSubtotal: number;
  deliverableToSelectedAddress?: boolean | null;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryMinutes?: number | null;
  estimatedGroupTotal: number;
  readyForCheckout: boolean;
  groupBlockers: string[];
}

export interface CartSummary {
  selectedAddressId?: number | null;
  selectedPostalCode?: string | null;
  totalItemCount: number;
  pharmacyCount: number;
  itemsSubtotal: number;
  totalDeliveryFee: number;
  grandTotal: number;
  readyForCheckout: boolean;
  checkoutBlockers: string[];
  pharmacyGroups: PharmacyCartGroup[];
}

export interface WishlistEntry {
  wishlistItemId: number;
  savedAt: string;
  medicine: PublicMedicine;
}
