import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, PhoneCall, ShieldCheck, ShoppingBag, User, X } from 'lucide-react';
import { BrandLogo, Button } from '@/components/ui';
import { PUBLIC_NAV_ITEMS } from '@/config/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/cn';
import { getDashboardRouteForRole } from '@/types/auth';

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate(ROUTES.HOME);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface-canvas text-ink-primary">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Clinical Assurance Strip */}
      <div className="border-b border-border-subtle bg-brand-50 text-xs text-ink-secondary">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 font-medium text-brand-900">
            <ShieldCheck className="h-4 w-4 text-brand-700 shrink-0" aria-hidden="true" />
            <span>100% Licensed Pharmacies • Pharmacist-Verified Prescriptions</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
              <span>Support: support@medexa.in</span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary Header */}
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to={ROUTES.HOME} aria-label="Medexa Home" className="shrink-0">
            <BrandLogo />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-[var(--medexa-radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-100 text-brand-900 underline decoration-2 underline-offset-4'
                      : 'text-ink-secondary hover:bg-surface-soft hover:text-ink-primary'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <Link
              to={ROUTES.CUSTOMER_CART}
              className="inline-flex items-center gap-1.5 rounded-[var(--medexa-radius-md)] border border-border-subtle px-3 py-2 text-sm font-medium text-ink-primary hover:bg-surface-soft"
            >
              <ShoppingBag className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <span>Cart</span>
            </Link>

            {isAuthenticated && user ? (
              <>
                <Link to={getDashboardRouteForRole(user.role)}>
                  <Button variant="secondary" size="sm" leftIcon={<User className="h-4 w-4" />}>
                    {user.fullName.split(' ')[0]}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="h-4 w-4" />}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="public-mobile-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--medexa-radius-md)] border border-border-subtle text-ink-primary md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            id="public-mobile-nav"
            aria-label="Mobile Primary"
            className="border-t border-border-subtle bg-surface-canvas px-4 py-4 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-[var(--medexa-radius-sm)] px-3 py-2.5 text-sm font-medium',
                        isActive ? 'bg-brand-100 text-brand-900' : 'text-ink-secondary hover:bg-surface-soft'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to={getDashboardRouteForRole(user.role)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="secondary" fullWidth>
                      Open {user.role} Portal
                    </Button>
                  </Link>
                  <Button variant="outline" fullWidth onClick={handleLogout}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth>
                      Sign In
                    </Button>
                  </Link>
                  <Link to={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" fullWidth>
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-border-subtle bg-surface-soft">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          <div>
            <BrandLogo />
            <p className="mt-3 text-xs leading-relaxed text-ink-secondary">
              Multi-vendor medicine home delivery platform connecting patients with verified
              community pharmacies and tracked doorstep fulfillment.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-primary">Patients</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
              <li>
                <Link to={ROUTES.MEDICINES} className="hover:text-brand-700">
                  Browse Medicines
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CUSTOMER_PRESCRIPTIONS} className="hover:text-brand-700">
                  Prescription Upload
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CUSTOMER_ORDERS} className="hover:text-brand-700">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-primary">Partners</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
              <li>
                <Link to={ROUTES.REGISTER_PHARMACY} className="hover:text-brand-700">
                  Register Pharmacy
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REGISTER_RIDER} className="hover:text-brand-700">
                  Register as Rider
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ADMIN_LOGIN} className="hover:text-brand-700">
                  Operations Admin Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-primary">Compliance</h2>
            <p className="mt-3 text-xs leading-relaxed text-ink-secondary">
              Schedule-restricted medicines require a valid prescription approved by authorized
              pharmacy personnel prior to dispatch. Delivery confirmation uses customer OTP.
            </p>
          </div>
        </div>
        <div className="border-t border-border-subtle bg-surface-canvas px-4 py-4 text-center text-xs text-ink-muted">
          © {new Date().getFullYear()} Medexa Healthcare Marketplace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
