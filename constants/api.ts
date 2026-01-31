/**
 * Base URL of the TechStore backend API.
 * Set EXPO_PUBLIC_API_BASE_URL in .env or .env.local (e.g. https://your-api.com or http://localhost:5000).
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'https://techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net';
