import { create } from 'zustand';
import type { SpotifyTrack } from '../types';

interface DeckState {
  theme: string | null;
  playlistName: string | null;
  tracks: SpotifyTrack[];
  keepPile: string[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  recentThemes: string[];
  setDeck: (theme: string, playlistName: string, tracks: SpotifyTrack[]) => void;
  swipeRight: () => void;
  swipeLeft: () => void;
  undo: () => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (trackIds: string[]) => void;
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getKeptTracks: () => SpotifyTrack[];
}

export const useDeckStore = create<DeckState>((set, get) => ({
  theme: null,
  playlistName: null,
  tracks: [],
  keepPile: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  recentThemes: [],

  setDeck: (theme, playlistName, tracks) => {
    const { recentThemes } = get();
    const updated = [theme, ...recentThemes.filter((t) => t !== theme)].slice(0, 10);
    set({
      theme,
      playlistName,
      tracks,
      keepPile: [],
      currentIndex: 0,
      error: null,
      recentThemes: updated,
    });
  },

  swipeRight: () => {
    const { tracks, currentIndex, keepPile } = get();
    if (currentIndex >= tracks.length) return;
    const track = tracks[currentIndex];
    set({
      keepPile: [...keepPile, track.id],
      currentIndex: currentIndex + 1,
    });
  },

  swipeLeft: () => {
    const { currentIndex } = get();
    set({ currentIndex: currentIndex + 1 });
  },

  undo: () => {
    const { currentIndex } = get();
    if (currentIndex <= 0) return;
    set({ currentIndex: currentIndex - 1 });
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
      theme: null,
      playlistName: null,
      tracks: [],
      keepPile: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getKeptTracks: () => {
    const { tracks, keepPile } = get();
    return keepPile
      .map((id) => tracks.find((t) => t.id === id))
      .filter(Boolean) as SpotifyTrack[];
  },
}));
