import {
  Episode,
  PodcastMeta,
  LiveTimelineStatus
} from '../types';
import { computeClientStreamTimeline } from '../utils/timelineScheduler';
import { episodeMatchesTopic } from '../utils/showNotesFilter';

let cachedEpisodesInMemory: Episode[] = [];
let cachedMetaInMemory: PodcastMeta | null = null;

// Helper to resolve static fallback URL taking base URL into account
function getStaticUrl(relPath: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relPath.startsWith('/') ? relPath.slice(1) : relPath;
  return `${cleanBase}${cleanPath}`;
}

export async function getPodcastInfo(): Promise<PodcastMeta> {
  if (cachedMetaInMemory) {
    return cachedMetaInMemory;
  }

  // 1. Try server API endpoint
  try {
    const res = await fetch('/api/podcast/info');
    if (res.ok) {
      const data = await res.json();
      cachedMetaInMemory = data;
      return data;
    }
  } catch {
    // Fall back to static dataset for GitHub Pages or offline hosting
  }

  // 2. Static JSON fallback
  const staticRes = await fetch(getStaticUrl('data/info.json'));
  if (!staticRes.ok) throw new Error('Failed to fetch podcast info');
  const staticData = await staticRes.json();
  cachedMetaInMemory = staticData;
  return staticData;
}

export async function getEpisodes(
  search?: string,
  filter?: string,
  searchScope?: 'all' | 'notes' | 'title',
  topic?: string,
  guest?: string
): Promise<{ total: number; episodes: Episode[] }> {
  let list: Episode[] = [];

  // 1. Try server API endpoint
  try {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filter) params.set('filter', filter);
    if (searchScope) params.set('searchScope', searchScope);
    if (topic) params.set('topic', topic);
    if (guest) params.set('guest', guest);

    const res = await fetch(`/api/podcast/episodes?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      cachedEpisodesInMemory = data.episodes;
      return data;
    }
  } catch {
    // Fall back to static dataset
  }

  // 2. Fall back to bundled static dataset (ideal for GitHub Pages)
  if (cachedEpisodesInMemory.length === 0) {
    const staticRes = await fetch(getStaticUrl('data/episodes.json'));
    if (!staticRes.ok) throw new Error('Failed to fetch episodes dataset');
    const staticData = await staticRes.json();
    cachedEpisodesInMemory = staticData.episodes || [];
  }

  list = cachedEpisodesInMemory;

  if (filter === 'bonus') {
    list = list.filter((e) => e.isBonus);
  } else if (filter === 'numbered') {
    list = list.filter((e) => !e.isBonus && Boolean(e.episodeNumber));
  }

  // Show notes topic and guest filtering for client/static mode
  if (topic && topic !== 'all') {
    list = list.filter((e) => episodeMatchesTopic(e, topic, guest));
  } else if (guest && guest !== 'all') {
    list = list.filter((e) => {
      const guests = e.detectedGuests || [];
      if (guests.includes(guest)) return true;
      return (e.description || '').toLowerCase().includes(guest.toLowerCase());
    });
  }

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter((e) => {
      const titleMatch = e.title.toLowerCase().includes(q) || (e.episodeNumber && e.episodeNumber.toString() === q);
      const notesMatch = (e.description || '').toLowerCase().includes(q);

      if (searchScope === 'notes') {
        return notesMatch;
      }
      if (searchScope === 'title') {
        return titleMatch;
      }
      return titleMatch || notesMatch;
    });
  }

  return {
    total: list.length,
    episodes: list
  };
}

export async function getRandomEpisodesStream(count: number = 24): Promise<{
  streamName: string;
  channel: string;
  total: number;
  episodes: Episode[];
}> {
  try {
    const res = await fetch(`/api/stream/random-episodes?count=${count}`);
    if (res.ok) {
      return res.json();
    }
  } catch {
    // Fallback
  }

  const { episodes } = await getEpisodes();
  const shuffled = [...episodes].sort(() => Math.random() - 0.5);
  return {
    streamName: 'Random Shuffle Stream',
    channel: 'The Comedy Button',
    total: episodes.length,
    episodes: shuffled.slice(0, count)
  };
}

export async function getStreamTimeline(): Promise<LiveTimelineStatus> {
  // 1. Try server timeline first
  try {
    const res = await fetch('/api/stream/timeline');
    if (res.ok) {
      return res.json();
    }
  } catch {
    // Fall back to client calculation
  }

  // 2. Client-side deterministic timeline calculation
  // Ensures 24/7 radio broadcast works seamlessly on GitHub Pages
  if (cachedEpisodesInMemory.length === 0) {
    await getEpisodes();
  }

  return computeClientStreamTimeline(cachedEpisodesInMemory);
}
