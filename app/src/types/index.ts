export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  images: SpotifyImage[];
  name: string;
  release_date?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  previewUrl: string | null;
  uri: string;
  duration_ms: number;
}

export interface ThemeResponse {
  sessionId: string;
  tracks: SpotifyTrack[];
  playlistName: string;
  theme: string;
}

export interface NextBatchResponse {
  tracks: SpotifyTrack[];
  exhausted: boolean;
}

export interface PlaylistSaveResponse {
  id: string;
  uri: string;
  url: string;
  name: string;
  trackCount: number;
  skippedDuplicates?: number;
}

export interface PlaylistItem {
  id: string;
  name: string;
  tracks: { total: number };
}
