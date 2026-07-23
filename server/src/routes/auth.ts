import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { getAuthUrl, exchangeCode, refreshAccessToken } from '../services/spotifyAuth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const PKCE_STORE_TTL = 5 * 60 * 1000;

const pkceStore = new Map<string, { verifier: string; createdAt: number }>();
const tokenStore = new Map<string, { accessToken: string; refreshToken: string }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pkceStore) {
    if (now - val.createdAt > PKCE_STORE_TTL) pkceStore.delete(key);
  }
  for (const [key] of tokenStore) {
    if (!pkceStore.has(key)) tokenStore.delete(key);
  }
}, 60_000);

function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

router.get('/url', async (_req, res, next) => {
  try {
    const verifier = base64URLEncode(crypto.randomBytes(32));
    const challenge = base64URLEncode(
      crypto.createHash('sha256').update(verifier).digest(),
    );

    const state = crypto.randomUUID();
    pkceStore.set(state, { verifier, createdAt: Date.now() });

    const baseUrl = getAuthUrl();
    const url = `${baseUrl}&code_challenge_method=S256&code_challenge=${challenge}&state=${state}`;

    res.json({ url, state });
  } catch (err) {
    next(err);
  }
});

router.get('/callback', async (req, res, next) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code || !state) {
    res.status(400).send('Missing authorization code or state');
    return;
  }

  const entry = pkceStore.get(state);
  if (!entry) {
    res.status(400).send('Invalid or expired state parameter');
    return;
  }

  pkceStore.delete(state);

  try {
    const tokens = await exchangeCode(code, entry.verifier);
    tokenStore.set(state, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Authenticated</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#121212;color:#fff;font-family:sans-serif">
        <div style="text-align:center">
          <h1 style="color:#1DB954">Connected to Spotify</h1>
          <p>You can close this tab and return to SwipeMix.</p>
          <script>try{location.href='swipemix://auth/callback?state=${state}'}catch(e){}</script>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
});

router.get('/tokens', (req, res) => {
  const state = req.query.state as string | undefined;
  if (!state) {
    res.status(400).json({ error: 'Missing state parameter' });
    return;
  }

  const entry = tokenStore.get(state);
  if (!entry) {
    res.status(404).json({ error: 'Tokens not yet available' });
    return;
  }

  tokenStore.delete(state);
  res.json({ access_token: entry.accessToken, refresh_token: entry.refreshToken });
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
