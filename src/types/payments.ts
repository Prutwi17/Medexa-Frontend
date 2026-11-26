export type PaymentStatus =
  | 'CREATED'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export type WebhookProcessingStatus =
  | 'RECEIVED'
  | 'PROCESSED'
  | 'IGNORED_DUPLICATE'
  | 'IGNORED_OUT_OF_ORDER'
  | 'FAILED';

export type RefundRecordStatus =
  | 'REQUESTED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'REJECTED'
  | 'FAILED';

export interface PaymentEvent {
  id: number;
  eventSource: string;
  eventType: string;
  previousStatus?: PaymentStatus | null;
  newStatus: PaymentStatus;
  gatewayReference?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PaymentRecord {
  id: number;
  paymentReference: string;
  checkoutReference: string;
  customerId: number;
  customerEmail: string;
  gatewayProvider: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string | null;
  amount: number;
  refundedAmount: number;
  currency: string;
  status: PaymentStatus;
  verificationMethod?: string | null;
  lastGatewayStatus?: string | null;
  failureCode?: string | null;
  failureReason?: string | null;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  events: PaymentEvent[];
}

export interface WebhookEventLog {
  id: number;
  eventId: string;
  eventType: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpayRefundId?: string | null;
  signatureVerified: boolean;
  processingStatus: WebhookProcessingStatus;
  processingNotes?: string | null;
  receivedAt: string;
  processedAt?: string | null;
}

export interface RefundRecord {
  id: number;
  refundReference: string;
  orderId: number;
  orderNumber: string;
  checkoutReference: string;
  paymentId: number;
  paymentReference: string;
  gatewayPaymentId?: string | null;
  customerId: number;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundRecordStatus;
  gatewayRefundId?: string | null;
  failureReason?: string | null;
  adminNotes?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  orderId: number;
  orderNumber: string;
  checkoutReference: string;
  pharmacyName: string;
  pharmacyAddress: string;
  customerName: string;
  customerAddress: string;
  itemsSubtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  grandTotal: number;
  taxApplicable: boolean;
  taxNote?: string | null;
  paymentReference?: string | null;
  paymentStatus: string;
  issuedAt: string;
}
