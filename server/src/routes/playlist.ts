import { Router } from 'express';
import { z } from 'zod';
import { createPlaylist, addTracksToPlaylist } from '../services/spotify';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const savePlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  track_ids: z.array(z.string()).min(1).max(200),
});

router.post('/', async (req, res, next) => {
  try {
    const { name, track_ids } = savePlaylistSchema.parse(req.body);
    const accessToken = req.accessToken!;
    const userId = req.spotifyUser!.id;

    const trackUris = track_ids.map((id) => `spotify:track:${id}`);

    const playlist = await createPlaylist(accessToken, userId, name);

    await addTracksToPlaylist(accessToken, playlist.id, trackUris);

    res.json({
      id: playlist.id,
      uri: playlist.uri,
      url: playlist.external_urls.spotify,
      name,
      trackCount: track_ids.length,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'INVALID_INPUT', 'Name and track_ids are required'));
      return;
    }
    next(err);
  }
});

export default router;
