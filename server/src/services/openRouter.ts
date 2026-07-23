import { config } from '../config';
import type { LLMSeedResponse } from '../types';

interface OpenRouterChoice {
  message: { content: string };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SEED_PROMPT = `You are a music expert. Given a theme or mood description, interpret it and return structured search seeds for finding matching songs on Spotify.

Return a JSON object with these fields:
- "genres": 3–6 genre tags that fit the theme (e.g. "indie rock", "lo-fi hip hop")
- "moods": 5–10 mood or keyword descriptors (e.g. "melancholic", "upbeat", "rainy")
- "era": optional year range as a string (e.g. "1995-2005"), null if not applicable
- "artists": 3–6 representative artist names that match the vibe (use as search hints)
- "playlistName": a short, catchy playlist name suggestion (max 60 chars)

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

export async function interpretTheme(theme: string): Promise<LLMSeedResponse> {
  const content = await chatCompletion(
    [
      { role: 'system', content: SEED_PROMPT },
      { role: 'user', content: `Theme: "${theme}"` },
    ],
    { type: 'json_object' },
  );

  const parsed = JSON.parse(content);

  return {
    genres: parsed.genres ?? [],
    moods: parsed.moods ?? [],
    era: parsed.era ?? undefined,
    artists: parsed.artists ?? [],
    playlistName: parsed.playlistName ?? `${theme} vibes`,
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

  return JSON.parse(content);
}
