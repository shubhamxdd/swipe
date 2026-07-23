import type { SpotifyTrack, SpotifyUser } from '../types';

const SPOTIFY_API = 'https://api.spotify.com/v1';

async function fetchSpotify<T>(
  accessToken: string,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${SPOTIFY_API}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify API error (${res.status}): ${err}`);
  }

  return res.json() as Promise<T>;
}

function throttle(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMe(accessToken: string): Promise<SpotifyUser> {
  return fetchSpotify<SpotifyUser>(accessToken, '/me');
}

export async function searchTracks(
  accessToken: string,
  query: string,
  limit = 20,
): Promise<SpotifyTrack[]> {
  const data = await fetchSpotify<{
    tracks: { items: SpotifyTrack[] };
  }>(accessToken, '/search', { q: query, type: 'track', limit: String(limit) });

  return data.tracks.items;
}

export async function parallelSearch(
  accessToken: string,
  queries: string[],
  limit = 20,
): Promise<SpotifyTrack[]> {
  const allTracks: SpotifyTrack[] = [];

  for (let i = 0; i < queries.length; i++) {
    const tracks = await searchTracks(accessToken, queries[i], limit);
    allTracks.push(...tracks);

    if (i < queries.length - 1) {
      await throttle(350);
    }
  }

  return allTracks;
}
