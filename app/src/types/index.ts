export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  previewUrl: string | null;
}

export interface ThemeResponse {
  theme: string;
  playlistName: string;
  tracks: SpotifyTrack[];
}

export interface PlaylistSaveResponse {
  id: string;
  uri: string;
  url: string;
  name: string;
  trackCount: number;
}

export interface SwipeSession {
  theme: string;
  playlistName: string;
  tracks: SpotifyTrack[];
  keepPile: string[];
  currentIndex: number;
}
