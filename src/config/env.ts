const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const normalizedBase = (rawApiBaseUrl?.trim() || 'http://localhost:8080/api/v1').replace(/\/+$/, '');
const apiOrigin = normalizedBase.replace(/\/api\/v1$/, '');

export const env = {
  apiBaseUrl: normalizedBase,
  apiOrigin,
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '',
  appEnv: (import.meta.env.VITE_APP_ENV as string | undefined) || 'development',
  isDev: import.meta.env.DEV,
} as const;

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${env.apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}
