# The Comedy Button

A modern, high-performance web application and synchronized 24/7 radio broadcast station for **The Comedy Button** podcast, featuring all 560+ episodes across 12+ years of the show.

Designed as a Progressive Web App (PWA) with offline caching, hardware-accelerated Web Audio DSP, and instant static deployment for **GitHub Pages**.

---

## ✨ Features

### 📻 24/7 Live Radio Broadcast
- **Epoch-Synchronized Playback**: All listeners across the globe hear the exact same episode at the exact same second, powered by client-side deterministic epoch scheduling.
- **Zero Server Dependency**: Operates 100% statically on GitHub Pages with automatic in-browser time sync.
- **On-Air Program Guide**:
  - Live progress ring with real-time seconds elapsed and time remaining.
  - "Sync to Live" action button to instantly re-align after pausing or scrubbing.
  - "Coming Up Next" schedule previews and "Recently Broadcasted" episode history.
- **Sleep Timer**:
  - 15, 30, 45, and 60-minute auto-shutoff presets.
  - Smooth 30-second exponential volume decay preventing jarring cut-offs.

### 🎙️ Complete Episode Archive (560+ Episodes)
- **Instant Search & High-Speed Filtering**:
  - Instant text search across titles, episode numbers, and full show notes.
  - Filter by Era:
    - *Anthony Gallegos Era* (Episodes 1–177)
    - *Kristin Van De Yar Era* (Episodes 178–499)
    - *Grand Finale Era* (Episodes 500+)
  - Filter by unplayed status, favorites, and bonus/specials.
  - Sort by newest, oldest, longest duration, and shortest duration.
- **True Random Shuffle**:
  - Cryptographically secure (`crypto.getRandomValues`) shuffle for instant discovery.
- **Formatted Show Notes**:
  - Guest appearance badges (e.g. Jared Petty, Greg Miller, Ryan Clements).
  - Formatted HTML descriptions, original publication timestamps, and source links.

### 🔊 Voice Boost & Web Audio DSP
- **Speech Clarity Engine**:
  - Web Audio API dynamics processing chain with high-pass rumble reduction (80Hz cutoff), vocal presence peaking filter (2.4kHz boost), and intelligent dynamic range compression (threshold: -24dB, knee: 30dB, ratio: 4:1).
  - One-tap toggle in desktop player and mobile drawer with animated active indicator.
- **Native Direct CDN & Seamless CORS Proxy**:
  - Direct hardware-accelerated playback from Libsyn CDN.
  - Automatic fallback proxy (`/api/audio-proxy`) when Web Audio API analysis or cross-origin headers are required.

### 📱 Progressive Web App (PWA) & Offline Playback
- **Installable Native Experience**:
  - Full Web App Manifest with portrait orientation lock, custom theme colors, and standalone display mode.
  - Automated icon generator for Android, iOS (`apple-touch-icon`), and desktop maskable formats.
- **IndexedDB Offline Audio Storage**:
  - Save full episode audio files directly to browser IndexedDB for offline listening on flights or commutes.
  - Background Service Worker caching (Workbox) for instant sub-second app reloads.

### 📺 Google Cast & TV Receiver Screen
- **Google Cast Web Sender**: Stream audio seamlessly to Chromecasts, Google Nest Hubs, and smart TVs.
- **Interactive TV Receiver Screen**: Dedicated full-screen ambient display with vinyl turntable animations, album art backdrops, high-contrast readable show notes, and remote TV controls.

### 📊 Listening Stats & Year-in-Review Wrapped
- **Private Telemetry**: Tracks total minutes listened, completed episodes, current listening streaks, and favorite hosts.
- **Era Breakdown**: Visual statistics tracking hours spent listening to the Anthony Era vs. Kristin Era vs. Finale Era.
- **100% Client-Side**: Persisted securely in `localStorage` without external trackers.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Dev Server** | [Vite 6](https://vitejs.dev/) with Rollup code-splitting |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) icons |
| **Animations** | [Motion](https://motion.dev/) (hardware-accelerated GPU transitions) |
| **Audio Engine** | Web Audio API (`AudioContext`, `BiquadFilterNode`, `DynamicsCompressorNode`), Media Session API |
| **Offline & Caching** | [Vite PWA Plugin](https://vite-pwa-org.netlify.app/), Workbox, IndexedDB |
| **Backend (Optional / Local)** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) |

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

Starts the local development server on port 3000:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📦 Building & GitHub Pages Deployment

This project is configured for static hosting on **GitHub Pages**.

### Automatic Deployment (GitHub Actions)
A pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`) is included. Every push to the `main` branch will automatically:
1. Fetch and snapshot the latest podcast feed (`npm run prebuild`).
2. Generate all PWA icon sizes from the master cover image.
3. Type-check with `tsc --noEmit`.
4. Build optimized static production bundles to `./dist`.
5. Deploy `./dist` directly to your GitHub Pages site.

### Manual Static Build

To build the static site locally for inspection:

```bash
npm run build
```

The resulting `dist/` directory contains:
- `index.html` — Single Page Application entry point.
- `assets/` — Minified and tree-shaken JavaScript chunks (under 50 kB initial gzipped payload) and CSS.
- `data/episodes.json` — Static snapshot of all 560+ episodes.
- `data/info.json` — Static channel metadata.
- `manifest.webmanifest` & `sw.js` — Service worker and PWA manifests.

To test the production build locally:

```bash
npx serve dist -l 3000
```

---

## 📂 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── data/                           # Local runtime data & caches
├── public/
│   ├── assets/cover.jpg            # High-resolution show cover artwork
│   ├── data/                       # Generated static JSON snapshots (episodes & info)
│   ├── favicon.ico                 # App icon
│   └── receiver.html               # Custom Google Cast receiver web app
├── scripts/
│   ├── generate-pwa-icons.ts       # Sharp-based PWA icon generator
│   └── generate-static-data.ts     # Libsyn RSS feed crawler & JSON builder
├── src/
│   ├── components/
│   │   ├── AudioPlayer.tsx         # Sticky bottom player with scrubbers & mobile drawer
│   │   ├── CastModal.tsx           # Cast device selector modal
│   │   ├── CastReceiverScreen.tsx  # Fullscreen TV & ambient display mode
│   │   ├── ComedyButtonLogo.tsx    # Custom 3D red button SVG logo
│   │   ├── EpisodeArchive.tsx      # Episode catalog container with search & filters
│   │   ├── EpisodeCard.tsx         # Memoized episode card with playback triggers
│   │   ├── EpisodeModal.tsx        # Show notes reader with guest detection
│   │   ├── EpisodePagination.tsx   # Windowed pagination controls with ARIA semantics
│   │   ├── ErrorBoundary.tsx       # React error boundary component
│   │   ├── Footer.tsx              # Official links, social links, and disclaimers
│   │   ├── ListeningStatsModal.tsx # Listening stats & Year-in-Review Wrapped modal
│   │   ├── Navbar.tsx              # Top navigation bar & mobile tab switcher
│   │   ├── PWABanner.tsx           # Ambient PWA install prompt banner
│   │   └── RadioStreamStation.tsx  # 24/7 Live Radio view & upcoming schedule
│   ├── context/
│   │   ├── AudioContext.tsx        # Core audio playback state & playlist manager
│   │   └── CastContext.tsx         # Google Cast SDK provider
│   ├── data/
│   │   └── links.ts                # Official social & merchandise URLs
│   ├── hooks/
│   │   ├── useAudioEffects.ts      # Web Audio API Voice Boost & compressor hook
│   │   ├── useMediaSession.ts      # Lock-screen controls & metadata sync hook
│   │   ├── useModalA11y.ts         # Accessible modal focus trap & escape dismissal
│   │   └── useSleepTimer.ts        # Sleep timer countdown & exponential volume decay
│   ├── services/
│   │   └── api.ts                  # Resilient API client with static fallback
│   ├── utils/
│   │   ├── assets.ts               # Artwork resolver & image fallback handlers
│   │   ├── audioEffects.ts         # Web Audio DSP graph node configuration
│   │   ├── format.ts               # Date, time, and second formatters
│   │   ├── haptics.ts              # Mobile device vibration triggers
│   │   ├── offlineStorage.ts       # IndexedDB audio caching utilities
│   │   ├── podcastEras.ts          # Era classification & guest detection rules
│   │   ├── timelineScheduler.ts    # Deterministic epoch live radio schedule engine
│   │   └── trueRandom.ts           # Cryptographically secure random number picker
│   ├── App.tsx                     # Top-level application router & lazy view loader
│   ├── index.css                   # Global Tailwind v4 configuration
│   ├── main.tsx                    # React DOM root entry point
│   └── types.ts                    # TypeScript types and data models
├── server.ts                       # Optional Node/Express server for development & proxying
├── package.json                    # Project dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite, PWA, and Rollup chunking configuration
```

---

## ⚡ Performance & Quality Benchmarks

- **Zero-Flicker Cold Load**: Initial critical JavaScript bundle is split down to **~45 kB gzipped**, with secondary dialogs and TV screens loaded on-demand via `React.lazy`.
- **Hardware Acceleration**: Audio graphs, volume transitions, and turntable vinyl animations run on compositor layers without blocking UI interaction.
- **Accessibility (a11y)**: Compliant with WCAG AA contrast ratios, full keyboard focus trapping (`useModalA11y`), and explicit ARIA labels across all interactive audio controls.

---

## 📄 License

This fan-created station and open-source project is licensed under the [MIT License](LICENSE). 

*Audio, artwork, and podcast content remain the property of The Comedy Button and its respective creators.*
