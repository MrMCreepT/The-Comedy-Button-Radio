# Player Waveform Visualizer, OLED Theme & Storage Manager

Implement three high-impact enhancements tailored for mobile listeners and static GitHub Pages hosting: an interactive dynamic audio waveform visualizer in the full-screen player drawer, an optional pure-black OLED theme for contrast and battery savings, and an offline storage quota dashboard with bulk cache management.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product choices have been confirmed based on your selections:
> - **Playback & Player Enhancement**: Live dynamic audio waveform visualizer integrated directly into the full-screen/mobile player drawer with animated equalizer bars, responsive frequency ripples, and scrub-responsive visual feedback.
> - **Visual Aesthetics & Theme**: Clean dark theme maintained as default, with an optional one-tap **OLED Pure Black mode** (`#000000` true blacks, pitch-dark cards, crisp borders, and zero-glow battery saver for OLED mobile displays) persisted in `localStorage`.
> - **Offline Management**: Dedicated **Storage & Downloads Manager** with real-time browser quota metrics (`navigator.storage.estimate()`), per-episode cache sizes, single-tap bulk deletion, and quick bulk download queues for upcoming or unplayed episodes.

---

## 1. Overview & Core Concept

### What It Does
1. **Interactive Audio Waveform Visualizer**: When expanding the player sheet on mobile or opening the expanded player view, listeners see an organic, real-time waveform visualizer that reacts to playback state, tempo, and volume, transitioning to subtle resting waves when paused and reactive surges during energetic talk.
2. **OLED Pure Black Mode**: A high-contrast theme toggle accessible via the header navigation and settings, transforming the UI from deep navy/slate (`#0c0e14`) to pitch-black (`#000000`) with optimized border contrast (`#1c1f2e` -> `#222222`), minimizing power consumption on OLED phone screens.
3. **Storage Quota & Offline Cache Dashboard**: An accessible management modal giving listeners full transparency and control over their offline audio storage:
   - Total device storage used vs. available browser quota (e.g. `184 MB / 15.2 GB`).
   - Sorted list of downloaded episodes with exact file size badges and date saved.
   - One-tap "Download Next 3 Episodes" queue.
   - Bulk "Clear All Cached Audio" with instant storage reclamation.

### Target Audience & Persona
- Daily commuters and mobile listeners who download episodes for subway/flight transit and need explicit storage visibility.
- Night-time listeners who use OLED displays in bed or dark environments and want a true black, glare-free interface.
- Dedicated fans who enjoy visual feedback and tactile player controls while listening to long-form comedy discussions.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[Mobile Bottom Bar] ──► Tap / Swipe Up ──► [Expanded Full-Height Drawer]
                                                │
                                                ├──► Dynamic Audio Waveform Canvas
                                                ├──► Scrubber with Timestamp Seek
                                                ├──► Tactile Skip / Speed / Sleep Controls
                                                └──► Voice Boost & TV Cast Triggers

[Navbar / Settings] ──► Tap Moon / Sun ────► Toggle OLED Mode (Instant #000000 theme)
                    ──► Tap Storage Icon ──► [Storage & Offline Manager Modal]
                                                ├── Storage Gauge (MB Used / Quota)
                                                ├── List of Cached Episodes + Delete
                                                ├── Bulk Action: "Download Recent 3"
                                                └── Bulk Action: "Clear All Downloads"
```

### Visual Identity & Theme
- **Color Palette**:
  - *Standard Dark (Default)*: Background `#0c0e14`, Surface `#121520`, Elevated `#1a1f2e`, Borders `rgba(255,255,255,0.08)`.
  - *OLED Pure Black (Active)*: Background `#000000`, Surface `#0a0a0a`, Elevated `#141414`, Borders `#242424`, Accents `#dc2626` (Comedy Button Red) and `#ef4444`.
- **Waveform Canvas Aesthetics**:
  - Gradient bars transitioning from fiery crimson (`#dc2626`) to warm amber (`#f59e0b`) at peak amplitudes.
  - Mirrored or vertical frequency spectrum with 32–48 smoothed amplitude bars.
  - Low-opacity ambient glow backdrop behind the waveform bars matching the podcast artwork palette.
- **Typography & Data Hierarchy**:
  - Clean monospaced figures (`font-mono`) for storage metrics (`MB`, `GB`, percentage bars).
  - Unboxed metadata discipline (avoiding candy badges; using clean dot-separated text).
- **Interactive Feedback**:
  - Haptic feedback pulses (`navigator.vibrate`) when scrubbing or toggling OLED mode.
  - Smooth spring transitions via `motion/react` for drawer expansion and storage meter fills.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Hybrid Audio Visualizer (Web Audio Analyser + Synchronized Procedural Fallback)
- **Chosen Approach**: Attempt to connect a Web Audio `AnalyserNode` when audio is served via CORS-compliant proxy, but automatically fall back to an audio-synced procedural Fourier harmonic simulator when direct cross-origin Libsyn CDN audio is playing.
- **Why**: Standard `<audio>` elements playing direct Libsyn MP3s without CORS headers mute immediately if connected to `createMediaElementSource`. The hybrid approach guarantees smooth 60fps visuals without ever causing playback failures, CORS blocks, or muted sound.
- **Alternatives Considered**: Forcing all audio through a backend proxy would break GitHub Pages static hosting.

### Decision 2: Native Storage Estimation API (`navigator.storage.estimate`)
- **Chosen Approach**: Query `navigator.storage.estimate()` in conjunction with an IndexedDB transaction that sums actual cached episode Blob bytes.
- **Why**: Provides byte-accurate visibility of both app storage (actual podcast audio) and total browser quota headroom.
- **Alternatives Considered**: Estimating based on episode count was rejected because episode durations vary from 45 minutes to over 2 hours (40MB to 120MB).

### Decision 3: CSS Class-Based Theme Posture (`.theme-oled`)
- **Chosen Approach**: Toggle a persistent `theme-oled` class on the root `document.documentElement` paired with CSS variables / Tailwind utility classes.
- **Why**: Zero runtime re-renders of the component tree, immediate paint without hydration flash, and seamless integration with Tailwind v4.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Content & Providers                         │
│  ┌─────────────────────────┐             ┌──────────────────────────┐  │
│  │      AudioProvider      │             │       ThemeContext       │  │
│  │   - Playback & Queue    │             │  - isOledMode (boolean)  │  │
│  │   - isPlaying, seek()   │             │  - toggleOledMode()      │  │
│  └────────────┬────────────┘             └────────────┬─────────────┘  │
│               │                                       │                │
│               ▼                                       ▼                │
│  ┌─────────────────────────┐             ┌──────────────────────────┐  │
│  │   Navbar & Controls     │             │    AudioPlayer Drawer    │  │
│  │  - 24/7 Live Radio Tab  │             │  - Large Episode Art     │  │
│  │  - Episode Archive Tab  │             │  - WaveformVisualizer    │  │
│  │  - OLED Mode Switcher   │             │    * Canvas 60fps loop   │  │
│  │  - Storage Manager Icon │             │    * Dynamic amplitudes  │  │
│  └────────────┬────────────┘             │  - Accessible Scrubbers  │  │
│               │                          └──────────────────────────┘  │
│               ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Storage & Offline Manager Modal                  │  │
│  │  - navigator.storage.estimate() quota gauge                      │  │
│  │  - IndexedDB episodes_audio table viewer                         │  │
│  │  - Bulk Delete / Bulk Download Queue                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Storage Interfaces

```typescript
// Offline Storage Quota Representation
export interface StorageQuotaInfo {
  usageBytes: number;
  quotaBytes: number;
  percentageUsed: number;
  episodesCount: number;
  episodesSizeBytes: number;
}

// Downloaded Episode Cache Item
export interface DownloadedEpisodeMetadata {
  id: string;
  title: string;
  episodeNumber?: number;
  sizeBytes: number;
  downloadedAt: number;
}
```

### Interactive State Mutations
1. **OLED Toggle**: Writes `'true'` / `'false'` to `localStorage.getItem('cb_oled_theme')` and updates root class list, instantly repainting backgrounds and borders.
2. **Bulk Download Queue**: Sequentially initiates `downloadEpisodeForOffline` for up to 3 un-cached episodes, displaying a multi-stage circular progress ring.
3. **Bulk Clear**: Iterates through IndexedDB `STORE_NAME`, deletes all blobs, clears audio caches, and re-triggers storage quota calculation.
4. **Waveform Animation Loop**: Runs via `requestAnimationFrame`, throttling updates when the drawer is collapsed to preserve battery and CPU cycles.
