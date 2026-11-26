import type { DeliveryAssignmentStatus, OrderStatus, OrderStatusHistory } from '@/types/orders';

export type VerificationStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type RiderAvailabilityStatus = 'OFFLINE' | 'ONLINE' | 'ON_DELIVERY';
export type VehicleType = 'BICYCLE' | 'SCOOTER' | 'MOTORCYCLE' | 'CAR';

export type DeliveryStatus =
  | 'WAITING_FOR_RIDER'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'REASSIGNMENT_REQUIRED';

export type AssignmentAttemptStatus =
  | 'OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'TIMED_OUT'
  | 'REASSIGNED';

export type ProofType = 'OTP_VERIFIED' | 'PHOTO_AND_OTP' | 'ADMIN_RESOLVED';

export interface RiderDeliveryZone {
  id: number;
  zoneName: string;
  city: string;
  postalCode: string;
  priorityOrder: number;
  active: boolean;
}

export interface RiderProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  vehicleType: VehicleType;
  vehicleRegistrationNumber: string;
  vehicleModel?: string | null;
  drivingLicenseNumber: string;
  drivingLicenseExpiry?: string | null;
  hasDrivingLicenseDocument: boolean;
  identityDocumentType?: string | null;
  identityDocumentNumber?: string | null;
  hasIdentityDocument: boolean;
  serviceCity: string;
  verificationStatus: VerificationStatus;
  availabilityStatus: RiderAvailabilityStatus;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  locationUpdatedAt?: string | null;
  maxConcurrentDeliveries: number;
  baseFeePerDelivery: number;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  activeDeliveryCount: number;
  deliveryZones: RiderDeliveryZone[];
}

export interface RiderEarning {
  id: number;
  earningReference: string;
  deliveryId: number;
  deliveryReference: string;
  orderId: number;
  orderNumber: string;
  baseFee: number;
  distanceBonus: number;
  incentiveAmount: number;
  totalEarning: number;
  currency: string;
  status: 'ACCRUED' | 'PAYOUT_PENDING' | 'PAID';
  earnedAt: string;
}

export interface RiderEarningsSummary {
  dailyEarnings: number;
  monthlyEarnings: number;
  totalEarnings: number;
  todayDeliveries: number;
  monthDeliveries: number;
  totalDeliveries: number;
  recentEarnings: RiderEarning[];
}

export interface DeliveryEvent {
  id: number;
  eventType: string;
  previousStatus?: DeliveryStatus | null;
  newStatus: DeliveryStatus;
  actorRole: string;
  actorName: string;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface DeliveryAttempt {
  id: number;
  riderId: number;
  riderName: string;
  attemptNumber: number;
  status: AssignmentAttemptStatus;
  distanceKm: number;
  rankingScore: number;
  offeredAt: string;
  expiresAt?: string | null;
  respondedAt?: string | null;
  rejectionReason?: string | null;
}

export interface RiderDelivery {
  id: number;
  deliveryReference: string;
  orderId: number;
  orderNumber: string;
  status: DeliveryStatus;
  assignmentAttempts: number;
  assignedAt?: string | null;
  assignmentExpiresAt?: string | null;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  distanceKm: number;
  estimatedEarning: number;
  pickupPostalCode: string;
  dropPostalCode: string;
  pharmacyId: number;
  pharmacyName: string;
  pharmacyPhone: string;
  pharmacyAddress: string;
  pharmacyCity: string;
  pharmacyPostalCode: string;
  fullCustomerAddressRevealed: boolean;
  customerName: string;
  customerPhone?: string | null;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPostalCode: string;
  otpPendingVerification: boolean;
  otpAttemptsRemaining: number;
  otpExpiresAt?: string | null;
  proofType?: ProofType | null;
  hasDeliveryProof: boolean;
  deliveryNotes?: string | null;
  failureReason?: string | null;
  events: DeliveryEvent[];
}

export interface CustomerTracking {
  orderId: number;
  orderNumber: string;
  orderStatus: OrderStatus;
  deliveryAssignmentStatus: DeliveryAssignmentStatus;
  hasDelivery: boolean;
  deliveryId?: number | null;
  deliveryReference?: string | null;
  deliveryStatus?: DeliveryStatus | null;
  deliveryEtaMinutes?: number | null;
  distanceKm?: number | null;
  placedAt?: string | null;
  acceptedAt?: string | null;
  preparedAt?: string | null;
  readyAt?: string | null;
  assignedRiderName?: string | null;
  assignedRiderVehicleType?: VehicleType | null;
  assignedRiderVehicleNumber?: string | null;
  assignedRiderPhone?: string | null;
  riderLatitude?: number | null;
  riderLongitude?: number | null;
  riderLocationUpdatedAt?: string | null;
  deliveryOtp?: string | null;
  otpExpiresAt?: string | null;
  otpAttempts: number;
  maxOtpAttempts: number;
  otpInstructions: string;
  hasDeliveryProof: boolean;
  proofType?: ProofType | null;
  deliveredAt?: string | null;
  failureReason?: string | null;
  orderTimeline: OrderStatusHistory[];
  deliveryTimeline: DeliveryEvent[];
}

export interface AdminDelivery {
  id: number;
  deliveryReference: string;
  orderId: number;
  orderNumber: string;
  checkoutReference: string;
  orderStatus: OrderStatus;
  pharmacyId: number;
  pharmacyName: string;
  pharmacyPostalCode: string;
  customerId: number;
  customerName: string;
  dropPostalCode: string;
  assignedRiderId?: number | null;
  assignedRiderName?: string | null;
  assignedRiderPhone?: string | null;
  status: DeliveryStatus;
  distanceKm: number;
  assignmentAttempts: number;
  assignedAt?: string | null;
  assignmentExpiresAt?: string | null;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  otpAttempts: number;
  maxOtpAttempts: number;
  proofType?: ProofType | null;
  hasDeliveryProof: boolean;
  recipientConfirmedName?: string | null;
  failureReason?: string | null;
  riderEarningAmount: number;
  attempts: DeliveryAttempt[];
  events: DeliveryEvent[];
}
