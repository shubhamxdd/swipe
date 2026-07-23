import { Router } from 'express';
import { z } from 'zod';
import { createPlaylist, addTracksToPlaylist, getUserPlaylists, getPlaylistTrackIds } from '../services/spotify';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const savePlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  track_ids: z.array(z.string()).min(1).max(200),
  existingPlaylistId: z.string().optional(),
});

router.get('/list', async (req, res, next) => {
  try {
    const accessToken = req.accessToken!;
    const playlists = await getUserPlaylists(accessToken);
    res.json({ playlists });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, track_ids, existingPlaylistId } = savePlaylistSchema.parse(req.body);
    const accessToken = req.accessToken!;
    const userId = req.spotifyUser!.id;

    let finalTrackIds = track_ids;
    let playlistId: string;
    let playlistUrl: string;
    let playlistUri: string;

    if (existingPlaylistId) {
      playlistId = existingPlaylistId;
      const existingIds = await getPlaylistTrackIds(accessToken, playlistId);
      const existingSet = new Set(existingIds);
      finalTrackIds = track_ids.filter((id) => !existingSet.has(id));

      if (finalTrackIds.length > 0) {
        const trackUris = finalTrackIds.map((id) => `spotify:track:${id}`);
        await addTracksToPlaylist(accessToken, playlistId, trackUris);
      }

      playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;
      playlistUri = `spotify:playlist:${playlistId}`;
    } else {
      const trackUris = track_ids.map((id) => `spotify:track:${id}`);
      const playlist = await createPlaylist(accessToken, userId, name);
      playlistId = playlist.id;
      playlistUrl = playlist.external_urls.spotify;
      playlistUri = playlist.uri;
      await addTracksToPlaylist(accessToken, playlistId, trackUris);
    }

    res.json({
      id: playlistId,
      uri: playlistUri,
      url: playlistUrl,
      name,
      trackCount: finalTrackIds.length,
      skippedDuplicates: track_ids.length - finalTrackIds.length,
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
