const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const env = {
  apiBaseUrl: (rawApiBaseUrl?.trim() || 'http://localhost:8080/api/v1').replace(/\/+$/, ''),
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '',
  appEnv: (import.meta.env.VITE_APP_ENV as string | undefined) || 'development',
  isDev: import.meta.env.DEV,
} as const;
