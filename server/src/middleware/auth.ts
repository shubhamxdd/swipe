import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { getMe } from '../services/spotify';

declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      spotifyUser?: { id: string; display_name: string | null };
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header'));
    return;
  }

  const token = header.slice(7);
  try {
    const user = await getMe(token);
    req.accessToken = token;
    req.spotifyUser = { id: user.id, display_name: user.display_name };
    next();
  } catch {
    next(new AppError(401, 'TOKEN_INVALID', 'Access token is invalid or expired'));
  }
}
