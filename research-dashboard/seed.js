// Run once: node seed.js
// Seeds the database with initial thesis timeline entries.

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
    tags TEXT DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS excerpts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id INTEGER REFERENCES imports(id),
    content TEXT NOT NULL,
    position INTEGER
  );
  CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    published_at TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    images TEXT DEFAULT '[]'
  );
`);

const entries = [
  {
    date: "2025-09-08",
    title: "Origin: from lab-rotation narrative review toward an NMDAR thesis",
    tags: ["origin", "entropic-brain", "NMDAR", "ketamine", "literature-review"],
    body: `Project starts as a theory-first neuroscience thesis, growing out of the narrative literature review done in the lab rotation (Finke lab, with Amy as proposed advisor). The intended build was a systematic literature review of the NMDA receptor within the entropic brain model — arguing that altered states involving NMDAR antagonism/internalisation can be folded into a glutamatergic account of entropy. A fallback empirical option was floated: a comparative analysis of temporal complexity in resting-state fMRI under glutamatergic antagonism (NMDAR encephalitis patients vs. healthy subjects during ketamine infusion). Crucially, the whole effort is running under acute external pressure — residency/visa expires 30 Sept and completing/terminating the MSc is tied to a post-graduate visa, which is why 'fastest defensible thesis' becomes a recurring constraint. No data, no design yet; this is a scoping phase about what counts as a passable thesis and who supervises.`
  },
  {
    date: "2025-11-26",
    title: "Pivot to the ⦿-⦿ stick: gesture → emotion as the first empirical hypothesis",
    tags: ["pivot", "embodied-cognition", "stick", "Genki-Wave", "tool-use"],
    body: `Hard pivot away from the NMDAR theory thesis to an embodied-cognition empirical project built around the ⦿-⦿ stick — a ~50 cm PMMA rod with weighted ends for rhythmic upper-limb movement, already circulating in an informal R&D cohort (~23 sticks distributed globally since mid-2023; ~33-member community). First framed as 'building an embodied memory interface.' Initial hypothesis: predict emotional state (or response to emotional stimuli) from gesture-based movement. Early design talk covered ceiling effects and the tool-use learning curve, candidate conditions (baseline / music / music+beat / beat-only), and synchrony vs. dissociation between stick movement and heartbeat. Genki 'Wave' ring used for gyro tests; a prototype mapped stick motion to sensor data. Faculty steer: do a replication of an existing cognitive-psych experiment augmented with a lightweight physiological signal — convert a 2×2 to a 2×3. This is the move from 'theory about brains' to 'a tractable behavioural+physio experiment I can actually run.'`
  },
  {
    date: "2025-12-01",
    title: "Reframe around HRV and entrainment; orthogonal 3×2 proposal",
    tags: ["HRV", "entrainment", "phase-synchrony", "respiration", "community-sample"],
    body: `The emotion-prediction angle gives way to a physiological-entrainment framing. Literature overview centres on entrainment effects and heart-rate/breathing relationships, distinguishing two entrainment types (amplitude amplification vs. entraining HRV to a stimulus / phase synchrony), plus individual- vs. group-level physiological differences, and embodied-counting precedents (e.g. rosary beads). Proposed an orthogonal ~3×2 design: (1) replicate HR–breathing sync, (2) spin the stick to music synced with breathing, (3) spin async with breathing. Participant pool identified as the ⦿-⦿ community (~33 members, ~12–15 reachable in Berlin). Began device scoping for HRV capture (NeXus, consumer HRV hardware). Timo shares an ethics-approval amendment as a template. The hypothesis object has now firmly become a physiological signal (HRV / respiratory coupling) rather than emotion or memory.`
  },
  {
    date: "2025-12-30",
    title: "LRC literature grounds the project; acute 2×2 within-subjects lab design crystallises",
    tags: ["LRC", "2x2", "within-subjects", "acute", "RMSSD", "metronome", "exposé"],
    body: `The project gets its scientific spine: locomotor–respiratory coupling (LRC). Anchors are Hoffmann et al. (2012), Hoffmann & Bardy (2015), Bardy et al. (2015), and Amazeen et al. (2001) — the one widely-cited upper-limb LRC paper. The identified gap: LRC is well-established for lower-limb, high-metabolic activity (cycling, walking) but untested for low-metabolic, structured upper-limb rhythmic movement. Research question: does rhythmic auditory cueing entrain breathing during stick movement independent of metabolic demand? Design lands as an acute, controlled 2×2 repeated-measures within-subjects lab study — Factor A movement (spin vs. still) × Factor B audio (metronome vs. silence), N≈10 stick-naïve adults, per-condition baseline→activity→recovery blocks (~45 min total). Primary DV: RMSSD (ΔRMSSD recovery−baseline). H1: spin+metronome → more stable LRC ratios and higher RMSSD; H2: rhythmic conditions → higher recovery RMSSD; H3 (exploratory): spin+metronome → higher MAIA interoception. Timo's feedback (1 Jan): 2×2×2 is too complex/long; keep the first study as simple as possible; metronome OR breathing-control, not both; add personality traits (~15 min, possibly online pre-screen). Reframed as the focus shifting from 'meditative/fidget HRV modulation' to a clean entrainment test. Admin spine set: Research Workshop colloquium 29–30 Jan; 10-page exposé due 31 Mar.`
  },
  {
    date: "2026-01-30",
    title: "Research Workshop colloquium: faculty push toward something simpler and more pragmatic",
    tags: ["colloquium", "feedback", "feasibility", "pivot-trigger"],
    body: `Presented the planned thesis at the two-day MSc Thesis Colloquium (Felix + Timo + cohort). The acute lab 2×2 is feasible but the feedback nudges toward a pragmatically simpler, lower-equipment design and a question with more longitudinal/real-world reach. This is the hinge that triggers the next pivot: the bottleneck is no longer 'is the hypothesis interesting' but 'can this actually be built, ethically approved, and run on the available timeline and budget.' Marks the transition from designing an in-lab acute experiment to designing something the community can generate data with outside the lab.`
  },
  {
    date: "2026-02-25",
    title: "Longitudinal / citizen-science pivot: DFA alpha1, Loob tracking, 8os/SomaSync, data-ownership route",
    tags: ["longitudinal", "DFA-alpha", "fractal-HRV", "Loob", "8os", "SomaSync", "data-ownership", "tiers"],
    body: `Confirms the longitudinal direction after the workshop. The core question moves from 'does acute entrainment occur under controlled conditions' to 'do movement–breath coordination and autonomic regulation change measurably over repeated daily practice, and are individual learning trajectories detectable.' LRC is reconceived as a trainable psychophysiological skill rather than an acute phenomenon. Primary outcome shifts from RMSSD to DFA alpha1 — fractal HRV, with the adaptive zone ~0.75–1.0 (target drift toward ~1.0) — grounding the project in the variability/complexity literature (Peng 1995, Goldberger 2002, Gronwald & Hoos 2020, Rogers 2021, Schaffarczyk 2022). Built and deployed Loob, a browser/webcam MediaPipe motion-tracker capturing RPM, smoothness, grip width and session duration with JSON export. Began collaborating with EightOS (Dmitry Paranyushkin): SomaSync computes fractal HRV (DFA alpha) from Polar H10 (Apple Watch as fallback), and their panarchy variability model (uniform→regular→fractal→complex) maps onto the rhythmic-regulation hypothesis (note: EightOS itself does not use sticks). Timo proposes a data-ownership route — data collected outside the university could belong to seks.design and be analysed under an academic agreement with FU, easing the equipment burden and ethics path. Tiering introduced: Tier 1 (Apple Watch, proof-of-concept, no budget) vs. funded Tier 2 (Polar H10, larger N; Transfer BONUS funding being pursued).`
  },
  {
    date: "2026-03-18",
    title: "5-week counterbalanced longitudinal crossover written up; washout and device questions surface",
    tags: ["longitudinal-crossover", "washout", "counterbalanced", "tier1-tier2", "control-condition", "feedback-questions"],
    body: `The pivot is formalised as a 5-week counterbalanced within-subjects crossover. Group A: stick weeks 1–2, washout week 3, control weeks 4–5; Group B reversed; HRV wearable worn throughout, daily ~5-min self-directed naturalistic sessions, motion via Loob, HRV via SomaSync, MAIA/PANAS pre/post each phase. Primary hypothesis: daily ⦿-⦿ practice produces progressively more stable movement regularity and a measurable DFA alpha1 shift over 30 days; secondary: RMSSD rises in the stick vs. stationary control; exploratory: individual trajectories correlate with baseline DFA alpha and movement regularity. Four open design questions flagged to supervisors: (1) keep metronome fixed (stick-always-with-metronome) rather than adding it as a factor, since the metronome effect is already established in acute LRC but weakly motivated longitudinally — avoids a costly 3×2; (2) which stationary control — unstructured movement, a non-rhythmic structured task, or seated rest (each changes the causal claim); (3) Tier-1 Apple-Watch device standardisation, acknowledging optical PPG/SDNN is noisier than ECG-grade RR for DFA; (4) whether a 1-week washout is sufficient given trait-level changes may not wash out — flagged as unsupported by literature he could find. This is the most fully specified version of the longitudinal design and the one whose internal tensions (washout validity, daily-baseline drift) drive the final collapse to a within-subjects structure.`
  },
  {
    date: "2026-03-30",
    title: "Supervision change: Timo → Medical School Berlin; Felix becomes primary supervisor",
    tags: ["supervision", "MSB", "handover", "proposal-revision", "admin"],
    body: `Timo announces he has taken a full professorship at Medical School Berlin (MSB), effective 1 April, so supervision shifts: Felix becomes the FU primary supervisor and the three plan to meet together going forward. Administratively positive — all outstanding coursework approvals are in Campus Management, so registration for the MSc thesis is unblocked, and Felix still needs to sign off on the out-of-university data-acquisition route. Substantive ask: cut the proposal down — lead with the main design, fewer slides, a plainer/'boring' conventional structure, and tighter operationalisation and N. The signal: the longitudinal proposal had grown too elaborate to evaluate quickly; the next move is consolidation, not expansion.`
  },
  {
    date: "2026-04-10",
    title: "Design collapses to a within-subjects crossover with within-session control; biofeedback app built",
    tags: ["within-subjects", "crossover", "within-session-control", "biofeedback", "DFA-alpha1", "Polar-H10", "completion-time"],
    body: `The 5-week longitudinal crossover with its problematic washout week is replaced by a tighter within-subjects design. Two moves resolve the earlier tensions: (a) a within-session control — each ~6-min session is 2 min rest (HRV baseline) + 2 min stick + 2 min matched movement control (same plane and effort, no stick), which removes the washout problem entirely and controls for daily baseline variation; and (b) a within-subjects crossover operationalised through a browser biofeedback 'game': a 300-second audio-visual track that only advances while the participant holds the adaptive DFA-alpha zone (0.75–1.0), with a 30-second grace period, so trial completion time becomes a clean behavioural proxy for ease of self-regulation. Condition A = biofeedback + stick (two-hand wield); Condition B = same biofeedback + free arm movement, no stick. Primary hypothesis: the stick produces a greater parasympathetic response (DFA alpha1 / RMSSD rising from rest baseline) and faster zone access / completion time vs. matched control. Stack: JavaScript, Web Bluetooth → Polar H10, client-side DFA alpha from the live RR stream, Web Audio + canvas; full IBI series, rolling DFA alpha, zone events, time-per-zone and completion time exported as JSON per trial. Apple Watch is now ruled out (no real-time RR streaming); a single Polar H10 rotates across participants — which is exactly what makes a larger, multi-setting sample feasible. Rationale stated to supervisors: the crossover needs only one rotating sensor and lets many more people be tested across settings in the same window, raising generalisability over a single longitudinal cohort.`
  },
  {
    date: "2026-05-25",
    title: "Pilot-then-power plan locked; data collection set to begin June 1",
    tags: ["pilot", "power-analysis", "GPower", "paired-t-test", "sample-size", "data-collection"],
    body: `Final operational plan before fieldwork: run a formal pilot of 5 participants to estimate the effect size between conditions, then a paired t-test power analysis in G*Power (alpha 0.05, power 0.80) to set the real N — rather than asserting a number up front. Working target is up to ~30 participants across June, feasible because the single Polar H10 rotates across community settings and sessions run ~15 min. The 2-min resting baseline inside the session was reconsidered and dropped as redundant, since DFA alpha is computed continuously from trial start — the trial itself is the measurement. Pre/post instruments cover demographics, stick and biofeedback familiarity, physical state, zone-access ease, body awareness and open somatic responses. Data collection scheduled to start 1 June. This is the point where the design stops moving and execution begins: a within-subjects crossover, fractal-HRV primary outcome, pilot-calibrated sample size, single-sensor logistics.`
  }
];

const insertImport = db.prepare(
  'INSERT INTO imports (imported_at, chat_date, raw_text, title, tags) VALUES (?, ?, ?, ?, ?)'
);
const insertExcerpt = db.prepare('INSERT INTO excerpts (import_id, content, position) VALUES (?, ?, ?)');

let count = 0;
for (const entry of entries) {
  const info = insertImport.run(
    new Date().toISOString(),
    entry.date,
    entry.body,
    entry.title,
    JSON.stringify(entry.tags)
  );
  insertExcerpt.run(Number(info.lastInsertRowid), entry.body, 0);
  count++;
}

console.log(`Seeded ${count} thesis timeline entries.`);
console.log('Start the server with: npm start');
