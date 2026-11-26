import { apiClient, unwrapApiResponse } from '@/lib/apiClient';
import type { ApiResponse, PageMeta } from '@/types/api';
import type {
  InvoiceSummary,
  PaymentRecord,
  PaymentStatus,
  RefundRecord,
  RefundRecordStatus,
  WebhookEventLog,
} from '@/types/payments';

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

export const paymentsApi = {
  // Checkout failure & server-side verification
  reportCheckoutFailure: (
    checkoutReference: string,
    payload: {
      razorpayPaymentId?: string;
      errorCode?: string;
      errorDescription: string;
      releaseStock?: boolean;
    }
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PaymentRecord>>(
        `/customer/checkout/sessions/${encodeURIComponent(checkoutReference)}/payment-failed`,
        payload
      )
    ),

  listCustomerPayments: (params?: { status?: PaymentStatus; page?: number; size?: number }) =>
    unwrapPagedList<PaymentRecord>(apiClient.get<ApiResponse<PaymentRecord[]>>('/customer/payments', { params })),

  getCustomerPayment: (paymentReference: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PaymentRecord>>(
        `/customer/payments/${encodeURIComponent(paymentReference)}`
      )
    ),

  verifyCustomerPayment: (paymentReference: string, razorpayPaymentId?: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PaymentRecord>>(
        `/customer/payments/${encodeURIComponent(paymentReference)}/verify`,
        razorpayPaymentId ? { razorpayPaymentId } : {}
      )
    ),

  // Customer Refunds
  listCustomerRefunds: (params?: { status?: RefundRecordStatus; page?: number; size?: number }) =>
    unwrapPagedList<RefundRecord>(apiClient.get<ApiResponse<RefundRecord[]>>('/customer/refunds', { params })),

  createCustomerRefund: (orderId: number, payload: { reason: string; idempotencyKey?: string }) =>
    unwrapApiResponse(apiClient.post<ApiResponse<RefundRecord>>(`/customer/refunds/orders/${orderId}`, payload)),

  // Invoices (JSON + authenticated PDF blob download)
  getCustomerInvoice: (orderId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<InvoiceSummary>>(`/customer/orders/${orderId}/invoice`)),

  downloadInvoicePdf: async (role: 'customer' | 'pharmacy' | 'admin', orderId: number, orderNumber?: string) => {
    const response = await apiClient.get<Blob>(`/${role}/orders/${orderId}/invoice/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Medexa-Invoice-${orderNumber || orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  },

  // Admin Payments, Webhooks & Refunds
  listAdminPayments: (params?: { status?: PaymentStatus; q?: string; page?: number; size?: number }) =>
    unwrapPagedList<PaymentRecord>(apiClient.get<ApiResponse<PaymentRecord[]>>('/admin/payments', { params })),

  listAdminWebhooks: (params?: { page?: number; size?: number }) =>
    unwrapPagedList<WebhookEventLog>(
      apiClient.get<ApiResponse<WebhookEventLog[]>>('/admin/payments/webhooks', { params })
    ),

  listAdminRefunds: (params?: { status?: RefundRecordStatus; q?: string; page?: number; size?: number }) =>
    unwrapPagedList<RefundRecord>(apiClient.get<ApiResponse<RefundRecord[]>>('/admin/refunds', { params })),

  processAdminRefund: (refundId: number, notes?: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RefundRecord>>(`/admin/refunds/${refundId}/process`, notes ? { notes } : {})
    ),

  rejectAdminRefund: (refundId: number, notes: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RefundRecord>>(`/admin/refunds/${refundId}/reject`, { notes })
    ),
};
