import Anthropic from '@anthropic-ai/sdk';

export interface ContextSegment {
  city: string | null;
  venue: string | null;
  people: string[];
  vibe: string | null;
  date_from: string | null;
  date_to: string | null;
}

// Legacy single-extraction type kept for compatibility
export interface ContextExtraction extends ContextSegment {}

export interface ClaudeAnalysis {
  title: string;
  rhymes: string[];
  key_phrases: string[];
}

export async function extractContext(transcript: string, todayIso: string): Promise<ContextSegment[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are parsing a casual spoken description of a weekend or trip. Today's date is ${todayIso}.

The person may have visited MULTIPLE cities or venues across different time periods. Extract each distinct location+time segment as a separate entry.

Return a JSON array where each element has:
- "city": city name, or null
- "venue": club/bar/venue name, or null
- "people": array of names mentioned (can be shared across segments if they were together the whole time)
- "vibe": short mood/vibe if mentioned, or null
- "date_from": ISO 8601 datetime for start of that segment. Infer from "friday night" = 20:00, "saturday afternoon" = 14:00, etc. null if unclear.
- "date_to": ISO 8601 datetime for end of that segment. "into the morning" = next day 07:00, "until 6am" = 06:00. null if unclear.

If only one location is mentioned, return an array with one element.

Transcript:
"""
${transcript}
"""

Return ONLY a valid JSON array, no explanation:`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response');
  try {
    const raw = content.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map((p: any) => ({
      city: p.city || null,
      venue: p.venue || null,
      people: Array.isArray(p.people) ? p.people : [],
      vibe: p.vibe || null,
      date_from: p.date_from || null,
      date_to: p.date_to || null,
    }));
  } catch {
    return [{ city: null, venue: null, people: [], vibe: null, date_from: null, date_to: null }];
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
