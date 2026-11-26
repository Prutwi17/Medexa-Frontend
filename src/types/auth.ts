import { ROUTES } from '@/config/routes';

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'PHARMACY' | 'RIDER';

export type AccountStatus =
  | 'ACTIVE'
  | 'PENDING_APPROVAL'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'DEACTIVATED';

export type AuthProviderType = 'LOCAL' | 'GOOGLE' | 'BOTH';

export type VehicleType = 'BICYCLE' | 'SCOOTER' | 'MOTORCYCLE' | 'CAR';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  authProvider: AuthProviderType;
  lastLoginAt?: string | null;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export interface RegistrationResponse {
  user: AuthUser;
  emailVerificationRequired: boolean;
  approvalRequired: boolean;
}

export interface CustomerRegisterPayload {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface PharmacyRegisterPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  pharmacyName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  licenseNumber: string;
  issuingAuthority: string;
  pharmacistName: string;
  pharmacistRegistrationNumber: string;
  licenseExpiryDate: string;
  licenseDocumentUrl?: string;
}

export interface RiderRegisterPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  vehicleType: VehicleType;
  vehicleRegistrationNumber: string;
  drivingLicenseNumber: string;
  serviceCity: string;
}

export function getDashboardRouteForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return ROUTES.ADMIN_DASHBOARD;
    case 'PHARMACY':
      return ROUTES.PHARMACY_DASHBOARD;
    case 'RIDER':
      return ROUTES.RIDER_DASHBOARD;
    case 'CUSTOMER':
    default:
      return ROUTES.CUSTOMER_DASHBOARD;
  }
}
