const DEFAULT_BACKEND_URL = 'https://techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net';

function isWrongBackendUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('techstorebe:80') ||
    lower.includes('techstorebe:443') ||
    /^https?:\/\/techstorebe(:\d+)?(\/|$)/i.test(url)
  );
}

function getApiBaseUrl(): string {
  const env =
    (process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '').trim();
  if (!env) return DEFAULT_BACKEND_URL;
  if (isWrongBackendUrl(env)) {
    console.warn('[API] URL sai (TechStoreBE:80). Đang dùng:', DEFAULT_BACKEND_URL);
    return DEFAULT_BACKEND_URL;
  }
  return env;
}

/** Base URL của backend API. Lấy từ EXPO_PUBLIC_API_URL hoặc EXPO_PUBLIC_API_BASE_URL. */
export const API_BASE_URL = getApiBaseUrl();
