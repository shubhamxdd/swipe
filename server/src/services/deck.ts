import type { SpotifyTrack } from '../types';

const DECK_SIZE = 30;

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

export function assembleDeck(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const deduped = deduplicate(tracks);
  const shuffled = shuffle(deduped);
  return shuffled.slice(0, DECK_SIZE);
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

  for (const mood of seeds.moods.slice(0, 5)) {
    queries.push(mood);
  }

  for (const artist of seeds.artists.slice(0, 3)) {
    queries.push(artist);
  }

  return queries;
}
