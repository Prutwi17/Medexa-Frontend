import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertBanner, Spinner } from '@/components/ui';
import { env } from '@/config/env';
import { ROUTES } from '@/config/routes';
import { authApi } from '@/features/auth/authApi';
import { useAuth } from '@/features/auth/AuthContext';
import { normalizeApiError } from '@/lib/errorHandler';
import { getDashboardRouteForRole, type UserRole } from '@/types/auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill';
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  role?: Exclude<UserRole, 'ADMIN'>;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onError?: (message: string) => void;
}

const GSI_SCRIPT_ID = 'google-identity-services-script';

export function GoogleSignInButton({
  role = 'CUSTOMER',
  text = 'continue_with',
  onError,
}: GoogleSignInButtonProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(Boolean(window.google?.accounts?.id));
  const [submitting, setSubmitting] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!env.googleClientId) return;
    if (window.google?.accounts?.id) {
      setSdkReady(true);
      return;
    }

    let script = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => setSdkReady(true);
    const handleError = () => setLoadFailed(true);

    if (!script) {
      script = document.createElement('script');
      script.id = GSI_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
    }

    return () => {
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    const container = buttonContainerRef.current;
    if (!env.googleClientId || !sdkReady || !container || !window.google?.accounts?.id) {
      return;
    }

    container.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: env.googleClientId,
      callback: async (response) => {
        if (!response.credential) {
          onError?.('Google authentication did not return an identity token.');
          return;
        }
        setSubmitting(true);
        try {
          const session = await authApi.googleLogin({
            idToken: response.credential,
            role,
          });
          setSession(session);
          navigate(getDashboardRouteForRole(session.user.role), { replace: true });
        } catch (err) {
          const normalized = normalizeApiError(err);
          if (normalized.code === 'ACCOUNT_PENDING_APPROVAL') {
            navigate(ROUTES.PENDING_APPROVAL, {
              state: { role },
            });
            return;
          }
          onError?.(normalized.message);
        } finally {
          setSubmitting(false);
        }
      },
    });

    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text,
      shape: 'rectangular',
      width: 360,
    });
  }, [sdkReady, role, text, navigate, setSession, onError]);

  if (!env.googleClientId) {
    return (
      <AlertBanner
        variant="info"
        title="Google Sign-In awaiting Client ID"
        description="Set VITE_GOOGLE_CLIENT_ID in Medexa-Frontend/.env to enable Google OAuth authentication."
      />
    );
  }

  if (loadFailed) {
    return (
      <AlertBanner
        variant="warning"
        title="Google Sign-In unavailable"
        description="Unable to load Google Identity Services. Please check network access or use email and password."
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {submitting && (
        <div className="flex items-center gap-2 text-xs text-ink-secondary">
          <Spinner size="sm" label="Verifying Google sign-in" />
          <span>Verifying your Google identity...</span>
        </div>
      )}
      <div
        ref={buttonContainerRef}
        className="flex min-h-[44px] w-full items-center justify-center overflow-hidden"
      />
    </div>
  );
}
