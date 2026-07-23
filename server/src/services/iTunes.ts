const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string | null;
  isrc?: string;
}

interface ITunesResponse {
  resultCount: number;
  results: ITunesResult[];
}

export async function lookupPreview(
  trackName: string,
  artistName: string,
): Promise<string | null> {
  const term = encodeURIComponent(`${artistName} ${trackName}`);
  const url = `${ITUNES_SEARCH_URL}?term=${term}&limit=3&entity=song`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as ITunesResponse;

    if (data.resultCount === 0) return null;

    const match = data.results.find((r) => {
      const artistMatch = r.artistName.toLowerCase() === artistName.toLowerCase();
      const titleMatch = r.trackName.toLowerCase() === trackName.toLowerCase();
      return artistMatch && titleMatch;
    });

    return match?.previewUrl ?? data.results[0]?.previewUrl ?? null;
  } catch {
    return null;
  }
}

export async function batchLookupPreviews(
  tracks: { id: string; name: string; artist: string }[],
  lookupFn: (id: string, name: string, artist: string) => Promise<string | null>,
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  const batchSize = 5;
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize);
    const promises = batch.map((t) => lookupFn(t.id, t.name, t.artist));
    const previews = await Promise.all(promises);

    for (let j = 0; j < batch.length; j++) {
      results.set(batch[j].id, previews[j]);
    }
  }

  return results;
}
