# thesis context (project memory)

This file holds everything needed to pick the thesis up again in a new session. Read it first, then `main.tex`. Last updated 2026-10-15.

## people and programme

- Author: Aravind Kumar (arvy). MSc Cognitive Neuroscience (MCNB), Freie Universität Berlin.
- First supervisor: Dr. Timo Torsten Schmidt, Neurocomputation and Neuroimaging Unit (Habelschwerdter Allee 45, JK 25/222d).
- Second supervisor: Prof. Felix Blankenburg, same unit (JK 25/214). His signature is needed on the registration form.
- Thesis + oral exam = 30 CP (2023 study regulations). Binding rules: §9 of the German SPO. Page limit not found online; ask the exam office (macnb@ewi-psy.fu-berlin.de) or Timo.
- Data collection affiliation: seks.design.
- Timo has offered help with pre-registration. Still to ask him for: the thesis template, the registration process, and the page limit.

## preferences (how arvy wants things)

- Emails: all lowercase, simple, short. Don't mention SomaSync to Timo. The AI pattern summaries in the dashboard are "something i put in for fun".
- Writing rule (thesis and everything else): no "not x but y" constructions or their relatives ("rather than", "not merely", "more than x: it is y", "neither x nor y" as a flourish, "x, not y", "as opposed to"). State the claim directly. Plain factual negatives ("did not differ", "was not recorded") are fine.
- Hypotheses: state directions, not "improvement". Healthy young adults rest near alpha1 ≈ 1.0, so "improves" is meaningless.
- LRC (locomotor–respiratory coupling) is background context and one candidate mechanism. It is not a required framing.
- Thesis format: LaTeX, matching Carla Vollmoeller's TU Berlin MSc thesis in length and feel.
  - Her thesis: 49 pages, ~22k words in total, ~34 pages of main text, Latin Modern, A4, ~1.15 spacing, numbered citations [n] sorted alphabetically, running header "N. CHAPTER NAME" plus the page number.
  - Her structure: Eigenständigkeitserklärung → title page → abstract + keywords → contents → 1 Introduction and Experimental Objective → 2 Background (ending in Hypotheses) → 3 Methods → 4 Offline Data Analysis → 5 Results → 6 Discussion (incl. Limitations) → 7 Conclusion → References → 8 Appendix (Abbreviations, Supplementary Tables).
- Earlier target: 40 pages at 1.5 spacing. Superseded by "like Carla's". To switch, use `\onehalfspacing` in main.tex.
- Web copy style for seks.design pages: lowercase, Space Mono, warm off-white, accent #e8501f, terse, no em dashes or double dashes.

## facts from the Timo email thread (read 2026-10-15)

- Timo left FU on 1 Apr 2026. He is now a full professor at Medical School Berlin (MSB). He wrote (30 Mar 2026): "I would assume that Felix will be your supervisor then and we should also regularly meet all three of us together." So the reviewer roles on the form (Felix first? Timo second?) need confirming.
- Timo said Campus Management now has all the required courses approved, so arvy can sign up for the MSc thesis.
- MSc thesis working time: 6 months from registration (Timo, Sep 2025). That fits the 14-week plan easily.
- Ethics:
  - Timo (Feb 2026): allow 4-6 weeks between submission and the start of data acquisition. He attached two example applications (Revision-Amendment-Schmidt.pdf, 02-...). They're confidential, not for sharing. The Word template link was missing from his email.
  - FU EWI-PSY ethics committee: apply at least 10 weeks before the study starts, by email to ethikkommission@ewi-psy.fu-berlin.de. Only department members can submit, so for a thesis the supervisor submits. Everything goes in one PDF: the form plus participant information and consent forms. Form I: https://www.ewi-psy.fu-berlin.de/verwaltung-service/gremien/kommissionen/ethik-kommission/ETHIKANTRAG_Formular-I.docx (this was blocked from the cloud session).
  - Timo's alternative (27 Feb 2026): the data are collected outside FU by arvy's company (seks.design). The company owns the data and is responsible for storage and data protection; arvy is allowed to analyse them for the thesis. Needs Felix's OK.
- Design history in the thread:
  - Nov–Dec 2025: an acute study, 2x2 (still vs spin × metronome vs silence); Timo suggested "2x2 -> 2x3".
  - Jan 2026 research workshop: Felix said "be pragmatic" and suggested a longitudinal 30-day study.
  - Mar 2026: a 5-week crossover with Apple Watch tiers.
  - Oct 2026 (now): back to an acute design with the Polar H10 (this thesis).
- Timo's notes from 23 Jan 2026: include personality (Big 5), handedness, age/sex, subjective relaxation, acute vs chronic.

## ethics draft (2026-10-15)

- `ethics/` holds the FU Form I filled in English (Ethikantrag_Kumar_draft.docx), the participant info and consent form (Teilnehmendeninfo_Einwilligung_draft.docx), and both merged as one PDF.
- Still to fill in: postal address, the first supervisor (placeholder: Felix Blankenburg, to confirm), signatures. Assumes no compensation and data on a password-protected device.
- Arvy had one call with Felix (~Aug 2026) and no follow-up meetings yet.

## registration and timeline (2026-10-15)

- Form: "Application for admission to the master's thesis" (MCNB, FU). Fields: name, student ID, cohort, personal non-FU email, phone, postal address, working title (not binding), student signature with location and date. Primary reviewer (signature = consent to supervise) and second reviewer: name, title, affiliation, signature, date.
- Attachment: proof of 60 ECTS. This is the Campus Management summary report with grades, signed by the student. Send the form and the attachment as one PDF to macnb@ewi-psy.fu-berlin.de.
- Felix hasn't been contacted yet (as of 2026-10-15). Plan: email Timo first, then Felix.
- Target: submit Thu 21 Jan 2027 (14 weeks), full draft by 31 Dec 2026. The official writing period after registration is still unknown; ask Timo or the exam office. Register on (submission date minus writing period) or later, ideally by ~30 Oct.

## design decisions 2026-10-15 (from arvy)

- Moves are done standing. Control = standing baseline: stand still holding the stick, 2 min, pre and post. Seated baseline would confound posture. The first-phase recordings may have used a seated baseline; flagged in 4.4.
- Sample: mostly experienced practitioners, a few novices (~3-5 of ~15). Expertise is analysed as a continuous score; the novice vs experienced contrast is descriptive.
- Pre-session questionnaire (~2 min): demographics, health/today, experience. Items are in the appendix; methods table 'questionnaire' maps them to hypotheses.
- Plain hypotheses: H1 the stick changes alpha1 vs standing baseline; H2 the change exceeds what the heart-rate rise explains (isolations the likeliest); H3 the shift depends on expertise.

## framing added 2026-10-15

- Isolation sticks: created 20+ years ago by Alexandre "Pich" (Le Cirque Graphique, France), influenced by Michael Moschen (rhythm and motion). Source still needed.
- Flow arts + seks.design context (experience design, somatic journaling, "somatic interfacing", embodied model of consciousness): brief paragraph in the intro.
- Steven Lehar (Gestalt Bubble model, BBS 2003; The World in Your Head 2003): one paragraph in the discussion section "Towards a Somatic Interface", paired with interoceptive inference (Seth 2013) and Craig 2002. Background reading from arvy: QRI's Lehar lineage post and smoothbrains.net "An introduction to Steven Lehar" series. These blogs aren't cited in the thesis; cite the peer-reviewed Lehar article instead.

## study history

1. **Exposé (March 2025).** "Learning to Couple": a 30-day longitudinal crossover design.
   - Daily stick + metronome practice vs stationary rest, with a washout week. N 15–20.
   - Measures: Loob motion tracking + SomaSync DFA alpha1.
   - Framing: LRC (Hoffmann 2012, Bardy 2015), fractal HRV (Goldberger 2002, Peng 1995), robustness (Kitano 2004), EightOS variability theory (Paranyushkin, 8os.io).
   - The original idea before that was an acute 2x2 (movement vs stationary × metronome vs silence).
2. **Now (autumn 2026).** Pivoted to an **acute** design. Does 2 min of stick manipulation shift DFA alpha1 vs seated rest?
3. **Current design (as written in the LaTeX):**
   - **Conditions:** condition (seated rest, isolation, spin) is within-subject. Expertise (novice vs experienced) is between-subject. Hand (L/R) is a secondary within factor.
   - **Control and testing conditions:** seated rest without the stick is the control. The stick movements are the testing conditions. Each participant is their own control.
   - **What "2x3" means:** most likely 3 conditions (rest, isolation, spin) × 2 expertise groups.
   - **Expertise:** with ~15 people, 3 expertise levels would leave ~5 per cell, which is too few. Use 2 groups, plus expertise as a continuous covariate.
   - **Sample:** 5 participants Oct 2026, ~10 more Nov–Dec 2026 across expertise levels. N ≈ 15. Power: paired, N=15 → d ≈ 0.78.
   - **Session:** pre-rest → 4 movement trials (isol L/R, spin L/R), counterbalanced, each 2 min with seated recovery after it → post-rest.
   - **HR covariate:** mean HR is a covariate, so a task effect counts only beyond what HR predicts (the intensity confound).
   - **Hypotheses:**
     - H1: task ≠ rest (two-sided).
     - H2: isolation vs spin, adjusted for HR.
     - H3: expertise moderates |Δα1| (novices larger, at matched HR).
     - Exploratory: carry-over, hand, SomaSync vs offline alpha1 agreement (Bland–Altman).
4. **Open decisions** (marked `\confirm{}` in the tex):
   - trial length: 2 min (what is recorded, auto-stop at 120 s) vs 3 min (what Timo was told);
   - recovery length;
   - counterbalancing scheme;
   - expertise items and grouping rule;
   - artifact threshold 5% vs 3%;
   - flow questionnaire instrument;
   - metronome in or out (currently out);
   - ethics approval;
   - pre-registration.

## pilot facts

- Participant 01 was pipeline-test data only. Participant 2 has isol/spin with both hands. Participant 3 has baseline only.
- SomaSync's own real-time alpha1 can differ a lot from the offline value. For example, one rest trial gave 1.209 (SomaSync) vs 1.477 (in-house). That's why the offline estimate is primary and agreement is an exploratory analysis.
- Chrome Web Bluetooth on the Mac dropped the H10 within seconds. Final chain: H10 → SomaSync (iPhone) → WebSocket :8765 → capture server :8080 → JSON per trial.

## code (this repo, branch claude/polar-h10-rr-logger-nn61um)

- `rr-logger/`: first Web Bluetooth logger. Not used for data.
- `somasync-capture/`: Node capture server.
  - Web UI for participant, condition and duration. The server auto-stops each trial.
  - Saves `<id>.json` with session_id, condition, participant_id, source, recorded_at, target_duration_s, sample_count, samples, computed_stream, plus `<id>_raw.jsonl`.
  - Output goes to `hrv-dashboard/data/sessions`.
- `hrv-dashboard/`: Flask dashboard on :5057.
  - Artifact rule: 300–2000 ms plus a 20% jump rule, then linear interpolation.
  - Metrics: HR, SDNN, RMSSD, pNN50, and DFA alpha1 (4–16 beats, linear detrend per box, min 64 beats).
  - Sliding traces use 120-beat windows with a 30-beat step.
  - Shows SomaSync's own metrics next to the dashboard's. The Claude narratives are a side feature.
- To do in the pipeline before final analysis:
  - add smoothness-priors detrending (λ=500, Tarvainen 2002);
  - switch sliding traces to time windows (2 min, 5 s step), per Rogers & Gronwald 2022 and Hoos & Gronwald 2025.

## sources

The full list is in `references.bib`. Each entry has an `x-status` (read / checked / verify) and an `x-used`.

- **Read in full (PDFs were uploaded):**
  - Goldberger 2002; Rogers & Gronwald 2022; Hoos & Gronwald 2025;
  - Schaffarczyk 2022 (H10 vs ECG, n=25: alpha1 bias grows with intensity, LoA ±~10% low and +58/−41% high);
  - Blalock 2026 (H10 vs ECG, n=43: time-domain HRV interchangeable, but no DFA tested);
  - Hoffmann 2012; Hoffmann & Bardy 2015; Bardy 2015; Ruiz-Blais 2020;
  - Trappe 2010; Trappe & Voit 2016; Cervellin & Lippi 2011; Dillman Carpentier & Potter 2007;
  - Bernardi 2009; Butkow 2024 (EarTune).
  - Wright et al. 2022 (Cambridge Element) was uploaded but only skimmed.
- **Flagged `\verify{}` in the text:**
  - Chen 2002 (exact 2-min claim);
  - Karasik 2002 (direction);
  - Cassirame 2025 (findings);
  - de Manzano 2010 and Keller 2011 (direction of HRV effects);
  - whether the stabilise/destabilise-by-starting-state finding is in Bardy 2015 or Hoffmann 2012.
- **Missing:** a verified source for short-term DFA under psychological stress (marked `\todo{}`).
- Carla's thesis PDF was uploaded as the style reference.

## writing status (2026-10-15)

- Drafted: declaration, title page, abstract skeleton, 1 Introduction, 2 Background (full, ~4.5k words, incl. gap + hypotheses), 3 Methods, 4 Offline Data Analysis, 6 Discussion (pre-specified readings plus prose skeleton), appendix.
- Placeholders: 5 Results, 7 Conclusion, abstract results.
- Compiles to ~31 pages (~20 pages of main text). Target is ~34 pages of main text, like Carla's, once results and discussion are written.
- AI disclosure: the declaration has a paragraph on generative AI tools (as in Carla's). Arvy must list the tools used (drafting, code). FU rules require this.
- There is also a Claude Doc version (planning companion and citation table): https://claude.ai/code/artifact/c940d603-f389-48ac-a4b4-2ade09b83e6d. The LaTeX here is now the master text.
