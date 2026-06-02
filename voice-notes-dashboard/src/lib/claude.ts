import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeAnalysis {
  title: string;
  rhymes: string[];
  key_phrases: string[];
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
