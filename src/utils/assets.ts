import React from 'react';

/**
 * Local high-resolution bundled artwork (1400x1400)
 */
export const LOCAL_PODCAST_ARTWORK = '/assets/cover.jpg';

/**
 * Official high-resolution Libsyn CDN Podcast Cover Artwork (1400x1400)
 */
export const OFFICIAL_PODCAST_ARTWORK =
  'https://static.libsyn.com/p/assets/4/b/9/9/4b995a114aac0a5b/ComedyButton-2015-iTunes-icon-1400x1400.jpg';

/**
 * Resolves an image URL safely:
 * - If given a full http(s) URL, returns it directly
 * - If given a local relative asset path, prefixes with Vite's BASE_URL (handling GitHub Pages subpaths)
 * - If empty or invalid, falls back to the bundled local artwork or Libsyn CDN artwork
 */
export function getArtworkUrl(preferredUrl?: string | null): string {
  if (preferredUrl && preferredUrl.trim()) {
    if (
      preferredUrl.startsWith('http://') ||
      preferredUrl.startsWith('https://') ||
      preferredUrl.startsWith('data:')
    ) {
      return preferredUrl;
    }

    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const cleanPath = preferredUrl.startsWith('/') ? preferredUrl.slice(1) : preferredUrl;
    return `${cleanBase}${cleanPath}`;
  }

  return LOCAL_PODCAST_ARTWORK;
}

/**
 * Safe image onError handler:
 * If an image fails to load (e.g. 404, CORS, adblocker, network failure, or bad subpath),
 * gracefully fall back to the bundled local artwork first, then CDN artwork so it is never broken.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (!target.src.includes('cover.jpg')) {
    target.src = LOCAL_PODCAST_ARTWORK;
  } else if (target.src !== OFFICIAL_PODCAST_ARTWORK) {
    target.src = OFFICIAL_PODCAST_ARTWORK;
  }
}
