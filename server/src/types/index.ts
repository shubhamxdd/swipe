export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email: string | null;
  images: { url: string }[];
}

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
  isrc?: string;
  preview_url: string | null;
}

export interface DeckTrack extends SpotifyTrack {
  previewUrl?: string | null;
  funFact?: string | null;
}

export interface LLMSeedResponse {
  genres: string[];
  moods: string[];
  era?: string;
  artists: string[];
  playlistName: string;
  recommendedTracks?: { name: string; artist: string }[];
}
