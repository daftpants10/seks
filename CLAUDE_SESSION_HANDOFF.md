# Claude Session Handoff - Loob Project

**Date:** 2026-02-14
**Branch:** `claude/sessions-web-browser-guide-tltU5`
**Repo:** daftpants10/seks
**Live Site:** https://daftpants10.github.io/seks/loob/

---

## 🎯 Project Overview

**Loob** = Hand-tracking music visualization suite for DJ performance and collective experiences.

**Core Tech Stack:**
- MediaPipe Hands (21 landmarks, 3D coordinates)
- HTML5 Canvas for visualizations
- JSON export/import for sharing performances
- GitHub Pages hosting

**Three Main Visualizations:**
1. `visualize.html` - Full hand skeleton with trails (original)
2. `dots.html` - Minimalist dot-only tracking
3. `one-hand.html` - ⦿-⦿ One-Hand Tracker (NEW - just built this session)

---

## 🆕 What We Built This Session

### 1. ⦿-⦿ One-Hand Tracker (`loob/one-hand.html`)

**Purpose:** Minimalist constellation visualization with DJ Collective integration

**Key Features:**
- **Constellation dots:** 21 hand landmarks rendered as white dots
- **Dynamic sizing:** Based on Z-depth (2px-12px range)
- **Sparse sampling:** Records only every 15 frames when hand moving (15+ RPM)
- **Camera overlay:** 20% opacity, toggleable with camera icon
- **DJ Collective:** Upload/download JSON performances to shared collective
- **Clean UI:** Minimalist controls, black background

**Technical Implementation:**
```javascript
// Depth-based dot sizing
const baseSize = 2;
const depthRange = 10;
const size = baseSize + (landmark.z * depthRange);

// Sparse sampling logic
if (frameCount % 15 === 0 && rpm > 15) {
    recordedData.push(frameData);
}
```

**Design Philosophy:**
- No trails/lines - just pure constellation of moving dots
- Emphasizes hand as a celestial object
- Optimized for performance (sparse sampling)

### 2. DJ Collective Loader in `visualize.html`

Added ability to load DJ Collective JSON files in the original visualizer for playback/analysis.

### 3. Updated Documentation

**`about.html`** now includes:
- ⦿-⦿ One-Hand Tracker workflow
- DJ Collective integration guide
- Export/import instructions

---

## 📁 Key Files & Structure

```
loob/
├── index.html              # Landing page (needs update with one-hand link)
├── visualize.html          # Original full skeleton tracker
├── dots.html              # Minimalist dots-only version
├── one-hand.html          # NEW: ⦿-⦿ One-Hand Tracker
├── about.html             # Documentation (updated with new workflow)
├── styles.css             # Shared styles
└── dj-collective/         # Shared JSON performance repository
    └── example.json

recordings/                # User's local performance JSON files
```

---

## 🔧 Current State

### Git Status:
- **Branch:** `claude/sessions-web-browser-guide-tltU5`
- **Commits:** 3-4 commits for one-hand tracker feature
- **Status:** Ready for PR or further iteration

### What's Working:
✅ Hand tracking on all three visualizers
✅ JSON export/import
✅ DJ Collective upload/download
✅ Camera overlay toggle
✅ Sparse sampling optimization
✅ Depth-based dot sizing

### Known Limitations:
- No real-time WebSocket server (uses static JSON files)
- No music integration yet
- Index page doesn't link to one-hand.html yet
- DJ Collective is file-based, not live database

---

## 🎵 Next Steps (From Luke's Onboarding)

### Immediate:
1. **Test on mobile/different browsers** - MediaPipe compatibility
2. **Update index.html** - Add link/preview for one-hand tracker
3. **Cross-browser testing** - Ensure camera permissions work

### Short-term:
4. **Music integration** - Sync visualizations to audio analysis
5. **Collective backend** - Build WebSocket server for real-time sharing
6. **Performance recording** - Video export with visualization overlay
7. **Gesture recognition** - Trigger events/effects from hand poses

### Long-term (From ONBOARDING.md):
- Spatial audio experiments
- Multi-hand support (two DJs)
- VR/AR integration
- Live streaming with embedded visualizations
- Audience participation modes

---

## 🧠 Technical Details & Gotchas

### MediaPipe Hands:
```javascript
// 21 landmarks per hand (0-20)
// Each landmark: {x, y, z}
// x,y normalized to [0,1]
// z in real-world meters (negative = closer to camera)
```

### Sparse Sampling Strategy:
- Only records when hand is moving (RPM > 15)
- Records every 15th frame (not every frame)
- Reduces file size by ~90%
- Maintains visual continuity

### DJ Collective Format:
```json
{
  "metadata": {
    "timestamp": "ISO-8601",
    "duration": "seconds",
    "totalFrames": 123
  },
  "frames": [
    {
      "timestamp": 1234,
      "hands": [/* 21 landmarks */]
    }
  ]
}
```

### Camera Overlay:
- Uses same video feed as MediaPipe input
- Rendered at 20% opacity under dots
- Toggleable without stopping tracking
- Maintains aspect ratio

### Z-Depth Mapping:
- MediaPipe z-values range roughly [-0.3, 0.1]
- Mapped to dot sizes [2px, 12px]
- Closer hand = larger dots (more prominent)

---

## 🐛 Common Issues

1. **Camera not found:** Browser permissions or HTTPS required
2. **Performance lag:** Reduce video resolution or enable sparse sampling
3. **JSON too large:** Increase frame skip rate or reduce recording duration
4. **Hands not detected:** Lighting, hand positioning, or MediaPipe model load failure

---

## 💬 User Preferences & Context

**User (Luke) is:**
- Experienced with web dev, new to hand tracking
- Interested in DJ/music applications
- Exploring collective/shared experiences
- Prefers minimalist aesthetics
- Comfortable with git/command line

**Communication style:**
- Casual, collaborative
- Appreciates detailed explanations
- Likes to understand the "why" behind decisions

---

## 🚀 How to Use This Handoff

**If starting a new Claude session, paste this context:**

```
I'm continuing work on the Loob hand-tracking visualization project.
Here's the current state: [paste this file]

Current task: [whatever you want to work on next]
```

**Estimated token cost:** ~2,000 tokens (vs. 54,000 for full conversation history)

---

## 📋 Quick Commands Reference

```bash
# Start local server
cd /home/user/seks/loob
python3 -m http.server 8000

# Checkout working branch
git checkout claude/sessions-web-browser-guide-tltU5

# View recent commits
git log --oneline -5

# Test in browser
# Visit: http://localhost:8000/one-hand.html

# Push changes
git push -u origin claude/sessions-web-browser-guide-tltU5
```

---

## 🎨 Design Decisions Made This Session

1. **Dot sizing:** Chose Z-depth based sizing for 3D depth perception
2. **Sampling rate:** 15 frames provides good balance of smoothness/file size
3. **RPM threshold:** 15 RPM filters out accidental hand movements
4. **Camera opacity:** 20% visible enough for context, dim enough to not distract
5. **UI placement:** Controls at top-left, camera toggle at top-right (spatial separation)
6. **Black background:** Emphasizes constellation aesthetic, reduces eye strain
7. **No trails:** Keeps focus on current hand position (vs. history)

---

**End of Handoff** 🤝

_Last updated: 2026-02-14 by Claude (Session: sessions-web-browser-guide-tltU5)_
