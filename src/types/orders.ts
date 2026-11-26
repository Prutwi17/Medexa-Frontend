export type CheckoutStatus = 'AWAITING_PAYMENT' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PLACED'
  | 'PHARMACY_ACCEPTED'
  | 'PHARMACY_REJECTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export type OrderPaymentStatus = 'PENDING' | 'PAID' | 'REFUND_REQUESTED' | 'REFUNDED' | 'FAILED';

export type RefundStatus = 'NONE' | 'ELIGIBLE' | 'REQUESTED' | 'APPROVED' | 'PROCESSED';

export type DeliveryAssignmentStatus =
  | 'UNASSIGNED'
  | 'AWAITING_PICKUP'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: number;
  medicineId: number;
  medicineName: string;
  medicineSlug: string;
  brand: string;
  packSize: string;
  classificationCode: string;
  prescriptionRequired: boolean;
  prescriptionId?: number | null;
  prescriptionReference?: string | null;
  quantity: number;
  mrpPrice: number;
  unitPrice: number;
  lineSubtotal: number;
  discountAllocated: number;
  taxAmount: number;
  batchAllocationsSummary?: string | null;
}

export interface OrderStatusHistory {
  id: number;
  previousStatus?: OrderStatus | null;
  newStatus: OrderStatus;
  actorRole: string;
  actorName: string;
  notes?: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  checkoutReference: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  pharmacyId: number;
  pharmacyName: string;
  pharmacyCity: string;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  itemsSubtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  grandTotal: number;
  platformCommissionAmount?: number | null;
  pharmacyPayoutAmount?: number | null;
  deliveryAssignmentStatus: DeliveryAssignmentStatus;
  deliveryEtaMinutes?: number | null;
  requiresPrescription: boolean;
  allPrescriptionsVerified: boolean;
  cancellableByCustomer: boolean;
  refundEligible: boolean;
  refundStatus: RefundStatus;
  refundReason?: string | null;
  cancellationReason?: string | null;
  cancelledByRole?: string | null;
  placedAt?: string | null;
  acceptedAt?: string | null;
  preparedAt?: string | null;
  readyAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface PharmacyCheckoutBreakdown {
  pharmacyId: number;
  pharmacyName: string;
  pharmacyCity: string;
  itemCount: number;
  itemsSubtotal: number;
  discountAllocated: number;
  deliveryFee: number;
  taxAmount: number;
  grandTotal: number;
  estimatedCommissionAmount: number;
  estimatedPayoutAmount: number;
  estimatedDeliveryMinutes?: number | null;
  serviceable: boolean;
  readyForCheckout: boolean;
  blockers: string[];
}

export interface CheckoutPreview {
  addressId?: number | null;
  postalCode?: string | null;
  couponCode?: string | null;
  couponApplied: boolean;
  couponMessage?: string | null;
  itemsSubtotal: number;
  discountAmount: number;
  deliveryFeeTotal: number;
  taxRatePercent: number;
  taxAmount: number;
  grandTotal: number;
  checkoutAllowed: boolean;
  blockers: string[];
  pharmacyBreakdowns: PharmacyCheckoutBreakdown[];
}

export interface CheckoutSession {
  id: number;
  checkoutReference: string;
  status: CheckoutStatus;
  addressId?: number | null;
  deliveryRecipientName: string;
  deliveryPhone: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2?: string | null;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostalCode: string;
  couponCode?: string | null;
  itemsSubtotal: number;
  discountAmount: number;
  deliveryFeeTotal: number;
  taxAmount: number;
  grandTotal: number;
  amountInPaise: number;
  currency: string;
  razorpayKeyId?: string | null;
  razorpayOrderId?: string | null;
  paymentReference?: string | null;
  expiresAt: string;
  paidAt?: string | null;
  cancelledAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  orders: Order[];
}
