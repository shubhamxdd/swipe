import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'swipemix_playlist_history';

export interface PlaylistHistoryEntry {
  id: string;
  name: string;
  theme: string;
  trackCount: number;
  url: string;
  createdAt: string;
}

interface HistoryState {
  history: PlaylistHistoryEntry[];
  loadHistory: () => Promise<void>;
  addEntry: (entry: PlaylistHistoryEntry) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],

  loadHistory: async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) set({ history: JSON.parse(raw) });
    } catch {}
  },

  addEntry: async (entry) => {
    const { history } = get();
    const updated = [entry, ...history].slice(0, 20);
    set({ history: updated });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  clearHistory: async () => {
    set({ history: [] });
    await AsyncStorage.removeItem(HISTORY_KEY);
  },
}));
