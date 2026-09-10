import { Episode, LiveTimelineStatus, LiveTimelineEpisode } from '../types';
import { formatSeconds } from './format';

const SYNC_EPOCH_SECONDS = 1704067200; // Jan 1, 2024 00:00:00 UTC
const SCHEDULE_SEED = 20111027; // Oct 27, 2011

function parseDurationSeconds(durationStr: string): number {
  if (!durationStr) return 3600;
  const parts = String(durationStr).split(':').map(Number);
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  } else if (parts.length === 2) {
    return (parts[0] * 60) + (parts[1] || 0);
  }
  const parsed = parseInt(durationStr, 10);
  return isNaN(parsed) ? 3600 : parsed;
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let s = seed >>> 0;
  const rng = () => {
    let t = (s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

interface MasterScheduleItem {
  episode: Episode;
  durationSeconds: number;
  startOffset: number;
  endOffset: number;
}

let cachedSchedule: {
  items: MasterScheduleItem[];
  totalDurationSeconds: number;
} | null = null;

function getOrBuildMasterSchedule(episodes: Episode[]) {
  if (cachedSchedule && cachedSchedule.items.length === episodes.length) {
    return cachedSchedule;
  }

  const validEpisodes = episodes.filter((e) => Boolean(e.audioUrl));
  const shuffled = seededShuffle(validEpisodes, SCHEDULE_SEED);

  const items: MasterScheduleItem[] = [];
  let currentOffset = 0;

  for (const ep of shuffled) {
    const durSec = Math.max(600, parseDurationSeconds(ep.duration));
    items.push({
      episode: ep,
      durationSeconds: durSec,
      startOffset: currentOffset,
      endOffset: currentOffset + durSec
    });
    currentOffset += durSec;
  }

  cachedSchedule = {
    items,
    totalDurationSeconds: currentOffset
  };

  return cachedSchedule;
}

export function computeClientStreamTimeline(episodes: Episode[]): LiveTimelineStatus {
  const schedule = getOrBuildMasterSchedule(episodes);
  const totalCycle = schedule.totalDurationSeconds;

  if (totalCycle <= 0 || schedule.items.length === 0) {
    throw new Error('No episodes available to schedule broadcast');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const cycleSec = ((nowSec - SYNC_EPOCH_SECONDS) % totalCycle + totalCycle) % totalCycle;

  let currentIndex = 0;
  for (let i = 0; i < schedule.items.length; i++) {
    if (cycleSec >= schedule.items[i].startOffset && cycleSec < schedule.items[i].endOffset) {
      currentIndex = i;
      break;
    }
  }

  const currentItem = schedule.items[currentIndex];
  const currentOffsetSeconds = cycleSec - currentItem.startOffset;
  const remainingSeconds = currentItem.endOffset - cycleSec;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentOffsetSeconds / currentItem.durationSeconds) * 100)
  );

  const startedAt = (nowSec - currentOffsetSeconds) * 1000;
  const endsAt = (nowSec + remainingSeconds) * 1000;

  // Up Next (12 episodes)
  const upNext: LiveTimelineEpisode[] = [];
  let cumulativeStartSec = nowSec + remainingSeconds;
  for (let step = 1; step <= 12; step++) {
    const nextIdx = (currentIndex + step) % schedule.items.length;
    const nextItem = schedule.items[nextIdx];
    const startMs = cumulativeStartSec * 1000;
    const endMs = startMs + nextItem.durationSeconds * 1000;
    const dateObj = new Date(startMs);
    const formattedAirTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    upNext.push({
      episode: nextItem.episode,
      durationSeconds: nextItem.durationSeconds,
      scheduledStart: startMs,
      scheduledEnd: endMs,
      startsInSeconds: cumulativeStartSec - nowSec,
      formattedAirTime
    });

    cumulativeStartSec += nextItem.durationSeconds;
  }

  // Recently played (4 episodes)
  const justPlayed: LiveTimelineEpisode[] = [];
  let pastSec = nowSec - currentOffsetSeconds;
  for (let step = 1; step <= 4; step++) {
    const prevIdx = (currentIndex - step + schedule.items.length) % schedule.items.length;
    const prevItem = schedule.items[prevIdx];
    const itemEndMs = pastSec * 1000;
    pastSec -= prevItem.durationSeconds;
    const itemStartMs = pastSec * 1000;
    const dateObj = new Date(itemStartMs);
    const formattedAirTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    justPlayed.push({
      episode: prevItem.episode,
      durationSeconds: prevItem.durationSeconds,
      scheduledStart: itemStartMs,
      scheduledEnd: itemEndMs,
      formattedAirTime
    });
  }

  return {
    serverTime: Date.now(),
    syncEpoch: SYNC_EPOCH_SECONDS,
    totalCycleSeconds: totalCycle,
    onAir: {
      episode: currentItem.episode,
      durationSeconds: currentItem.durationSeconds,
      currentOffsetSeconds,
      remainingSeconds,
      progressPercent,
      formattedCurrentTime: formatSeconds(currentOffsetSeconds),
      formattedDuration: formatSeconds(currentItem.durationSeconds),
      formattedRemaining: formatSeconds(remainingSeconds),
      startedAt,
      endsAt
    },
    upNext,
    justPlayed
  };
}
