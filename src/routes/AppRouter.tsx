import { Navigate, Route, Routes } from 'react-router-dom';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ROUTES } from '@/config/routes';
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
import { PortalWorkspacePage } from '@/pages/portals/PortalWorkspacePage';
import { HomePage } from '@/pages/public/HomePage';
import { HowItWorksPage } from '@/pages/public/HowItWorksPage';
import { MedicinesPage } from '@/pages/public/MedicinesPage';
import { PharmaciesPage } from '@/pages/public/PharmaciesPage';
import { GuestOnlyRoute, ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      {/* 1. Public & Authentication Route Group */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.MEDICINES} element={<MedicinesPage />} />
        <Route path={ROUTES.MEDICINE_DETAIL} element={<MedicinesPage />} />
        <Route path={ROUTES.PHARMACIES} element={<PharmaciesPage />} />
        <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

        {/* Guest-only sign-in & registration pages */}
        <Route element={<GuestOnlyRoute />}>
          <Route path={ROUTES.LOGIN} element={<CustomerLoginPage />} />
          <Route path={ROUTES.REGISTER} element={<CustomerRegisterPage />} />
          <Route path={ROUTES.REGISTER_PHARMACY} element={<PharmacyRegisterPage />} />
          <Route path={ROUTES.REGISTER_RIDER} element={<RiderRegisterPage />} />
          <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
        </Route>

        {/* Recovery, email verification, and pending approval pages */}
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        <Route path={ROUTES.PENDING_APPROVAL} element={<PendingApprovalPage />} />
      </Route>

      {/* 2. Customer Protected Route Group */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route path={ROUTES.CUSTOMER_ROOT} element={<PortalLayout role="CUSTOMER" />}>
          <Route index element={<Navigate to={ROUTES.CUSTOMER_DASHBOARD} replace />} />
          <Route
            path="dashboard"
            element={
              <PortalWorkspacePage
                role="CUSTOMER"
                title="Customer Overview"
                subtitle="Track active pharmacy orders, prescription reviews, and saved addresses."
                modules={['Medicine Catalog', 'Cart & Checkout', 'Prescriptions', 'Order Tracking', 'Invoices']}
              />
            }
          />
          <Route
            path="cart"
            element={
              <PortalWorkspacePage
                role="CUSTOMER"
                title="Multi-Pharmacy Cart"
                subtitle="Items grouped by pharmacy with server-computed pricing and stock validation."
                modules={['Pharmacy Cart Grouping', 'Checkout Sessions', 'Razorpay Payment']}
              />
            }
          />
          <Route
            path="wishlist"
            element={
              <PortalWorkspacePage
                role="CUSTOMER"
                title="Saved Medicines"
                subtitle="Quickly reorder recurring medications from verified pharmacies."
                modules={['Wishlist Items', 'Quick Add to Cart']}
              />
            }
          />
          <Route
            path="prescriptions"
            element={
              <PortalWorkspacePage
                role="CUSTOMER"
                title="Prescriptions"
                subtitle="Upload and monitor pharmacist review decisions for Rx-required medicines."
                modules={['Prescription Upload', 'Pharmacist Review Status']}
              />
            }
          />
          <Route
            path="orders"
            element={
              <PortalWorkspacePage
                role="CUSTOMER"
                title="Order History &amp; Tracking"
                subtitle="Track individual pharmacy orders, delivery OTPs, refunds, and PDF invoices."
                modules={['Order Timeline', 'Delivery OTP', 'Refund Requests', 'PDF Invoice']}
              />
            }
          />
          <Route
            path="addresses"
            element={
              <PortalWorkspacePage
                role="CUSTOMER"
                title="Delivery Addresses"
                subtitle="Manage saved delivery locations and zone serviceability."
                modules={['Saved Addresses', 'Default Delivery Location']}
              />
            }
          />
        </Route>
      </Route>

      {/* 3. Pharmacy Protected Route Group */}
      <Route element={<ProtectedRoute allowedRoles={['PHARMACY']} />}>
        <Route path={ROUTES.PHARMACY_ROOT} element={<PortalLayout role="PHARMACY" />}>
          <Route index element={<Navigate to={ROUTES.PHARMACY_DASHBOARD} replace />} />
          <Route
            path="dashboard"
            element={
              <PortalWorkspacePage
                role="PHARMACY"
                title="Pharmacy Partner Console"
                subtitle="Manage drug license compliance, batch inventory, Rx approvals, and fulfillment."
                modules={['License Verification', 'Delivery Zones', 'Batch Inventory', 'Rx Reviews', 'Payout Ledger']}
              />
            }
          />
          <Route
            path="medicines"
            element={
              <PortalWorkspacePage
                role="PHARMACY"
                title="Pharmacy Medicine Listings"
                subtitle="Submit medicines for platform catalog approval and manage pricing."
                modules={['Medicine Submissions', 'Approval Status']}
              />
            }
          />
          <Route
            path="inventory"
            element={
              <PortalWorkspacePage
                role="PHARMACY"
                title="Batch &amp; Expiry Inventory"
                subtitle="Track stock batches, expiry dates, reservations, and stock movement audit trails."
                modules={['Medicine Batches', 'Stock Reservations', 'Expiry Alerts']}
              />
            }
          />
          <Route
            path="prescriptions"
            element={
              <PortalWorkspacePage
                role="PHARMACY"
                title="Prescription Reviews"
                subtitle="Review customer prescription uploads through authorized pharmacy personnel."
                modules={['Pending Rx Queue', 'Approval / Rejection Audit']}
              />
            }
          />
          <Route
            path="orders"
            element={
              <PortalWorkspacePage
                role="PHARMACY"
                title="Pharmacy Orders"
                subtitle="Prepare verified orders and coordinate pickup handover with assigned riders."
                modules={['Incoming Orders', 'Packing & Rider Handover']}
              />
            }
          />
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
          <Route
            path="dashboard"
            element={
              <PortalWorkspacePage
                role="RIDER"
                title="Delivery Rider Hub"
                subtitle="Go online, receive assigned pharmacy pickups, and verify doorstep OTPs."
                modules={['Availability Toggle', 'Assigned Deliveries', 'OTP Confirmation', 'Earnings Ledger']}
              />
            }
          />
          <Route
            path="assignments"
            element={
              <PortalWorkspacePage
                role="RIDER"
                title="Delivery Assignments"
                subtitle="Accept system-assigned pharmacy pickups within your active zone."
                modules={['Assignment Queue', 'Pickup Acceptance']}
              />
            }
          />
          <Route
            path="active-delivery"
            element={
              <PortalWorkspacePage
                role="RIDER"
                title="Active Delivery &amp; OTP"
                subtitle="Update pickup/transit status and confirm customer handover with delivery OTP."
                modules={['Transit Milestones', 'Customer OTP Verification']}
              />
            }
          />
          <Route
            path="earnings"
            element={
              <PortalWorkspacePage
                role="RIDER"
                title="Rider Earnings"
                subtitle="Track per-delivery payouts, incentives, and completed trip history."
                modules={['Delivery Incentives', 'Payout Records']}
              />
            }
          />
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
          <Route
            path="pharmacies"
            element={
              <PortalWorkspacePage
                role="ADMIN"
                title="Pharmacy &amp; License Verification"
                subtitle="Review pharmacy drug license submissions and approve compliant partners."
                modules={['Pending License Queue', 'Active Pharmacies']}
              />
            }
          />
          <Route
            path="medicines"
            element={
              <PortalWorkspacePage
                role="ADMIN"
                title="Catalog &amp; Medicine Approvals"
                subtitle="Approve or reject pharmacy medicine submissions before catalog publication."
                modules={['Categories', 'Medicine Moderation']}
              />
            }
          />
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
          <Route
            path="orders"
            element={
              <PortalWorkspacePage
                role="ADMIN"
                title="Orders, Payments &amp; Refunds"
                subtitle="Monitor multi-pharmacy checkouts, Razorpay webhook events, and refund exceptions."
                modules={['Checkout Monitoring', 'Webhook Idempotency', 'Refund Oversight']}
              />
            }
          />
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
