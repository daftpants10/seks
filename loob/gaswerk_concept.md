# ⦿-⦿ × gaswerk — flow activation concept

*internal working doc · seks.design · draft v1*

---

## the ask

Gaswerk festival, end of July (24–26 + 30–Aug 2). ~2000 people across the days.
A "zone of curiousness" — a flow stand where people explore movement, try the stick,
and we test ⦿-⦿ + loob in a live festival context. One or more days, our choice.

## the one-liner (for the organizer)

> A flow station where your movement becomes light. Pick up a stick, move freely, and
> a living sculpture grows from the collective nervous system of everyone who plays.
> Strap on a sensor and your true autonomic colors are revealed. By the end of the
> festival, the sculpture is a portrait of the whole crowd's flow.

---

## the physical stand

- small table, nice cloth, a few sticks (sekstoys), low-tech, inviting
- one webcam pointed at the play area
- one laptop running ⦿-⦿ (hidden / minimal — we want to minimize visible computer)
- a physical object — globe / pyramid / obelisk — with a projector mapping onto it
  - **indoor:** projection-map onto the physical object (snow-globe effect)
  - **outdoor (daylight):** fall back to a screen / LED panel
- optional: 1–2 Polar H10 straps for people who want the full experience

## the two-tier mechanic

**tier 1 — body only (no sensor, default):**
- webcam + MediaPipe pose tracks movement
- movement energy / smoothness drives the signal
- present + moving → their form fills **green**
- zero setup, anyone walks up, no strap, no login

**tier 2 — with Polar H10 (the unlock):**
- autonomic layer comes alive (DFA alpha 1 / RMSSD)
- full color range: green = flow, purple = tension, yellow/red = other zones
- their form becomes a true composite of inner state
- this is the upsell → stick + sensor + loob membership

> "move, and you glow green. wear the sensor, and you reveal your true colors."

## the collective visual

- each session = one **pyramid / ring**
- edges colored by **phase composite**: 70% flow → 70% green edges; 30% tension → 30% purple
- sessions accumulate into a growing **mega-structure** (pyramid of pyramids)
- projection-mapped onto the physical object
- over the festival it becomes a visible record of the collective state
- = loob as collective memory interface (the MOOS vision, made physical)

## loob connection

- no-sensor players: their green form joins the collective, anonymous
- if they want to keep their reading → QR → claim into loob (one-time link)
- sensor players: richer entry, full color portrait, stronger pull into membership
- the festival is the top of the funnel: experience → curiosity → loob signup

---

## what's already built vs what we build

**already in the-8.html:**
- webcam + MediaPipe pose tracking (`togglePose`, full landmark skeleton)
- DFA alpha 1 + RMSSD from Polar H10 / SomaSync
- phase/zone timing (recovering / regular / adaptive-flow / tension)
- per-session data capture + auto-save + QR on complete screen

**to build for gaswerk:**
1. **movement-only signal** — derive a flow proxy from pose landmark velocity/smoothness
   so the game runs with no HRV sensor (stays green)
2. **the collective visual** — a separate full-screen view that renders accumulated
   pyramids, colored by each session's phase composite
3. **projection-mapping output** — clean fullscreen canvas, mappable onto object/screen
4. **kiosk flow** — no forms, instant start, auto-reset for the next person, optional
   QR-to-loob at the end

## open decisions

- [ ] physical object: globe / pyramid / obelisk? (drives the projection geometry)
- [ ] indoor (projection) or outdoor (screen)? affects everything visually
- [ ] one form per session, or do forms morph/merge into one organism over time?
- [ ] how many sensors do we bring? (1–2 for "premium" lane vs all body-only)
- [ ] which days — one taster day, or the full run?
- [ ] do we want Harry / other flow creatures co-hosting the stand?

## logistics

- dates: 24–26 July + 30 July–2 Aug
- scale: ~2000 over the days
- footprint: 1 table, 1 webcam, 1 laptop, 1 projector, physical object, sticks
- power: need a socket + ideally shade/cover for the projection to read
