import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'swipemix-server' });
});

app.use('/api/auth', authRoutes);

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Swipemix server listening on port ${config.PORT}`);
});
