import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN    = process.env.DISCOGS_TOKEN;
const USERNAME = process.env.DISCOGS_USERNAME || 'daftpants';

if (!TOKEN || TOKEN === 'your_personal_token_here') {
  console.error('Error: set DISCOGS_TOKEN in your .env file.');
  process.exit(1);
}

const BASE_URL  = `https://api.discogs.com/users/${USERNAME}/collection/folders/0/releases`;
const PER_PAGE  = 100;
const HEADERS   = {
  'Authorization': `Discogs token=${TOKEN}`,
  'User-Agent':    'TimeCompass/1.0',
};

async function fetchPage(page) {
  const url = `${BASE_URL}?per_page=${PER_PAGE}&page=${page}`;
  const res  = await fetch(url, { headers: HEADERS });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discogs API error ${res.status}: ${body}`);
  }

  return res.json();
}

function extractCatnoNumber(catno) {
  const match = catno?.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function extractRelease(item) {
  const info  = item.basic_information;
  const catno = info.labels?.[0]?.catno ?? '';
  return {
    id:           info.id,
    title:        info.title,
    artist:       info.artists?.map(a => a.name).join(', ') ?? '',
    year:         info.year ?? null,
    genre:        info.genres ?? [],
    styles:       info.styles ?? [],
    label:        info.labels?.[0]?.name ?? '',
    catno,
    catno_num:    extractCatnoNumber(catno),
    cover_image:  info.cover_image ?? '',
  };
}

async function fetchAll() {
  console.log(`Fetching collection for ${USERNAME}…`);

  const first     = await fetchPage(1);
  const totalPages = first.pagination.pages;
  const total      = first.pagination.items;

  console.log(`${total} releases across ${totalPages} page(s).`);

  const releases = first.releases.map(extractRelease);

  for (let page = 2; page <= totalPages; page++) {
    console.log(`  Page ${page}/${totalPages}…`);
    const data = await fetchPage(page);
    releases.push(...data.releases.map(extractRelease));
  }

  return releases;
}

const releases = await fetchAll();

const outDir  = join(__dirname, '..', 'data');
const outFile = join(outDir, 'collection.json');

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(releases, null, 2), 'utf8');

console.log(`\nDone. ${releases.length} releases written to data/collection.json`);
