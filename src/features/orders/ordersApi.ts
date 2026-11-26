import { apiClient, unwrapApiResponse } from '@/lib/apiClient';
import type { ApiResponse, PageMeta } from '@/types/api';
import type {
  CheckoutPreview,
  CheckoutSession,
  Order,
  OrderPaymentStatus,
  OrderStatus,
} from '@/types/orders';

export interface PagedOrders {
  items: Order[];
  pagination?: PageMeta;
}

async function unwrapPaged(promise: Promise<{ data: ApiResponse<Order[]> }>): Promise<PagedOrders> {
  const res = await promise;
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || res.data.message || 'Failed to fetch orders');
  }
  return {
    items: res.data.data,
    pagination: res.data.meta?.pagination,
  };
}

export const ordersApi = {
  // Checkout
  previewCheckout: (payload: { addressId?: number; couponCode?: string }) =>
    unwrapApiResponse(apiClient.post<ApiResponse<CheckoutPreview>>('/customer/checkout/preview', payload)),

  createCheckoutSession: (payload: {
    addressId: number;
    couponCode?: string;
    idempotencyKey?: string;
  }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<CheckoutSession>>('/customer/checkout/sessions', payload)
    ),

  getCheckoutSession: (checkoutReference: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<CheckoutSession>>(
        `/customer/checkout/sessions/${encodeURIComponent(checkoutReference)}`
      )
    ),

  confirmPayment: (
    checkoutReference: string,
    payload: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<CheckoutSession>>(
        `/customer/checkout/sessions/${encodeURIComponent(checkoutReference)}/confirm-payment`,
        payload
      )
    ),

  cancelCheckoutSession: (checkoutReference: string, reason?: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<CheckoutSession>>(
        `/customer/checkout/sessions/${encodeURIComponent(checkoutReference)}/cancel`,
        { reason }
      )
    ),

  // Customer Orders
  listCustomerOrders: (params?: { status?: OrderStatus; q?: string; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<Order[]>>('/customer/orders', { params })),

  getCustomerOrder: (orderId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<Order>>(`/customer/orders/${orderId}`)),

  cancelCustomerOrder: (orderId: number, reason: string) =>
    unwrapApiResponse(apiClient.post<ApiResponse<Order>>(`/customer/orders/${orderId}/cancel`, { reason })),

  requestRefund: (orderId: number, reason: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<Order>>(`/customer/orders/${orderId}/refund-request`, { reason })
    ),

  // Pharmacy Orders
  listPharmacyOrders: (params?: { status?: OrderStatus; q?: string; page?: number; size?: number }) =>
    unwrapPaged(apiClient.get<ApiResponse<Order[]>>('/pharmacy/orders', { params })),

  getPharmacyOrder: (orderId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<Order>>(`/pharmacy/orders/${orderId}`)),

  decidePharmacyOrder: (orderId: number, payload: { accepted: boolean; reason?: string }) =>
    unwrapApiResponse(apiClient.post<ApiResponse<Order>>(`/pharmacy/orders/${orderId}/decision`, payload)),

  updatePharmacyOrderStatus: (
    orderId: number,
    payload: { status: 'PREPARING' | 'READY_FOR_PICKUP'; notes?: string }
  ) =>
    unwrapApiResponse(apiClient.post<ApiResponse<Order>>(`/pharmacy/orders/${orderId}/status`, payload)),

  // Admin Orders
  listAdminOrders: (params?: {
    status?: OrderStatus;
    paymentStatus?: OrderPaymentStatus;
    pharmacyId?: number;
    q?: string;
    page?: number;
    size?: number;
  }) => unwrapPaged(apiClient.get<ApiResponse<Order[]>>('/admin/orders', { params })),

  getAdminOrder: (orderId: number) =>
    unwrapApiResponse(apiClient.get<ApiResponse<Order>>(`/admin/orders/${orderId}`)),

  getAdminParentCheckout: (checkoutReference: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<CheckoutSession>>(
        `/admin/orders/checkouts/${encodeURIComponent(checkoutReference)}`
      )
    ),
};
