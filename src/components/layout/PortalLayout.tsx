import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Menu, X } from 'lucide-react';
import { Badge, BrandLogo, Button } from '@/components/ui';
import { PORTAL_LABELS, PORTAL_NAV_BY_ROLE } from '@/config/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/cn';
import type { UserRole } from '@/types/auth';

interface PortalLayoutProps {
  role: UserRole;
}

export function PortalLayout({ role }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = PORTAL_NAV_BY_ROLE[role];
  const portalMeta = PORTAL_LABELS[role];
  const RoleIcon = portalMeta.icon;

  const handleLogout = async () => {
    await logout();
    navigate(role === 'ADMIN' ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="flex min-h-dvh bg-surface-soft text-ink-primary">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside
        aria-label={`${portalMeta.title} Navigation`}
        className="hidden lg:flex lg:w-64 lg:flex-col border-e border-border-subtle bg-surface-canvas"
      >
        <div className="flex h-16 items-center justify-between border-b border-border-subtle px-5">
          <Link to={ROUTES.HOME} aria-label="Medexa Storefront">
            <BrandLogo />
          </Link>
        </div>

        <div className="border-b border-border-subtle px-5 py-3.5">
          <Badge variant="brand" icon={<RoleIcon className="h-3.5 w-3.5" />}>
            {portalMeta.badge}
          </Badge>
          {user && (
            <div className="mt-2">
              <p className="truncate text-sm font-semibold text-ink-primary">{user.fullName}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          )}
        </div>

        <nav aria-label="Portal" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-[var(--medexa-radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-100 text-brand-900 border-s-3 border-brand-700'
                          : 'text-ink-secondary hover:bg-surface-soft hover:text-ink-primary'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-2 border-t border-border-subtle p-4">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-secondary hover:text-brand-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Marketplace</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border-subtle bg-surface-canvas px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={sidebarOpen}
              aria-controls="portal-mobile-drawer"
              aria-label={sidebarOpen ? 'Close portal menu' : 'Open portal menu'}
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--medexa-radius-md)] border border-border-subtle text-ink-primary lg:hidden cursor-pointer"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <div>
              <p className="text-sm font-semibold text-ink-primary">{portalMeta.title}</p>
              <p className="text-xs text-ink-muted hidden sm:block">
                Medexa Multi-Vendor Clinical Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="neutral">{role}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="lg:hidden"
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Mobile Portal Navigation Drawer */}
        {sidebarOpen && (
          <nav
            id="portal-mobile-drawer"
            aria-label="Mobile Portal"
            className="border-b border-border-subtle bg-surface-canvas px-4 py-3 lg:hidden"
          >
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-[var(--medexa-radius-md)] px-3 py-2.5 text-sm font-medium',
                          isActive
                            ? 'bg-brand-100 text-brand-900'
                            : 'text-ink-secondary hover:bg-surface-soft'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 focus:outline-none">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
