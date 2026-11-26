import {
  Activity,
  Banknote,
  Building2,
  ClipboardCheck,
  FileText,
  Heart,
  LayoutDashboard,
  MapPin,
  Navigation,
  Package,
  Pill,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import type { NavItem } from '@/types/common';
import type { UserRole } from '@/types/auth';

export const PUBLIC_NAV_ITEMS = [
  { label: 'Medicines', to: ROUTES.MEDICINES },
  { label: 'Verified Pharmacies', to: ROUTES.PHARMACIES },
  { label: 'How It Works', to: ROUTES.HOW_IT_WORKS },
] as const;

export const PORTAL_NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  CUSTOMER: [
    { label: 'Overview', to: ROUTES.CUSTOMER_DASHBOARD, icon: LayoutDashboard },
    { label: 'Cart', to: ROUTES.CUSTOMER_CART, icon: ShoppingCart },
    { label: 'Wishlist', to: ROUTES.CUSTOMER_WISHLIST, icon: Heart },
    { label: 'Prescriptions', to: ROUTES.CUSTOMER_PRESCRIPTIONS, icon: FileText },
    { label: 'Orders', to: ROUTES.CUSTOMER_ORDERS, icon: Package },
    { label: 'Addresses', to: ROUTES.CUSTOMER_ADDRESSES, icon: MapPin },
  ],
  PHARMACY: [
    { label: 'Overview', to: ROUTES.PHARMACY_DASHBOARD, icon: LayoutDashboard },
    { label: 'Medicines', to: ROUTES.PHARMACY_MEDICINES, icon: Pill },
    { label: 'Batch Inventory', to: ROUTES.PHARMACY_INVENTORY, icon: Activity },
    { label: 'Rx Reviews', to: ROUTES.PHARMACY_PRESCRIPTIONS, icon: ClipboardCheck },
    { label: 'Orders', to: ROUTES.PHARMACY_ORDERS, icon: Package },
    { label: 'Payout Ledger', to: ROUTES.PHARMACY_PAYOUTS, icon: Wallet },
  ],
  RIDER: [
    { label: 'Overview', to: ROUTES.RIDER_DASHBOARD, icon: LayoutDashboard },
    { label: 'Assignments', to: ROUTES.RIDER_ASSIGNMENTS, icon: Truck },
    { label: 'Active Delivery', to: ROUTES.RIDER_ACTIVE_DELIVERY, icon: Navigation },
    { label: 'Earnings', to: ROUTES.RIDER_EARNINGS, icon: Banknote },
  ],
  ADMIN: [
    { label: 'Operations', to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { label: 'Pharmacies', to: ROUTES.ADMIN_PHARMACIES, icon: Building2 },
    { label: 'Medicines', to: ROUTES.ADMIN_MEDICINES, icon: Pill },
    { label: 'Users & Riders', to: ROUTES.ADMIN_USERS, icon: Users },
    { label: 'Orders', to: ROUTES.ADMIN_ORDERS, icon: Package },
    { label: 'Payouts', to: ROUTES.ADMIN_PAYOUTS, icon: Wallet },
    { label: 'Audit Logs', to: ROUTES.ADMIN_AUDIT_LOGS, icon: ShieldCheck },
    { label: 'Settings', to: ROUTES.ADMIN_SETTINGS, icon: Settings },
  ],
};

export const PORTAL_LABELS: Record<UserRole, { title: string; badge: string; icon: typeof UserCheck }> = {
  CUSTOMER: { title: 'Customer Portal', badge: 'Customer', icon: UserCheck },
  PHARMACY: { title: 'Pharmacy Console', badge: 'Licensed Pharmacy', icon: Building2 },
  RIDER: { title: 'Delivery Rider Hub', badge: 'Verified Rider', icon: Truck },
  ADMIN: { title: 'Medexa Operations', badge: 'Platform Admin', icon: ShieldCheck },
};
