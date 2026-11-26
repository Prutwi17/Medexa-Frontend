export const ROUTES = {
  // Public routes
  HOME: '/',
  MEDICINES: '/medicines',
  MEDICINE_DETAIL: '/medicines/:slug',
  PHARMACIES: '/pharmacies',
  HOW_IT_WORKS: '/how-it-works',
  ABOUT: '/about',
  CONTACT: '/contact',
  HELP: '/help',
  PRIVACY: '/privacy',
  TERMS: '/terms',

  // Authentication routes
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REGISTER_PHARMACY: '/auth/register/pharmacy',
  REGISTER_RIDER: '/auth/register/rider',
  ADMIN_LOGIN: '/auth/admin/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  PENDING_APPROVAL: '/auth/pending-approval',

  // Customer portal routes
  CUSTOMER_ROOT: '/customer',
  CUSTOMER_DASHBOARD: '/customer/dashboard',
  CUSTOMER_CART: '/customer/cart',
  CUSTOMER_CHECKOUT: '/customer/checkout',
  CUSTOMER_CHECKOUT_STATUS: '/customer/checkout/status/:checkoutReference',
  CUSTOMER_ORDER_CONFIRMATION: '/customer/checkout/confirmation/:checkoutReference',
  CUSTOMER_PAYMENTS: '/customer/payments',
  CUSTOMER_WISHLIST: '/customer/wishlist',
  CUSTOMER_PRESCRIPTIONS: '/customer/prescriptions',
  CUSTOMER_ORDERS: '/customer/orders',
  CUSTOMER_ORDER_DETAIL: '/customer/orders/:orderId',
  CUSTOMER_ADDRESSES: '/customer/addresses',
  CUSTOMER_PROFILE: '/customer/profile',

  // Pharmacy portal routes
  PHARMACY_ROOT: '/pharmacy',
  PHARMACY_DASHBOARD: '/pharmacy/dashboard',
  PHARMACY_INVENTORY: '/pharmacy/inventory',
  PHARMACY_MEDICINES: '/pharmacy/medicines',
  PHARMACY_PRESCRIPTIONS: '/pharmacy/prescriptions',
  PHARMACY_ORDERS: '/pharmacy/orders',
  PHARMACY_PAYOUTS: '/pharmacy/payouts',
  PHARMACY_PROFILE: '/pharmacy/profile',

  // Rider portal routes
  RIDER_ROOT: '/rider',
  RIDER_DASHBOARD: '/rider/dashboard',
  RIDER_ASSIGNMENTS: '/rider/assignments',
  RIDER_DELIVERY_DETAIL: '/rider/deliveries/:deliveryId',
  RIDER_ACTIVE_DELIVERY: '/rider/active-delivery',
  RIDER_EARNINGS: '/rider/earnings',
  RIDER_PROFILE: '/rider/profile',

  // Admin portal routes
  ADMIN_ROOT: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PHARMACIES: '/admin/pharmacies',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_MEDICINES: '/admin/medicines',
  ADMIN_USERS: '/admin/users',
  ADMIN_RIDERS: '/admin/riders',
  ADMIN_DELIVERIES: '/admin/deliveries',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_PAYOUTS: '/admin/payouts',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SETTINGS: '/admin/settings',

  // Error routes
  UNAUTHORIZED: '/unauthorized',
} as const;
