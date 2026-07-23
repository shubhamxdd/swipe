import { Router } from 'express';
import { z } from 'zod';
import { getAuthUrl, exchangeCode, refreshAccessToken } from '../services/spotifyAuth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/url', (_req, res) => {
  res.json({ url: getAuthUrl() });
});

router.get('/callback', async (req, res, next) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    res.status(400).send('No authorization code received from Spotify');
    return;
  }
  try {
    const tokens = await exchangeCode(code);
    const params = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: String(tokens.expires_in),
    });
    res.redirect(302, `swipemix://auth/callback?${params.toString()}`);
  } catch (err) {
    next(err);
  }
});

const callbackSchema = z.object({
  code: z.string().min(1),
  code_verifier: z.string().min(1),
});

router.post('/callback', async (req, res, next) => {
  try {
    const { code, code_verifier } = callbackSchema.parse(req.body);
    const tokens = await exchangeCode(code, code_verifier);
    res.json(tokens);
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'INVALID_INPUT', 'Missing or invalid code or code_verifier'));
      return;
    }
    next(err);
  }
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = refreshSchema.parse(req.body);
    const tokens = await refreshAccessToken(refresh_token);
    res.json(tokens);
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, 'INVALID_INPUT', 'Missing refresh_token'));
      return;
    }
    next(err);
  }
});

export default router;
