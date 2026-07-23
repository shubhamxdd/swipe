import { Router } from 'express';
import { z } from 'zod';
import { interpretTheme } from '../services/openRouter';
import { parallelSearch } from '../services/spotify';
import { assembleDeck, buildSearchQueries } from '../services/deck';
import { AppError } from '../middleware/errorHandler';
import type { LLMSeedResponse, SpotifyTrack } from '../types';

const router = Router();

const themeSchema = z.object({
  theme: z.string().min(2).max(200),
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

async function buildDeck(
  accessToken: string,
  theme: string,
): Promise<{ tracks: SpotifyTrack[]; playlistName: string }> {
  let seeds = await interpretTheme(theme);

  for (let attempt = 0; attempt < 3; attempt++) {
    const queries = buildSearchQueries(seeds);
    const tracks = await parallelSearch(accessToken, queries);
    const deck = assembleDeck(tracks);

    if (deck.length >= 5 || attempt === 2) {
      return { tracks: deck, playlistName: seeds.playlistName };
    }

    seeds = broadenSeeds(seeds);
  }

  return { tracks: [], playlistName: seeds.playlistName };
}

router.post('/', async (req, res, next) => {
  try {
    const { theme } = themeSchema.parse(req.body);
    const accessToken = req.accessToken!;

    const { tracks, playlistName } = await buildDeck(accessToken, theme);

    if (tracks.length === 0) {
      next(new AppError(404, 'EMPTY_DECK', 'No tracks found for this theme. Try a different description.'));
      return;
    }

    res.json({
      theme,
      playlistName,
      tracks,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'INVALID_INPUT', 'Theme must be between 2 and 200 characters'));
      return;
    }
    next(err);
  }
});

export default router;
