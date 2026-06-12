// Run once: node seed-time-compass.js
// Seeds the database with Time Compass origin timeline entries.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'research.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imported_at TEXT NOT NULL,
    chat_date TEXT,
    raw_text TEXT NOT NULL,
    title TEXT,
    tags TEXT DEFAULT '[]',
    project TEXT DEFAULT 'stick'
  );
  CREATE TABLE IF NOT EXISTS excerpts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id INTEGER REFERENCES imports(id),
    content TEXT NOT NULL,
    position INTEGER
  );
`);
try { db.exec(`ALTER TABLE imports ADD COLUMN project TEXT DEFAULT 'stick'`); } catch (e) {}

const entries = [
  {
    date: "2018-01-11",
    title: "Culture and Context in Psychology: Listening to Listeners — Abu Dhabi & Ethiopia",
    tags: ["origin", "fieldwork", "listening-to-listeners", "cultural-context", "genesis"],
    body: `My first real introduction to listening as something you could study happened not in a music class but in a psychology intensive. Niobe Way's Culture and Context in Psychology at NYU Abu Dhabi ran for three weeks in January 2018, and one of those weeks took the class to Addis Ababa, Ethiopia, where we interviewed tutors at the Medhen Social Center. The core texts — Bronfenbrenner's ecology of human development, Rogoff on the cultural nature of development, Way's own Deep Secrets on boys' friendship and the crisis of connection — all circled the same question: how does the context around you shape who you become and how you relate?

The Ethiopia fieldwork made this visceral. Sitting across from someone whose world is structurally different from yours and trying to actually listen — not just hear — was the first time I treated listening as a skill with technique, not just a passive backdrop. The insight that stayed with me: the way someone listens is a window into their whole ecology. Who surrounded them, what sounds they grew up with, what relationships they formed. Listening is a cultural artefact, not a neutral reception. I didn't have the vocabulary for it yet, but I started thinking: if you could trace the listening patterns of a person back to their genesis — their cultural origin point — what would you find?

This is the first seed of what eventually became Time Compass.`
  },
  {
    date: "2019-02-05",
    title: "The Age of Listening: Judith Becker, Habitus, and Listening as Space-Time Phenomenon",
    tags: ["habitus", "Becker", "deep-listening", "space-time", "pattern", "Ratliff"],
    body: `Spring 2019. Ben Ratliff's advanced writing seminar at NYU — The Age of Listening — was ostensibly a class about writing criticism, but the first real reading assignment cracked something open. Judith Becker's "Habitus of Listening" from Deep Listeners argued that the way you listen is not something you consciously choose. It's a learned posture, absorbed through imitation of the people around you, shaped by your environment, as automatic as your accent. "Most of our styles of listening have been learned through unconscious imitation of those who surround us and with whom we continually interact."

This hit me because I'd been going to electronic music events for years — deep listening to rominimal in particular — and I'd always felt that something was happening in those spaces that wasn't just about the music. Becker gave me the language: listening habitus is a space-time phenomenon. When someone listens deeply, the life around them changes. The room reorganises itself around the act of attention.

The class also had us map our own listening habitus — describe it honestly, in 750 words. That exercise was the first time I tried to trace my listening patterns backward: where did I learn to hear what I hear? What does my listening history reveal about my genesis? Ratliff's other assigned reading — about the playlist, the algorithm, the DJ — framed the same question algorithmically: if a DJ can read a room and know what to play next, could a system read a listener and know what to offer them? These two threads — the cultural depth of habitus and the algorithmic logic of curation — started braiding together.`
  },
  {
    date: "2020-05-19",
    title: "Sunset in Bucharest: Rominimal and the Cross-Generational Thread of Minimalism",
    tags: ["rominimal", "minimalism", "cognitive-praxis", "cross-generational", "tradition", "MHH"],
    body: `For my Music Histories and Historiography final paper (Spring 2020, Prof. Bravo, NYU), I researched rominimal — the Romanian electronic minimal music scene. I titled it "Sunset in Bucharest." What started as a genre biography became something more interesting: a case study in how a single aesthetic thread — minimalism — runs continuously through a culture across wildly different mediums and generations.

The thread was: Brâncuși's sculpture (early 1900s) → George Enescu's violin compositions (1920s–40s) → Johnny Raducanu's jazz (1960s) → the rominimal producers of the 2000s. Same cognitive praxis, different medium, different century. Each generation inherited the reductionist impulse — "amplification of effect through reduction of means" — and reapplied it to the sounds available to them.

The theoretical frame was Eyerman & Jamison's concept of mobilizing musical traditions: traditions are not static, they're a "process of connecting a selected or usable past with the present." When social movements rupture a culture — communist revolution, then capitalist revolution in Romania's case — artists reach back into collective memory and rework traditions to make sense of the new present. Music becomes a temporal cue that enters collective memory.

This gave me my most important concept for Time Compass: if minimalism could be traced as a continuous thread across 100 years and multiple mediums in Romania, then every listener carries forward threads from their own cultural genesis. Listening history is not random. It has patterns. And those patterns extend outward from a point of origin.`
  },
  {
    date: "2023-06-01",
    title: "The Synthesis: Four Years of Listening Research Have a Common Thread",
    tags: ["synthesis", "genesis", "time-compass", "origin", "pattern-recognition", "pivot"],
    body: `June 2023. I was going through old coursework and fieldwork notes and I saw it for the first time: everything I had been studying for four years was the same question asked in different registers.

In Abu Dhabi and Ethiopia (2018): how does your cultural context shape how you relate and connect?
In Ratliff's class (2019): what is the habitus of your listening, and where did it come from?
In the MHH paper (2020): how does a minimalist thread persist across generations and mediums in a single culture?
In the listening-to-listeners sessions I'd started running informally: what patterns emerge when you sit with someone and trace their music backward through their life?

The answer in each case was the same: there is a genesis point. A cultural origin, a moment of formation, a sonic ecology you were born into. And from that point, patterns radiate outward — across time, across mediums, across generations. You don't listen randomly. You listen along grooves carved by everything that came before you.

The name came naturally: Time Compass. Not a music recommender. A compass for time. Given your listening history — as a function of your life and your genesis — it should be able to discover the patterns radiating outward from your origin point, and use those to surface tracks, or context for tracks, that resonate at the right frequency for who you actually are. The question wasn't "what is popular" or "what is similar." It was: where do you come from, and what does that point toward?`
  },
  {
    date: "2023-09-01",
    title: "Time Compass v0: A Compass for Time, Genesis Outward",
    tags: ["concept", "time-compass", "listening-history", "genesis", "pattern", "recommendation"],
    body: `The concept, as I'm holding it now: Time Compass is a tool for discovering musical patterns as a function of your life.

The premise is that your listening history is not noise — it's a signal. Embedded in the tracks you've loved are threads connecting back to your cultural genesis: where you grew up, what surrounded you, the emotional texture of specific years, the scenes and communities you moved through. These threads extend forward too. What you haven't found yet is probably reachable along the same lines.

The mechanism I'm imagining: you input your listening history — Spotify exports, RateYourMusic lists, anything timestamped. The system finds patterns — not genre clusters, not audio features alone, but temporal patterns. What were you listening to at 15? At 22? How did your taste evolve, and what did it evolve toward? Where are the discontinuities — the moments of rupture where your habitus shifted — and what was happening in your life then?

From those patterns, Time Compass would generate a map: your moment of genesis and the tracks and contexts that radiate outward from it. It could surface music you've never heard that belongs to your thread. It could give you language for your listening identity — not a genre tag, but a cultural and temporal description of who you are as a listener.

This is early. The concept is solid; the technical shape is still forming. But the north star is clear: a compass for time, using music as the needle.`
  }
];

const insertImport = db.prepare(
  'INSERT INTO imports (imported_at, chat_date, raw_text, title, tags, project) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertExcerpt = db.prepare('INSERT INTO excerpts (import_id, content, position) VALUES (?, ?, ?)');

let count = 0;
for (const entry of entries) {
  const info = insertImport.run(
    new Date().toISOString(),
    entry.date,
    entry.body,
    entry.title,
    JSON.stringify(entry.tags),
    'time-compass'
  );
  insertExcerpt.run(Number(info.lastInsertRowid), entry.body, 0);
  count++;
}

console.log(`Seeded ${count} Time Compass timeline entries.`);
console.log('Start the server with: npm start');
