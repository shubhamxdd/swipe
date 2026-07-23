import type { LLMSeedResponse } from '../types';

interface Session {
  theme: string;
  playlistName: string;
  seeds: LLMSeedResponse;
  keptTrackIds: string[];
  skippedTrackIds: string[];
  seenTrackIds: Set<string>;
  batchCount: number;
  createdAt: Date;
}

const sessions = new Map<string, Session>();

const MAX_SESSION_AGE_MS = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt.getTime() > MAX_SESSION_AGE_MS) {
      sessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

export function createSession(
  id: string,
  theme: string,
  playlistName: string,
  seeds: LLMSeedResponse,
): void {
  sessions.set(id, {
    theme,
    playlistName,
    seeds,
    keptTrackIds: [],
    skippedTrackIds: [],
    seenTrackIds: new Set(),
    batchCount: 0,
    createdAt: new Date(),
  });
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function updateSessionPrefs(
  id: string,
  kept: string[],
  skipped: string[],
  seen: string[],
): void {
  const s = sessions.get(id);
  if (!s) return;
  s.keptTrackIds.push(...kept.filter((tid) => !s.keptTrackIds.includes(tid)));
  s.skippedTrackIds.push(...skipped.filter((tid) => !s.skippedTrackIds.includes(tid)));
  for (const tid of seen) s.seenTrackIds.add(tid);
  s.batchCount++;
}
