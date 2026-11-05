# The Comedy Button

A modern, high-performance web application, 24/7 synchronized radio broadcast station, and complete episode archive for **The Comedy Button** podcast — featuring all 560+ episodes across 13+ years of the show.

Designed as an installable Progressive Web App (PWA) with client-side epoch synchronization, offline audio caching, Material You dynamic tonal theming, Web Audio DSP speech enhancement, and zero-server static deployment capability.

---

## ✨ Key Features

### 📻 24/7 Epoch-Synchronized Live Radio
- **Global Time-Synced Stream**: Every listener worldwide hears the exact same second of the exact same episode concurrently, governed by deterministic epoch time calculations without requiring an expensive streaming media server.
- **On-Air Broadcast Stage**:
  - Live progress tracker with elapsed time, remaining countdown, and smooth second ticks.
  - One-tap **"Jump to Live"** resync button to immediately catch back up if audio was paused or drifted.
  - Upcoming show schedule queue with one-tap reminder alerts.
  - Recently aired history allowing on-demand replay.
- **Sleep Timer with Exponential Fade**:
  - 15, 30, 45, and 60-minute auto-shutoff presets.
  - Smooth 30-second exponential volume decay preventing abrupt cutoffs.

### 🎨 Material You & Dynamic Theming
- **Material 3 (M3) Dynamic Tonal Design**:
  - **M3 Dark**: Warm obsidian surfaces (`#181519`), tonal graphite containers, and coral-crimson accents (`#ff8577` & `#ffdad6`).
  - **M3 Light**: The signature Google Pixel pastel aesthetic with warm porcelain backgrounds (`#fcf6f5`), pure white floating cards, and button-red accents (`#b3261e`).
- **Studio Dark**: Classic carbon audio suite styling (`#0e1015`).
- **OLED Pure Black**: Battery-saving `#000000` true black mode for modern smartphone screens.
- **1-Click Header Pill**: Rapidly cycle between all appearance modes directly from the top navigation bar.

### 🎙️ Complete Episode Archive (560+ Episodes)
- **Instant Search**: Real-time filtering across episode titles, episode numbers, and full show notes text.
- **Host Era Classification**:
  - *Anthony Gallegos Era* (Episodes 1–177)
  - *Kristin Van De Yar Era* (Episodes 178–499)
  - *Grand Finale Era* (Episodes 500+)
- **Smart Filtering & Sorting**: Filter by unplayed, favorites, downloaded offline shows, and bonus episodes; sort by newest, oldest, longest, and shortest duration.
- **True Random Shuffle**: Cryptographically secure episode picker powered by `crypto.getRandomValues`.
- **Rich Show Notes**: Guest appearance badges (Jared Petty, Greg Miller, Ryan Clements, and more), HTML formatted descriptions, and original publication metadata.

### 🔊 Voice Boost & Web Audio DSP
- **Speech Clarity Engine**:
  - Dynamics processing graph featuring high-pass rumble reduction (80Hz cutoff), vocal presence boost (2.4kHz band), and gentle compression (threshold: -24dB, knee: 30dB, ratio: 4:1) for crystal-clear host banter in noisy environments.
- **Dynamic 60fps Waveform Visualizer**:
  - Real-time animated canvas waveform with amplitude smoothing and fluid color gradients.
- **Adaptive Stream Resolution**:
  - Direct hardware-accelerated playback from the Libsyn CDN with automatic fallback proxying when cross-origin Web Audio analysis is needed.

### 📱 Progressive Web App (PWA) & Offline Storage
- **Installable Native Experience**: Full Web App Manifest with standalone display mode, orientation lock, and automated high-res icon generation.
- **IndexedDB Audio Caching**: Save full audio files to device storage for offline playback on airplanes, subways, or low-connectivity areas.
- **Storage Quota Dashboard**: Live browser storage measurement via `navigator.storage.estimate()` showing available device space, cached MBs, and per-episode cache management.

### 📺 Google Cast & Ambient TV Display
- **Google Cast Web Sender**: Stream audio seamlessly to Chromecasts, Google Nest speakers, and smart TVs.
- **Fullscreen TV Receiver Screen**: Dedicated ambient theater display featuring vinyl turntable animations, album art backdrops, high-contrast readable show notes, and remote playback controls.

### 📊 Listening Stats & Era Wrapped
- **Private Telemetry**: Tracks total minutes listened, completed episodes, current listening streaks, and favorite eras.
- **100% Client-Side**: Stored locally in `localStorage` with zero third-party tracking or telemetry.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 6](https://vitejs.dev/) with Rollup code-splitting |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Animations** | [Motion](https://motion.dev/) (hardware-accelerated GPU transitions) |
| **Audio Processing** | Web Audio API (`AudioContext`, `BiquadFilterNode`, `DynamicsCompressorNode`), Media Session API |
| **Offline Storage** | IndexedDB, Workbox, [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) |
| **Full-Stack Server** | [Node.js](https://nodejs.org/) (v20+ / v22+), [Express](https://expressjs.com/), [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or v22.x
- **npm**: v10.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/the-comedy-button.git
cd the-comedy-button

# Install dependencies
npm install
```

### Development Mode

Starts the Node.js/Express development server with Vite middleware on port 3000:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📦 Production Build & Deployment

### Build Command

```bash
npm run build
```

This executes:
1. `npm run prebuild`: Crawls the live Libsyn RSS feed into `/public/data/` snapshots and generates all PWA icon resolutions.
2. `vite build`: Compiles and bundles optimized static assets into `dist/`.
3. `esbuild server.ts`: Bundles the Express backend into `dist/server.cjs`.

### Production Server

To start the full-stack production server:

```bash
npm start
```

### Static Hosting (GitHub Pages / Netlify / Vercel)

The app is built to run 100% client-side if a backend server is not available:
- Deploy the contents of the `dist/` directory directly to any static web host or CDN.
- In static mode, the client uses `timelineScheduler.ts` to compute the live synchronized broadcast time directly from the user's system clock.

---

## 📂 Project Architecture

```
├── public/
│   ├── assets/
│   │   ├── logo.png               # Official transparent 3D logo
│   │   └── cover.jpg              # High-resolution podcast cover
│   ├── audio/                     # Theme tune & intro audio
│   ├── data/                      # Static JSON feed snapshots (episodes & info)
│   ├── favicon.ico                # Favicon and PWA icons
│   └── receiver.html              # Custom Google Cast receiver web app
├── scripts/
│   ├── generate-pwa-icons.ts      # Sharp-based PWA icon generator
│   └── generate-static-data.ts    # Libsyn RSS feed crawler & JSON builder
├── src/
│   ├── assets/                    # Bundled assets (imported directly into JS)
│   │   └── logo.png               # Bundled logo for zero-404 production resilience
│   ├── components/
│   │   ├── AudioPlayer.tsx        # Persistent bottom player & mobile drawer
│   │   ├── CastModal.tsx          # Device selector dialog
│   │   ├── CastReceiverScreen.tsx # Fullscreen TV & ambient display mode
│   │   ├── ComedyButtonLogo.tsx   # Resilient logo component with multi-tier fallbacks
│   │   ├── ComedyPlayButton.tsx   # Interactive tactile 3D red play button
│   │   ├── EpisodeArchive.tsx     # 560+ episode catalog with search & filters
│   │   ├── EpisodeCard.tsx        # Episode card with playback & offline triggers
│   │   ├── EpisodeModal.tsx       # Full show notes reader with guest detection
│   │   ├── EpisodePagination.tsx  # Accessible pagination controls
│   │   ├── ErrorBoundary.tsx      # React error boundary component
│   │   ├── Footer.tsx             # Official links and community credits
│   │   ├── ListeningStatsModal.tsx# Listening stats & year-in-review breakdown
│   │   ├── Navbar.tsx             # Top navigation bar, tab switcher, and theme cycle pill
│   │   ├── PWABanner.tsx          # PWA install banner
│   │   ├── RadioStreamStation.tsx # 24/7 Live Radio view & schedule queue
│   │   ├── SleepTimerPopover.tsx  # Sleep timer presets & countdown
│   │   ├── StorageManagerModal.tsx# IndexedDB offline downloads manager
│   │   ├── ThemeIntroModal.tsx    # Theme song player & host roll-call animation
│   │   └── WaveformVisualizer.tsx # Dynamic 60fps audio waveform canvas
│   ├── context/
│   │   ├── AudioContext.tsx       # Core playback state, playlist, and audio element
│   │   ├── CastContext.tsx        # Google Cast SDK integration
│   │   └── ThemeContext.tsx       # Theme modes (M3 Dark, M3 Light, Studio, OLED)
│   ├── data/
│   │   └── links.ts               # Official store, Patreon, Discord, and streaming links
│   ├── hooks/
│   │   ├── useAudioEffects.ts     # Web Audio API speech enhancement hook
│   │   ├── useMediaSession.ts     # Lock-screen controls & metadata sync
│   │   ├── useModalA11y.ts        # Keyboard focus trap & escape dismissal
│   │   └── useSleepTimer.ts       # Sleep timer decay logic
│   ├── services/
│   │   └── api.ts                 # API client with static fallback handling
│   ├── utils/
│   │   ├── assets.ts              # Artwork resolver & image error fallbacks
│   │   ├── haptics.ts             # Mobile vibration triggers
│   │   ├── offlineStorage.ts      # IndexedDB audio caching utilities
│   │   ├── podcastEras.ts         # Era classification rules
│   │   ├── timelineScheduler.ts   # Client-side deterministic live schedule engine
│   │   └── trueRandom.ts          # Cryptographic random selection
│   ├── App.tsx                    # Top-level view router & modal container
│   ├── index.css                  # Global Tailwind v4 and Material You M3 themes
│   ├── main.tsx                   # React root entry point
│   └── types.ts                   # TypeScript interfaces and data models
├── server.ts                      # Express API server & static asset handler
├── package.json                   # Project dependencies and npm scripts
├── tsconfig.json                  # TypeScript compiler options
└── vite.config.ts                 # Vite, PWA, and build chunking configuration
```

---

## ⚡ Performance & Resilience
- **Zero Broken Assets in Production**: Bundled Vite imports guarantee that images and logos resolve cleanly across subpaths, reverse proxies, and CDN caching layers.
- **Fast First Paint**: Critical JavaScript is split under **~50 kB gzipped**, with heavy dialogs (Stats, Cast, Receiver, Show Notes) code-split on-demand via `React.lazy`.
- **Accessibility**: Full keyboard navigation, focus trapping (`useModalA11y`), and explicit ARIA labels across all audio player controls.

---

## 📄 License & Credits

This fan-created station and open-source project is licensed under the [MIT License](LICENSE).

*Audio, artwork, and podcast content are copyright &copy; [The Comedy Button](https://www.thecomedybutton.com) and its hosts (Brian Altano, Scott Bromley, Anthony Gallegos, Ryan Scott, Max Scoville, and Kristin Van De Yar).*
