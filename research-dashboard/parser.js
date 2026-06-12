const MARKER = '⦿-⦿';

function parseChat(text) {
  const parts = text.split(MARKER);
  const excerpts = [];

  // parts[0] is before first marker, parts[1] is between 1st and 2nd, etc.
  // Every odd-indexed part (1, 3, 5...) is an excerpt
  for (let i = 1; i < parts.length; i += 2) {
    const content = parts[i].trim();
    if (content) {
      excerpts.push(content);
    }
  }

  // If odd number of markers, the last section after the last marker is open-ended
  if (parts.length % 2 === 0) {
    // Even number of parts means odd number of markers
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart) {
      excerpts.push(lastPart);
    }
  }

  const suggestedTags = detectTags(text);

  return { excerpts, suggestedTags };
}

function detectTags(text) {
  const lower = text.toLowerCase();
  const tags = new Set();

  if (/study design|study-design/.test(lower)) tags.add('study design');
  if (/literature|paper|citation|reference/.test(lower)) tags.add('literature');
  if (/pivot|changed|rethinking/.test(lower)) tags.add('pivot');
  if (/feedback/.test(lower)) tags.add('feedback');
  if (/concept|theory|framework/.test(lower)) tags.add('concept');
  if (/dfa|alpha|biofeedback|flow state/.test(lower)) tags.add('flow');
  if (/cheatcode|8 cheatcodes/.test(lower)) tags.add('cheatcodes');

  return Array.from(tags);
}

module.exports = { parseChat };
