import { config } from '../config';
import type { SpotifyTokens } from '../types';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
].join(' ');

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: config.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: config.REDIRECT_URI,
    scope: SCOPES,
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

function basicAuthHeader(): string {
  const encoded = Buffer.from(
    `${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64');
  return `Basic ${encoded}`;
}

export async function exchangeCode(
  code: string,
  codeVerifier?: string,
): Promise<SpotifyTokens> {
  const params: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.REDIRECT_URI,
    client_id: config.SPOTIFY_CLIENT_ID,
  };
  if (codeVerifier) {
    params.code_verifier = codeVerifier;
  }
  const body = new URLSearchParams(params);

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<SpotifyTokens>;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.SPOTIFY_CLIENT_ID,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}
