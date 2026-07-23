import type { ThemeResponse, PlaylistSaveResponse } from '../types';

// const API_BASE = 'http://localhost:3000';
const API_BASE = 'https://environmental-arcuately-maxwell.ngrok-free.dev';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error (${res.status}): ${body}`);
  }

  return res.json();
}

export function getAuthUrl(): Promise<{ url: string; state: string }> {
  return request('/api/auth/url');
}

export function getTokens(
  state: string,
): Promise<{ access_token: string; refresh_token: string }> {
  return request(`/api/auth/tokens?state=${encodeURIComponent(state)}`);
}

export function exchangeCode(
  code: string,
  codeVerifier: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  return request('/api/auth/callback', {
    method: 'POST',
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
  });
}

export function refreshToken(
  refresh_token: string,
): Promise<{ access_token: string; expires_in: number }> {
  return request('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export function submitTheme(
  accessToken: string,
  theme: string,
): Promise<ThemeResponse> {
  return request('/api/theme', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ theme }),
  });
}

export function savePlaylist(
  accessToken: string,
  name: string,
  trackIds: string[],
): Promise<PlaylistSaveResponse> {
  return request('/api/playlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, track_ids: trackIds }),
  });
}
