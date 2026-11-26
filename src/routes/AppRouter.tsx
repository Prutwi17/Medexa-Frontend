import { Navigate, Route, Routes } from 'react-router-dom';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ROUTES } from '@/config/routes';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminDeliveriesPage } from '@/pages/admin/AdminDeliveriesPage';
import { AdminMedicinesPage } from '@/pages/admin/AdminMedicinesPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminPharmaciesPage } from '@/pages/admin/AdminPharmaciesPage';
import { AdminRidersPage } from '@/pages/admin/AdminRidersPage';
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage';
import { CustomerLoginPage } from '@/pages/auth/CustomerLoginPage';
import { CustomerRegisterPage } from '@/pages/auth/CustomerRegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { PendingApprovalPage } from '@/pages/auth/PendingApprovalPage';
import { PharmacyRegisterPage } from '@/pages/auth/PharmacyRegisterPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { RiderRegisterPage } from '@/pages/auth/RiderRegisterPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { NotFoundPage, UnauthorizedPage } from '@/pages/errors/ErrorPages';
import { CustomerAddressesPage } from '@/pages/customer/CustomerAddressesPage';
import { CustomerCartPage } from '@/pages/customer/CustomerCartPage';
import { CustomerCheckoutPage } from '@/pages/customer/CustomerCheckoutPage';
import { CustomerDashboardPage } from '@/pages/customer/CustomerDashboardPage';
import { CustomerOrderDetailPage } from '@/pages/customer/CustomerOrderDetailPage';
import { CustomerOrdersPage } from '@/pages/customer/CustomerOrdersPage';
import { CustomerPaymentsPage } from '@/pages/customer/CustomerPaymentsPage';
import { CustomerPrescriptionsPage } from '@/pages/customer/CustomerPrescriptionsPage';
import { CustomerProfilePage } from '@/pages/customer/CustomerProfilePage';
import { CustomerWishlistPage } from '@/pages/customer/CustomerWishlistPage';
import { CheckoutPaymentStatusPage } from '@/pages/customer/CheckoutPaymentStatusPage';
import { OrderConfirmationPage } from '@/pages/customer/OrderConfirmationPage';
import { PharmacyDashboardPage } from '@/pages/pharmacy/PharmacyDashboardPage';
import { PharmacyInventoryPage } from '@/pages/pharmacy/PharmacyInventoryPage';
import { PharmacyMedicinesPage } from '@/pages/pharmacy/PharmacyMedicinesPage';
import { PharmacyOrdersPage } from '@/pages/pharmacy/PharmacyOrdersPage';
import { PharmacyPrescriptionsPage } from '@/pages/pharmacy/PharmacyPrescriptionsPage';
import { PharmacyProfilePage } from '@/pages/pharmacy/PharmacyProfilePage';
import { RiderAssignmentsPage } from '@/pages/rider/RiderAssignmentsPage';
import { RiderDashboardPage } from '@/pages/rider/RiderDashboardPage';
import { RiderDeliveryDetailPage } from '@/pages/rider/RiderDeliveryDetailPage';
import { RiderEarningsPage } from '@/pages/rider/RiderEarningsPage';
import { RiderProfilePage } from '@/pages/rider/RiderProfilePage';
import { PortalWorkspacePage } from '@/pages/portals/PortalWorkspacePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { HelpFaqPage } from '@/pages/public/HelpFaqPage';
import { HomePage } from '@/pages/public/HomePage';
import { HowItWorksPage } from '@/pages/public/HowItWorksPage';
import { MedicineDetailPage } from '@/pages/public/MedicineDetailPage';
import { MedicinesPage } from '@/pages/public/MedicinesPage';
import { PharmaciesPage } from '@/pages/public/PharmaciesPage';
import { PrivacyPolicyPage } from '@/pages/public/PrivacyPolicyPage';
import { TermsPage } from '@/pages/public/TermsPage';
import { GuestOnlyRoute, ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      {/* 1. Public & Authentication Route Group */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.MEDICINES} element={<MedicinesPage />} />
        <Route path={ROUTES.MEDICINE_DETAIL} element={<MedicineDetailPage />} />
        <Route path={ROUTES.PHARMACIES} element={<PharmaciesPage />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={ROUTES.CONTACT} element={<ContactPage />} />
        <Route path={ROUTES.HELP} element={<HelpFaqPage />} />
        <Route path={ROUTES.PRIVACY} element={<PrivacyPolicyPage />} />
        <Route path={ROUTES.TERMS} element={<TermsPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        <Route element={<GuestOnlyRoute />}>
          <Route path={ROUTES.LOGIN} element={<CustomerLoginPage />} />
          <Route path={ROUTES.REGISTER} element={<CustomerRegisterPage />} />
          <Route path={ROUTES.REGISTER_PHARMACY} element={<PharmacyRegisterPage />} />
          <Route path={ROUTES.REGISTER_RIDER} element={<RiderRegisterPage />} />
          <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
        </Route>

        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        <Route path={ROUTES.PENDING_APPROVAL} element={<PendingApprovalPage />} />
      </Route>

      {/* 2. Customer Protected Route Group */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route path={ROUTES.CUSTOMER_ROOT} element={<PortalLayout role="CUSTOMER" />}>
          <Route index element={<Navigate to={ROUTES.CUSTOMER_DASHBOARD} replace />} />
          <Route path="dashboard" element={<CustomerDashboardPage />} />
          <Route path="cart" element={<CustomerCartPage />} />
          <Route path="checkout" element={<CustomerCheckoutPage />} />
          <Route
            path="checkout/status/:checkoutReference"
            element={<CheckoutPaymentStatusPage />}
          />
          <Route
            path="checkout/confirmation/:checkoutReference"
            element={<OrderConfirmationPage />}
          />
          <Route path="payments" element={<CustomerPaymentsPage />} />
          <Route path="wishlist" element={<CustomerWishlistPage />} />
          <Route path="prescriptions" element={<CustomerPrescriptionsPage />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
          <Route path="orders/:orderId" element={<CustomerOrderDetailPage />} />
          <Route path="addresses" element={<CustomerAddressesPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
        </Route>
      </Route>

      {/* 3. Pharmacy Protected Route Group */}
      <Route element={<ProtectedRoute allowedRoles={['PHARMACY']} />}>
        <Route path={ROUTES.PHARMACY_ROOT} element={<PortalLayout role="PHARMACY" />}>
          <Route index element={<Navigate to={ROUTES.PHARMACY_DASHBOARD} replace />} />
          <Route path="dashboard" element={<PharmacyDashboardPage />} />
          <Route path="profile" element={<PharmacyProfilePage />} />
          <Route path="medicines" element={<PharmacyMedicinesPage />} />
          <Route path="inventory" element={<PharmacyInventoryPage />} />
          <Route path="prescriptions" element={<PharmacyPrescriptionsPage />} />
          <Route path="orders" element={<PharmacyOrdersPage />} />
          <Route
            path="payouts"
            element={
              <PortalWorkspacePage
                role="PHARMACY"
                title="Settlement &amp; Payout Ledger"
                subtitle="Review net pharmacy earnings, platform commissions, and payout disbursements."
                modules={['Pharmacy Payouts', 'Settlement Transactions']}
              />
            }
          />
        </Route>
      </Route>

      {/* 4. Rider Protected Route Group */}
      <Route element={<ProtectedRoute allowedRoles={['RIDER']} />}>
        <Route path={ROUTES.RIDER_ROOT} element={<PortalLayout role="RIDER" />}>
          <Route index element={<Navigate to={ROUTES.RIDER_DASHBOARD} replace />} />
          <Route path="dashboard" element={<RiderDashboardPage />} />
          <Route path="assignments" element={<RiderAssignmentsPage />} />
          <Route path="deliveries/:deliveryId" element={<RiderDeliveryDetailPage />} />
          <Route path="active-delivery" element={<Navigate to={ROUTES.RIDER_DASHBOARD} replace />} />
          <Route path="earnings" element={<RiderEarningsPage />} />
          <Route path="profile" element={<RiderProfilePage />} />
        </Route>
      </Route>

      {/* 5. Admin Protected Route Group */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} loginPath={ROUTES.ADMIN_LOGIN} />}>
        <Route path={ROUTES.ADMIN_ROOT} element={<PortalLayout role="ADMIN" />}>
          <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route
            path="dashboard"
            element={
              <PortalWorkspacePage
                role="ADMIN"
                title="Medexa Operations Admin"
                subtitle="Oversee pharmacy licensing, medicine approvals, compliance, payouts, and audit logs."
                modules={['Pharmacy Verification', 'Medicine Approvals', 'Orders & Refunds', 'Payouts', 'Audit Logs']}
              />
            }
          />
          <Route path="pharmacies" element={<AdminPharmaciesPage />} />
          <Route path="riders" element={<AdminRidersPage />} />
          <Route path="deliveries" element={<AdminDeliveriesPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="medicines" element={<AdminMedicinesPage />} />
          <Route
            path="users"
            element={
              <PortalWorkspacePage
                role="ADMIN"
                title="Users &amp; Rider Verification"
                subtitle="Manage customer, pharmacy, and rider accounts and approve rider onboarding."
                modules={['User Directory', 'Rider Verification']}
              />
            }
          />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route
            path="payouts"
            element={
              <PortalWorkspacePage
                role="ADMIN"
                title="Payout &amp; Earnings Ledgers"
                subtitle="Reconcile pharmacy settlements and delivery rider payout batches."
                modules={['Pharmacy Payouts', 'Rider Earnings']}
              />
            }
          />
          <Route
            path="audit-logs"
            element={
              <PortalWorkspacePage
                role="ADMIN"
                title="Platform Audit Logs"
                subtitle="Inspect correlation-traced compliance, prescription, and financial events."
                modules={['Audit Trail', 'Correlation ID Lookup']}
              />
            }
          />
          <Route
            path="settings"
            element={
              <PortalWorkspacePage
                role="ADMIN"
                title="System Settings"
                subtitle="Configure platform operational thresholds stored in MySQL system_settings."
                modules={['Platform Configuration', 'Compliance Thresholds']}
              />
            }
          />
        </Route>
      </Route>

      {/* Fallback */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
