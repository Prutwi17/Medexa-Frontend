export type UserRole = 'ADMIN' | 'CUSTOMER' | 'PHARMACY' | 'RIDER';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}
