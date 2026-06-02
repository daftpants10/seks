import Anthropic from '@anthropic-ai/sdk';

export interface ContextExtraction {
  city: string | null;
  venue: string | null;
  people: string[];
  vibe: string | null;
  date_from: string | null;
  date_to: string | null;
}

export interface ClaudeAnalysis {
  title: string;
  rhymes: string[];
  key_phrases: string[];
}

export async function extractContext(transcript: string, todayIso: string): Promise<ContextExtraction> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are parsing a casual spoken description of a night out. Today's date is ${todayIso}.
Extract the following fields from this transcript and return ONLY valid JSON:

- "city": city name mentioned, or null
- "venue": club/bar/venue name, or null
- "people": array of names of people mentioned (empty array if none)
- "vibe": short mood/vibe description if mentioned, or null
- "date_from": ISO 8601 datetime for start of the night (infer from context like "friday night", "last saturday"). If only a day is given, use 20:00 local as start time. null if unclear.
- "date_to": ISO 8601 datetime for end. If they say "into saturday morning" or "until 6am", infer accordingly. null if unclear.

Transcript:
"""
${transcript}
"""

Return ONLY valid JSON, no explanation:`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response');
  try {
    const raw = content.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(raw);
    return {
      city: parsed.city || null,
      venue: parsed.venue || null,
      people: Array.isArray(parsed.people) ? parsed.people : [],
      vibe: parsed.vibe || null,
      date_from: parsed.date_from || null,
      date_to: parsed.date_to || null,
    };
  } catch {
    return { city: null, venue: null, people: [], vibe: null, date_from: null, date_to: null };
  }
}

export async function analyzeTranscript(transcript: string): Promise<ClaudeAnalysis> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Analyze this voice memo transcript and return a JSON object with exactly these fields:

1. "title": A short poetic title (3-7 words, all lowercase, hyphenated like a-song-title). Capture the essence or mood.
2. "rhymes": An array of rhyming pairs or groups found in the transcript (strings like "day/way/say" or "mind/find/bind"). If no rhymes, return [].
3. "key_phrases": An array of the most interesting/standout phrases or words (up to 8). Focus on vivid imagery, unique expressions, or emotionally resonant words.

Transcript:
"""
${transcript}
"""

Return ONLY valid JSON, no explanation:`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    // Strip markdown code fences if present
    const raw = content.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(raw);
    return {
      title: parsed.title || 'untitled',
      rhymes: Array.isArray(parsed.rhymes) ? parsed.rhymes : [],
      key_phrases: Array.isArray(parsed.key_phrases) ? parsed.key_phrases : [],
    };
  } catch {
    console.error('Failed to parse Claude response:', content.text);
    return {
      title: 'untitled',
      rhymes: [],
      key_phrases: [],
    };
  }
}
