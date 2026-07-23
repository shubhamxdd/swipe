import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';
import authRoutes from './routes/auth';
import themeRoutes from './routes/theme';
import playlistRoutes from './routes/playlist';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'swipemix-server' });
});

import { suggestTheme } from './services/openRouter';
app.get('/api/suggest-theme', async (_req, res, next) => {
  try {
    const suggestion = await suggestTheme();
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/theme', requireAuth, themeRoutes);
app.use('/api/playlist', requireAuth, playlistRoutes);

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Swipemix server listening on port ${config.PORT}`);
});
