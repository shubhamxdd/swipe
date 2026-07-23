import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';
import authRoutes from './routes/auth';
import themeRoutes from './routes/theme';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'swipemix-server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/theme', requireAuth, themeRoutes);

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Swipemix server listening on port ${config.PORT}`);
});
