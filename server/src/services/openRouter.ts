import { config } from '../config';
import type { LLMSeedResponse } from '../types';

interface OpenRouterChoice {
  message: { content: string };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SEED_PROMPT = `You are a music expert curating a playlist. Given a theme or mood description, return a JSON object with:

- "genres": 3–6 genre tags that fit the theme (e.g. "indie rock", "lo-fi hip hop", "alternative r&b")
- "moods": 5–10 mood or keyword descriptors (e.g. "melancholic", "upbeat", "rainy day", "introspective")
- "era": optional year range as a string (e.g. "1995-2005"), null if not applicable
- "artists": 3–6 representative artist names that match the vibe
- "playlistName": a short, catchy playlist name suggestion (max 60 chars)
- "recommendedTracks": 15–25 specific songs that perfectly fit this theme. Each entry should have a "name" and "artist" field. These should be real, well-known tracks — prioritize songs that any Spotify user would recognize over obscure deep cuts.

Only return the JSON. No preamble or explanation.`;

const FACT_PROMPT = `You are a music trivia expert. For each track below, provide one short fun fact (max 2 sentences). 
Focus on: writing/recording backstory, cultural impact, or interesting trivia about the artist.
If you are not confident about a specific fact for a track, provide a short stylistic description instead.
IMPORTANT: Never fabricate specific claims like chart positions, awards, sales figures, or dates.
Return a JSON object where keys are the track IDs and values are the fun fact strings.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatCompletion(
  messages: ChatMessage[],
  responseFormat?: { type: 'json_object' },
): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://github.com/shubhamxdd/swipe',
    },
    body: JSON.stringify({
      model: config.OPENROUTER_MODEL,
      messages,
      response_format: responseFormat,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${res.status} ${err}`);
  }

  const data = await res.json() as OpenRouterResponse;
  return data.choices[0].message.content;
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  return text.trim();
}

export async function interpretTheme(theme: string): Promise<LLMSeedResponse> {
  const content = await chatCompletion(
    [
      { role: 'system', content: SEED_PROMPT },
      { role: 'user', content: `Theme: "${theme}"` },
    ],
    { type: 'json_object' },
  );

  const parsed = JSON.parse(extractJSON(content));

  return {
    genres: parsed.genres ?? [],
    moods: parsed.moods ?? [],
    era: parsed.era ?? undefined,
    artists: parsed.artists ?? [],
    playlistName: parsed.playlistName ?? `${theme} vibes`,
    recommendedTracks: parsed.recommendedTracks ?? [],
  };
}

const ADAPT_PROMPT = `You are a music expert helping refine a playlist. The user is building a playlist for a specific theme. They've already liked some tracks — recommend more songs that fit the same vibe and match the style of what they liked.

Return a JSON object with:
- "recommendedTracks": 20 specific songs that fit the theme and match the kept tracks' style. Each entry must have "name" and "artist" fields. Pick well-known, recognizable songs.
- "genres": 2–4 genre tags that best describe the kept tracks' sound
- "moods": 2–4 mood keywords that capture the vibe

Only return the JSON. No preamble or explanation.`;

export async function recommendNextBatch(
  originalTheme: string,
  keptTracks: { name: string; artist: string }[],
): Promise<{ recommendedTracks: { name: string; artist: string }[]; genres: string[]; moods: string[] }> {
  const keptList = keptTracks.map((t) => `- "${t.name}" by ${t.artist}`).join('\n');

  const content = await chatCompletion([
    { role: 'system', content: ADAPT_PROMPT },
    {
      role: 'user',
      content: `Theme: "${originalTheme}"\n\nTracks they liked:\n${keptList}\n\nReturn JSON.`,
    },
  ]);

  const parsed = JSON.parse(extractJSON(content));
  return {
    recommendedTracks: parsed.recommendedTracks ?? [],
    genres: parsed.genres ?? [],
    moods: parsed.moods ?? [],
  };
}

export async function generateFunFacts(
  tracks: { id: string; name: string; artist: string; album: string }[],
): Promise<Record<string, string>> {
  const trackList = tracks
    .map((t) => `- ${t.name} by ${t.artist} (album: ${t.album})`)
    .join('\n');

  const content = await chatCompletion([
    { role: 'system', content: FACT_PROMPT },
    {
      role: 'user',
      content: `Tracks:\n${trackList}\n\nReturn JSON with track IDs as keys.`,
    },
  ]);

  return JSON.parse(extractJSON(content));
}
