import {
  Episode,
  PodcastMeta,
  LiveTimelineStatus
} from '../types';

export async function getPodcastInfo(): Promise<PodcastMeta> {
  const res = await fetch('/api/podcast/info');
  if (!res.ok) throw new Error('Failed to fetch podcast info');
  return res.json();
}

export async function getEpisodes(search?: string, filter?: string): Promise<{ total: number; episodes: Episode[] }> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filter) params.set('filter', filter);
  
  const res = await fetch(`/api/podcast/episodes?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch episodes');
  return res.json();
}

export async function getRandomEpisodesStream(count: number = 24): Promise<{
  streamName: string;
  channel: string;
  total: number;
  episodes: Episode[];
}> {
  const res = await fetch(`/api/stream/random-episodes?count=${count}`);
  if (!res.ok) throw new Error('Failed to load random episodes stream');
  return res.json();
}

export async function getStreamTimeline(): Promise<LiveTimelineStatus> {
  const res = await fetch('/api/stream/timeline');
  if (!res.ok) throw new Error('Failed to load synchronized stream timeline');
  return res.json();
}
