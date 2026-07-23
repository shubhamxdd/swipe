import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { interpretTheme } from '../services/openRouter';
import { parallelSearch } from '../services/spotify';
import { assembleBatch, buildSearchQueries, fetchRecommendedTracks, buildAdaptiveBatch } from '../services/deck';
import { lookupPreview } from '../services/iTunes';
import { previewUrlCache } from '../cache/index';
import { createSession, getSession, updateSessionPrefs } from '../services/session';
import { AppError } from '../middleware/errorHandler';
import type { LLMSeedResponse, SpotifyTrack } from '../types';

const router = Router();

const themeSchema = z.object({
  theme: z.string().min(2).max(200),
});

const nextSchema = z.object({
  sessionId: z.string().min(1),
  keptTracks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    artist: z.string(),
  })),
  skippedTrackIds: z.array(z.string()),
  seenTrackIds: z.array(z.string()),
});

function broadenSeeds(seeds: LLMSeedResponse): LLMSeedResponse {
  const result = { ...seeds };

  if (result.era) {
    result.era = undefined;
    return result;
  }

  result.moods = result.moods.slice(0, 3);
  result.genres = result.genres.slice(0, 2);

  return result;
}

async function buildInitialDeck(
  accessToken: string,
  theme: string,
): Promise<{ tracks: SpotifyTrack[]; playlistName: string; seeds: LLMSeedResponse }> {
  let seeds = await interpretTheme(theme);

  for (let attempt = 0; attempt < 3; attempt++) {
    const recTracks = seeds.recommendedTracks?.length
      ? await fetchRecommendedTracks(accessToken, seeds.recommendedTracks)
      : [];

    const queries = buildSearchQueries(seeds);
    const searchTracks = await parallelSearch(accessToken, queries);

    const allTracks = [...recTracks, ...searchTracks];
    const deck = assembleBatch(allTracks);

    if (deck.length >= 5 || attempt === 2) {
      return { tracks: deck, playlistName: seeds.playlistName, seeds };
    }

    seeds = broadenSeeds(seeds);
  }

  return { tracks: [], playlistName: seeds.playlistName, seeds };
}

async function enrichWithPreviews(
  tracks: SpotifyTrack[],
): Promise<(SpotifyTrack & { previewUrl: string | null })[]> {
  const missing: { id: string; name: string; artist: string }[] = [];

  const previews = new Map<string, string | null>();

  for (const track of tracks) {
    const cached = previewUrlCache.get(track.id);
    if (cached !== undefined) {
      previews.set(track.id, cached);
    } else {
      missing.push({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name ?? '',
      });
    }
  }

  const batchSize = 5;
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((t) => lookupPreview(t.name, t.artist)),
    );
    for (let j = 0; j < batch.length; j++) {
      previews.set(batch[j].id, results[j]);
      previewUrlCache.set(batch[j].id, results[j]);
    }
  }

  return tracks.map((track) => ({
    ...track,
    previewUrl: previews.get(track.id) ?? null,
  }));
}

router.post('/', async (req, res, next) => {
  try {
    const { theme } = themeSchema.parse(req.body);
    const accessToken = req.accessToken!;

    const { tracks, playlistName, seeds } = await buildInitialDeck(accessToken, theme);

    if (tracks.length === 0) {
      next(new AppError(404, 'EMPTY_DECK', 'No tracks found for this theme. Try a different description.'));
      return;
    }

    const tracksWithPreviews = await enrichWithPreviews(tracks);
    const sessionId = randomUUID();
    createSession(sessionId, theme, playlistName, seeds);

    res.json({
      sessionId,
      theme,
      playlistName,
      tracks: tracksWithPreviews,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'INVALID_INPUT', 'Theme must be between 2 and 200 characters'));
      return;
    }
    next(err);
  }
});

router.post('/next', async (req, res, next) => {
  try {
    const { sessionId, keptTracks, skippedTrackIds, seenTrackIds } = nextSchema.parse(req.body);
    const accessToken = req.accessToken!;

    const seenIds = new Set(seenTrackIds);
    updateSessionPrefs(sessionId, keptTracks.map((t) => t.id), skippedTrackIds, seenTrackIds);
    const session = getSession(sessionId);
    if (!session) {
      next(new AppError(404, 'SESSION_EXPIRED', 'Session expired. Start a new mix.'));
      return;
    }

    const tracks = await buildAdaptiveBatch(
      accessToken,
      session.theme,
      keptTracks,
      seenIds,
    );

    if (tracks.length === 0) {
      res.json({ tracks: [], exhausted: true });
      return;
    }

    const tracksWithPreviews = await enrichWithPreviews(tracks);

    res.json({
      tracks: tracksWithPreviews,
      exhausted: tracks.length < 5,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'INVALID_INPUT', 'Invalid request data'));
      return;
    }
    next(err);
  }
});

export default router;
