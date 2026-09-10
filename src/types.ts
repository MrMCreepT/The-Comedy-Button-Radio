export interface Episode {
  id: string;
  guid: string;
  title: string;
  episodeNumber?: number;
  pubDate: string;
  audioUrl: string;
  duration: string;
  durationSeconds?: number;
  description: string;
  descriptionHtml: string;
  link: string;
  imageUrl?: string;
  isBonus: boolean;
  isSpecial?: boolean;
  category?: string;
  hostEra?: 'anthony' | 'transition' | 'kristin' | 'finale' | 'special';
  detectedGuests?: string[];
  hosts?: string[];
}

export interface PodcastMeta {
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  author: string;
  totalEpisodes: number;
  lastBuildDate: string;
  hosts: string[];
}

export interface LiveTimelineEpisode {
  episode: Episode;
  durationSeconds: number;
  scheduledStart: number; // Unix timestamp ms
  scheduledEnd: number; // Unix timestamp ms
  startsInSeconds?: number;
  formattedAirTime: string;
}

export interface LiveTimelineStatus {
  serverTime: number;
  syncEpoch: number;
  totalCycleSeconds: number;
  onAir: {
    episode: Episode;
    currentOffsetSeconds: number;
    durationSeconds: number;
    remainingSeconds: number;
    progressPercent: number;
    formattedCurrentTime: string;
    formattedDuration: string;
    formattedRemaining: string;
    startedAt: number;
    endsAt: number;
  };
  upNext: LiveTimelineEpisode[];
  justPlayed: LiveTimelineEpisode[];
}
