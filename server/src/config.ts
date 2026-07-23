import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1, 'SPOTIFY_CLIENT_ID is required'),
  SPOTIFY_CLIENT_SECRET: z.string().min(1, 'SPOTIFY_CLIENT_SECRET is required'),
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  REDIRECT_URI: z.string().url('REDIRECT_URI must be a valid URL'),
  OPENROUTER_MODEL: z.string().default('deepseek/deepseek-chat'),
  PORT: z.coerce.number().default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
