# The Comedy Button

A full-stack web application and synchronized 24/7 radio broadcast station for **The Comedy Button** podcast, featuring all 560+ episodes across 12+ years of the show.

---

## Features

- **24/7 Live Radio Broadcast**:
  - A synchronized live radio stream where listeners worldwide hear the exact same episode at the exact same second.
  - Master schedule that continuously rotates across all 560+ episodes.
  - Live on-air card with real-time second progress, remaining time counter, and "Sync to Live" action.
  - Program guide showing upcoming episodes ("Coming Up Next") and past episodes ("Recently Broadcasted").
  - Sleep timer with 15, 30, 45, and 60-minute auto-shutoff options.

- **Full Episode Archive (560+ Episodes)**:
  - Complete Libsyn podcast catalog integration with cached XML feed parsing.
  - Instant search across episode titles, show notes, and episode numbers.
  - Filter by unplayed status, favorites, and bonus/specials.
  - Filter by era:
    - *Anthony Gallegos Era* (Episodes 1–177)
    - *Kristin Van De Yar Era* (Episodes 178–499)
    - *Grand Finale Era* (Episodes 500+)
  - Sort by newest, oldest, longest duration, and shortest duration.
  - One-click "Shuffle Archive" button using cryptographically secure random selection.

- **Persistent Audio Player**:
  - Docked player bar with smooth audio scrubbing.
  - Skip -15s / +30s jump controls.
  - Variable playback speed (0.8x, 1.0x, 1.2x, 1.5x, 1.75x, 2.0x).
  - Volume control and mute toggle.
  - Direct MP3 downloads and favorite saving (persisted in `localStorage`).
  - Minimized / expanded player modes.

- **Show Notes Modal**:
  - Formatted HTML show notes reader with guest detection, original release dates, and links to source pages.

---

## Tech Stack

- **Frontend**:
  - [React 19](https://react.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [motion](https://motion.dev/) for UI animations
  - [Lucide React](https://lucide.dev/) for vector icons
- **Backend**:
  - [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
  - [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) for RSS feed parsing
  - [esbuild](https://esbuild.github.io/) for bundling server code
- **Dev & Build Tooling**:
  - [Vite](https://vitejs.dev/) with Express middleware integration
  - [tsx](https://github.com/privatenumber/tsx) for development execution

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/the-comedy-button.git
cd the-comedy-button

# Install dependencies
npm install
```

### Development

Run the development server with live reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

Build both the client-side SPA and the backend server bundle:

```bash
npm run build
```

This generates:
- `dist/` — Optimized client assets and HTML
- `dist/server.cjs` — Bundled production Node.js server

To start the production server:

```bash
npm start
```

### Linting & Type Checking

```bash
npm run lint
```

---

## Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD GitHub Actions workflow
├── public/
│   └── assets/               # Artwork and static images
├── src/
│   ├── components/
│   │   ├── AudioPlayer.tsx        # Persistent bottom audio player
│   │   ├── ComedyButtonLogo.tsx   # 3D red button logo branding
│   │   ├── EpisodeArchive.tsx     # 560+ catalog search & filter list
│   │   ├── EpisodeModal.tsx       # Show notes and episode details modal
│   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   ├── Navbar.tsx             # Top navigation & quick actions
│   │   └── RadioStreamStation.tsx # 24/7 synchronized broadcast view
│   ├── context/
│   │   └── AudioContext.tsx       # Global audio playback state & persistence
│   ├── services/
│   │   └── api.ts                 # Client-side API fetch client
│   ├── utils/
│   │   ├── format.ts              # Time, date, and duration formatters
│   │   ├── podcastEras.ts         # Era classification and guest detection
│   │   └── trueRandom.ts          # Cryptographically secure random pickers
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # React DOM entry point
│   ├── index.css                  # Tailwind styles and equalizer keyframes
│   └── types.ts                   # TypeScript interfaces
├── server.ts                  # Express backend & live timeline scheduler
├── package.json               # Dependencies and scripts
└── vite.config.ts             # Vite configuration
```

---

## API Endpoints

- `GET /api/podcast/info` — Retrieves podcast channel metadata (author, description, episode count).
- `GET /api/podcast/episodes` — Retrieves the episode library (supports `search` and `filter` query parameters).
- `GET /api/stream/timeline` — Retrieves synchronized broadcast status: currently on-air episode, exact seconds offset, up-next queue, and recently played queue.
- `GET /api/stream/random-episodes` — Returns a random sequence of episodes for playback.

---

## License

This project is licensed under the MIT License.
