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
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  previewUrl: string | null;
  uri: string;
}

export interface ThemeResponse {
  tracks: SpotifyTrack[];
  playlistName: string;
  theme: string;
}

export interface PlaylistSaveResponse {
  playlistUrl: string;
  playlistId: string;
  name: string;
}
