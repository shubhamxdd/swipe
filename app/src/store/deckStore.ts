import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SpotifyTrack } from '../types';

const SESSION_KEY = 'swipemix_active_session';

interface PersistedSession {
  sessionId: string;
  theme: string;
  playlistName: string;
  tracks: SpotifyTrack[];
  keepPile: string[];
  currentIndex: number;
}

interface DeckState {
  sessionId: string | null;
  theme: string | null;
  playlistName: string | null;
  tracks: SpotifyTrack[];
  keepPile: string[];
  currentIndex: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  exhausted: boolean;
  error: string | null;
  recentThemes: string[];
  savedSession: PersistedSession | null;
  setDeck: (sessionId: string, theme: string, playlistName: string, tracks: SpotifyTrack[]) => void;
  setDeckBatch: (sessionId: string, theme: string, playlistName: string, tracks: SpotifyTrack[]) => void;
  restoreSession: (session: PersistedSession) => void;
  appendTracks: (tracks: SpotifyTrack[], exhausted: boolean) => void;
  swipeRight: () => void;
  swipeLeft: () => void;
  undo: () => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (trackIds: string[]) => void;
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getKeptTracks: () => SpotifyTrack[];
  persistSession: () => Promise<void>;
  loadSession: () => Promise<PersistedSession | null>;
  clearSession: () => Promise<void>;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  sessionId: null,
  theme: null,
  playlistName: null,
  tracks: [],
  keepPile: [],
  currentIndex: 0,
  isLoading: false,
  isLoadingMore: false,
  exhausted: false,
  error: null,
  recentThemes: [],
  savedSession: null,

  setDeck: (sessionId, theme, playlistName, tracks) => {
    const { recentThemes } = get();
    const updated = [theme, ...recentThemes.filter((t) => t !== theme)].slice(0, 10);
    set({
      sessionId, theme, playlistName, tracks,
      keepPile: [], currentIndex: 0,
      isLoadingMore: false, exhausted: false, error: null,
      recentThemes: updated,
    });
    get().persistSession();
  },

  setDeckBatch: (sessionId, theme, playlistName, tracks) => {
    const { recentThemes } = get();
    const updated = [theme, ...recentThemes.filter((t) => t !== theme)].slice(0, 10);
    const allIds = tracks.map((t) => t.id);
    set({
      sessionId, theme, playlistName, tracks,
      keepPile: allIds, currentIndex: tracks.length,
      isLoadingMore: false, exhausted: true, error: null,
      recentThemes: updated,
    });
    get().persistSession();
  },

  restoreSession: (session) => {
    const { recentThemes } = get();
    const updated = [session.theme, ...recentThemes.filter((t) => t !== session.theme)].slice(0, 10);
    set({
      sessionId: session.sessionId,
      theme: session.theme,
      playlistName: session.playlistName,
      tracks: session.tracks,
      keepPile: session.keepPile,
      currentIndex: session.currentIndex,
      isLoadingMore: false, exhausted: false, error: null,
      recentThemes: updated,
    });
  },

  appendTracks: (newTracks, exhausted) => {
    const { tracks } = get();
    set({
      tracks: [...tracks, ...newTracks],
      exhausted,
      isLoadingMore: false,
    });
    get().persistSession();
  },

  swipeRight: () => {
    const { tracks, currentIndex, keepPile } = get();
    if (currentIndex >= tracks.length) return;
    const track = tracks[currentIndex];
    set({
      keepPile: [...keepPile, track.id],
      currentIndex: currentIndex + 1,
    });
    get().persistSession();
  },

  swipeLeft: () => {
    const { currentIndex } = get();
    set({ currentIndex: currentIndex + 1 });
    get().persistSession();
  },

  undo: () => {
    const { currentIndex } = get();
    if (currentIndex <= 0) return;
    set({ currentIndex: currentIndex - 1 });
    get().persistSession();
  },

  removeTrack: (trackId) => {
    const { keepPile } = get();
    set({ keepPile: keepPile.filter((id) => id !== trackId) });
  },

  reorderTracks: (trackIds) => {
    set({ keepPile: trackIds });
  },

  reset: () => {
    set({
      sessionId: null,
      theme: null,
      playlistName: null,
      tracks: [],
      keepPile: [],
      currentIndex: 0,
      isLoading: false,
      isLoadingMore: false,
      exhausted: false,
      error: null,
    });
    get().clearSession();
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingMore: (loading) => set({ isLoadingMore: loading }),
  setError: (error) => set({ error }),

  getKeptTracks: () => {
    const { tracks, keepPile } = get();
    return keepPile
      .map((id) => tracks.find((t) => t.id === id))
      .filter(Boolean) as SpotifyTrack[];
  },

  persistSession: async () => {
    const { sessionId, theme, playlistName, tracks, keepPile, currentIndex } = get();
    if (!sessionId) return;
    const data: PersistedSession = { sessionId, theme: theme || '', playlistName: playlistName || '', tracks, keepPile, currentIndex };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data));
  },

  loadSession: async () => {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data: PersistedSession = JSON.parse(raw);
      set({ savedSession: data });
      return data;
    } catch {
      return null;
    }
  },

  clearSession: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ savedSession: null });
  },
}));
