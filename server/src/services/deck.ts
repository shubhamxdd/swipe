import type { SpotifyTrack } from '../types';
import { searchExactTrack, parallelSearch } from './spotify';

const BATCH_SIZE = 20;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function deduplicate(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    const key = track.id || `${normalize(track.name)}-${normalize(track.artists[0]?.name ?? '')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function ensureArtistDiversity(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const artistCount = new Map<string, number>();
  const result: SpotifyTrack[] = [];

  for (const track of tracks) {
    const artist = track.artists[0]?.name ?? 'unknown';
    const count = artistCount.get(artist) ?? 0;
    if (count >= 2) continue;
    artistCount.set(artist, count + 1);
    result.push(track);
    if (result.length >= BATCH_SIZE) break;
  }

  return result;
}

export function assembleBatch(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const deduped = deduplicate(tracks);
  const diverse = ensureArtistDiversity(deduped);
  const shuffled = shuffle(diverse);
  return shuffled.slice(0, BATCH_SIZE);
}

export async function fetchRecommendedTracks(
  accessToken: string,
  recs: { name: string; artist: string }[],
): Promise<SpotifyTrack[]> {
  const CONCURRENCY = 3;
  const tracks: SpotifyTrack[] = [];

  for (let i = 0; i < recs.length; i += CONCURRENCY) {
    const batch = recs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((r) => searchExactTrack(accessToken, r.name, r.artist)),
    );
    for (const track of results) {
      if (track) tracks.push(track);
    }
  }

  return tracks;
}

export function buildSearchQueries(seeds: {
  genres: string[];
  moods: string[];
  era?: string;
  artists: string[];
}): string[] {
  const queries: string[] = [];

  for (const genre of seeds.genres.slice(0, 3)) {
    const q = seeds.era ? `${genre} ${seeds.era}` : genre;
    queries.push(q);
  }

  for (const artist of seeds.artists.slice(0, 3)) {
    queries.push(artist);
  }

  for (const mood of seeds.moods.slice(0, 5)) {
    const genres = seeds.genres.slice(0, 2);
    const enriched = genres.length > 0
      ? `${mood} ${genres.join(' ')}`
      : mood;
    queries.push(enriched);
  }

  return queries;
}

export async function buildAdaptiveBatch(
  accessToken: string,
  theme: string,
  keptTracks: { name: string; artist: string }[],
  seenTrackIds: Set<string>,
): Promise<SpotifyTrack[]> {
  const recs = await import('./openRouter').then((m) =>
    m.recommendNextBatch(theme, keptTracks),
  );

  const recTracks = await fetchRecommendedTracks(accessToken, recs.recommendedTracks);

  const keptArtists = keptTracks.map((t) => t.artist);
  const querySeeds = {
    genres: recs.genres,
    moods: recs.moods,
    artists: keptArtists.slice(0, 3),
  };
  const queries = buildSearchQueries(querySeeds);
  const searchTracks = await parallelSearch(accessToken, queries);

  const allTracks = [...recTracks, ...searchTracks];
  const deduped = deduplicate(allTracks);
  const filtered = deduped.filter((t) => !seenTrackIds.has(t.id));
  const diverse = ensureArtistDiversity(filtered);
  const shuffled = shuffle(diverse);
  return shuffled.slice(0, BATCH_SIZE);
}
