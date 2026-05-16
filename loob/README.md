# the 8 — relay setup

## first time only

```
git clone https://github.com/daftpants10/seks.git
cd seks/loob
npm install
```

## every time

```
cd ~/seks/loob
node relay.js
```

Then open `http://localhost:3000` in your browser.

---

## running on hotspot (Mac → iPhone/iPad)

Use **Mac hotspot**, so the iPhone can reach the Mac directly.

### 1. turn on internet sharing

Mac: **System Settings → General → Sharing → Internet Sharing**

| setting | value |
|---|---|
| Share from | Wi-Fi (or Ethernet if available) |
| To computers using | Wi-Fi |

Turn Internet Sharing **on**.

### 2. find Mac IP on the hotspot

In a new terminal tab:

```
ipconfig getifaddr bridge100
```

Usually prints `192.168.3.1`

### 3. connect iPhone/iPad

iPhone/iPad: join the Wi-Fi network your Mac just created (named after your Mac).

### 4. SomaSync streaming settings

| field | value |
|---|---|
| Stream To | WebSocket |
| Server | Custom |
| IP | 192.168.3.1 (from step 2) |
| Port | 8765 |
| Insecure | ON |

### 5. open the game on iPad

Safari: `http://192.168.3.1:3000`

---

## quick reference

| what | address |
|---|---|
| game (localhost) | http://localhost:3000 |
| game (hotspot) | http://192.168.3.1:3000 |
| SomaSync port | 8765 |
| browser port | 3000 |

---

## adding music tracks

Drop audio files into `seks/loob/` named:

```
seks_track_1.mp3
seks_track_2.mp3
...
seks_track_8.mp3
```

Supported formats: mp3, wav, ogg, m4a, flac
