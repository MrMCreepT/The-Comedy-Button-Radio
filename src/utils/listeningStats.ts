/**
 * Listening Statistics & Year-in-Review Highlights Utility
 * Tracks total hours, era breakdowns, listening streaks, and generates shareable summaries.
 */

export interface ListeningStats {
  totalSecondsListened: number;
  episodesCompleted: number;
  anthonyEraSeconds: number; // Episodes 1-210
  fourHorsemenEraSeconds: number; // Episodes 211-399
  kristinEraSeconds: number; // Episodes 400+
  bonusEraSeconds: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastListenedDateStr: string | null;
  historyMap: Record<string, number>; // dateStr -> seconds
}

const STATS_STORAGE_KEY = 'cb_listening_stats_v1';

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadListeningStats(): ListeningStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalSecondsListened: Number(parsed.totalSecondsListened) || 0,
        episodesCompleted: Number(parsed.episodesCompleted) || 0,
        anthonyEraSeconds: Number(parsed.anthonyEraSeconds) || 0,
        fourHorsemenEraSeconds: Number(parsed.fourHorsemenEraSeconds) || 0,
        kristinEraSeconds: Number(parsed.kristinEraSeconds) || 0,
        bonusEraSeconds: Number(parsed.bonusEraSeconds) || 0,
        currentStreakDays: Number(parsed.currentStreakDays) || 0,
        longestStreakDays: Number(parsed.longestStreakDays) || 0,
        lastListenedDateStr: parsed.lastListenedDateStr || null,
        historyMap: parsed.historyMap || {},
      };
    }
  } catch {}

  return {
    totalSecondsListened: 0,
    episodesCompleted: 0,
    anthonyEraSeconds: 0,
    fourHorsemenEraSeconds: 0,
    kristinEraSeconds: 0,
    bonusEraSeconds: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastListenedDateStr: null,
    historyMap: {},
  };
}

export function saveListeningStats(stats: ListeningStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

/**
 * Record listening progress (called periodically e.g. every 5 seconds of active playback)
 */
export function recordListeningIncrement(
  secondsDelta: number,
  episode: { episodeNumber?: number; isBonus?: boolean }
): ListeningStats {
  const stats = loadListeningStats();
  const safeDelta = Math.max(0, Math.min(secondsDelta, 30));

  stats.totalSecondsListened += safeDelta;

  // Era breakdown
  if (episode.isBonus) {
    stats.bonusEraSeconds += safeDelta;
  } else if (episode.episodeNumber) {
    const num = episode.episodeNumber;
    if (num <= 210) {
      stats.anthonyEraSeconds += safeDelta;
    } else if (num <= 399) {
      stats.fourHorsemenEraSeconds += safeDelta;
    } else {
      stats.kristinEraSeconds += safeDelta;
    }
  } else {
    stats.bonusEraSeconds += safeDelta;
  }

  // Update streak
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  stats.historyMap[today] = (stats.historyMap[today] || 0) + safeDelta;

  if (stats.lastListenedDateStr !== today) {
    if (stats.lastListenedDateStr === yesterday) {
      stats.currentStreakDays += 1;
    } else if (stats.lastListenedDateStr === null) {
      stats.currentStreakDays = 1;
    } else {
      stats.currentStreakDays = 1;
    }

    if (stats.currentStreakDays > stats.longestStreakDays) {
      stats.longestStreakDays = stats.currentStreakDays;
    }

    stats.lastListenedDateStr = today;
  }

  saveListeningStats(stats);
  return stats;
}

/**
 * Record episode completion
 */
export function recordEpisodeCompleted(): void {
  const stats = loadListeningStats();
  stats.episodesCompleted += 1;
  saveListeningStats(stats);
}

/**
 * Get formatted stats summary for Year in Review
 */
export function getYearInReviewSummary(stats: ListeningStats) {
  const totalHours = Math.round((stats.totalSecondsListened / 3600) * 10) / 10;
  const anthonyHours = Math.round((stats.anthonyEraSeconds / 3600) * 10) / 10;
  const horsemenHours = Math.round((stats.fourHorsemenEraSeconds / 3600) * 10) / 10;
  const kristinHours = Math.round((stats.kristinEraSeconds / 3600) * 10) / 10;
  const bonusHours = Math.round((stats.bonusEraSeconds / 3600) * 10) / 10;

  const eraTotal = (stats.anthonyEraSeconds + stats.fourHorsemenEraSeconds + stats.kristinEraSeconds + stats.bonusEraSeconds) || 1;
  const anthonyPct = Math.round((stats.anthonyEraSeconds / eraTotal) * 100);
  const horsemenPct = Math.round((stats.fourHorsemenEraSeconds / eraTotal) * 100);
  const kristinPct = Math.round((stats.kristinEraSeconds / eraTotal) * 100);
  const bonusPct = Math.round((stats.bonusEraSeconds / eraTotal) * 100);

  let topEraName = 'Classic 5 Era (Anthony Gallegos)';
  let maxSeconds = stats.anthonyEraSeconds;

  if (stats.fourHorsemenEraSeconds > maxSeconds) {
    maxSeconds = stats.fourHorsemenEraSeconds;
    topEraName = 'Four Horsemen Era';
  }
  if (stats.kristinEraSeconds > maxSeconds) {
    maxSeconds = stats.kristinEraSeconds;
    topEraName = 'Kristin Van De Yar Era';
  }

  let archetype = 'Button Buster Rookie';
  if (totalHours > 200) {
    archetype = 'Supreme Grandmaster Bozo';
  } else if (totalHours > 100) {
    archetype = 'Patreon Legend Veteran';
  } else if (totalHours > 50) {
    archetype = 'Certified Button Fiend';
  } else if (totalHours > 15) {
    archetype = 'Dedicated Regular';
  }

  return {
    totalHours,
    episodesCompleted: stats.episodesCompleted,
    currentStreak: stats.currentStreakDays,
    longestStreak: stats.longestStreakDays,
    topEraName,
    archetype,
    breakdown: {
      anthony: { hours: anthonyHours, pct: anthonyPct, label: 'Anthony Gallegos Era (EP 1-210)' },
      horsemen: { hours: horsemenHours, pct: horsemenPct, label: 'Four Horsemen Era (EP 211-399)' },
      kristin: { hours: kristinHours, pct: kristinPct, label: 'Kristin Van De Yar Era (EP 400+)' },
      bonus: { hours: bonusHours, pct: bonusPct, label: 'Bonus & Live Broadcasts' },
    }
  };
}
