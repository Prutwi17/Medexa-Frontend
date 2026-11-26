import { apiClient, unwrapApiResponse } from '@/lib/apiClient';
import type { ApiResponse } from '@/types/api';
import type {
  AuthTokenResponse,
  AuthUser,
  CustomerRegisterPayload,
  PharmacyRegisterPayload,
  RegistrationResponse,
  RiderRegisterPayload,
  UserRole,
} from '@/types/auth';

export const authApi = {
  initCsrf: () => apiClient.get<ApiResponse<{ headerName: string }>>('/auth/csrf'),

  registerCustomer: (payload: CustomerRegisterPayload) =>
    unwrapApiResponse(apiClient.post<ApiResponse<RegistrationResponse>>('/auth/register/customer', payload)),

  registerPharmacy: (payload: PharmacyRegisterPayload) =>
    unwrapApiResponse(apiClient.post<ApiResponse<RegistrationResponse>>('/auth/register/pharmacy', payload)),

  registerRider: (payload: RiderRegisterPayload) =>
    unwrapApiResponse(apiClient.post<ApiResponse<RegistrationResponse>>('/auth/register/rider', payload)),

  login: (payload: { email: string; password: string }) =>
    unwrapApiResponse(apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/login', payload)),

  adminLogin: (payload: { email: string; password: string }) =>
    unwrapApiResponse(apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/admin/login', payload)),

  googleLogin: (payload: { idToken: string; role?: Exclude<UserRole, 'ADMIN'> }) =>
    unwrapApiResponse(apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/google', payload)),

  refresh: () =>
    unwrapApiResponse(apiClient.post<ApiResponse<AuthTokenResponse>>('/auth/refresh')),

  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),

  logoutAll: () => apiClient.post<ApiResponse<null>>('/auth/logout-all'),

  verifyEmail: (token: string) =>
    apiClient.post<ApiResponse<null>>('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/resend-verification', { email }),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    apiClient.post<ApiResponse<null>>('/auth/reset-password', payload),

  me: () => unwrapApiResponse(apiClient.get<ApiResponse<AuthUser>>('/auth/me')),
};
