import { Episode } from '../types';

export interface HostEraInfo {
  id: 'all' | 'anthony' | 'kristin' | 'transition' | 'finale' | 'specials';
  label: string;
  shortLabel: string;
  tagline: string;
  hosts: string[];
  color: string;
  episodesRange: string;
}

export const HOST_ERAS: HostEraInfo[] = [
  {
    id: 'all',
    label: 'All Host Eras',
    shortLabel: 'All Eras',
    tagline: 'All 560+ episodes across 11.5 years of insanity',
    hosts: ['Brian Altano', 'Scott Bromley', 'Ryan Scott', 'Max Scoville', 'Anthony Gallegos', 'Kristin Van De Yar'],
    color: 'neutral',
    episodesRange: '2011 - 2025'
  },
  {
    id: 'anthony',
    label: 'Anthony Gallegos Era (Ep 1–127 & Returns)',
    shortLabel: 'Anthony Era',
    tagline: 'The original founding quintet with Anthony Gallegos, plus his landmark return guest appearances',
    hosts: ['Brian Altano', 'Scott Bromley', 'Anthony Gallegos', 'Ryan Scott', 'Max Scoville'],
    color: 'amber',
    episodesRange: 'Oct 2011 - May 2014 & Specials'
  },
  {
    id: 'kristin',
    label: 'Kristin / Kirsten Era (Ep 312–550)',
    shortLabel: 'Kristin Era',
    tagline: 'Kristin Van De Yar (Charron) joins as the official fifth host leading into the Grand Finale',
    hosts: ['Brian Altano', 'Scott Bromley', 'Ryan Scott', 'Max Scoville', 'Kristin Van De Yar'],
    color: 'purple',
    episodesRange: 'Dec 2017 - Feb 2024'
  },
  {
    id: 'transition',
    label: 'Core Four Era (Ep 128–311)',
    shortLabel: 'Core 4 Era',
    tagline: 'Brian, Scott, Ryan, and Max holding down the fort with beloved regular guest co-hosts',
    hosts: ['Brian Altano', 'Scott Bromley', 'Ryan Scott', 'Max Scoville'],
    color: 'emerald',
    episodesRange: 'May 2014 - Nov 2017'
  },
  {
    id: 'finale',
    label: 'Grand Finale Run (Ep 500–550)',
    shortLabel: 'Finale Run',
    tagline: 'The climactic final chapter, reunions, and milestone episodes culminating in the 3-hour finale',
    hosts: ['Brian', 'Scott', 'Ryan', 'Max', 'Kristin', 'Special Guests'],
    color: 'rose',
    episodesRange: '2021 - 2024'
  },
  {
    id: 'specials',
    label: 'Specials & Movie Commentaries',
    shortLabel: 'Specials',
    tagline: 'Full-length movie audio commentary tracks, live shows, and special event releases',
    hosts: ['The Full Crew'],
    color: 'indigo',
    episodesRange: 'Archive Vault'
  }
];

export interface GuestProfile {
  name: string;
  aliases: string[];
  title: string;
  approxCount?: number;
}

export const POPULAR_GUESTS: GuestProfile[] = [
  {
    name: 'Jared Petty',
    aliases: ['jared petty', 'jared'],
    title: 'Red Scare, IGN, tabletop games & farm stories',
    approxCount: 24
  },
  {
    name: 'Jack DeVries',
    aliases: ['jack devries', 'devries', 'jack de vries'],
    title: 'IGN, weird fast food taste tests & comic lore',
    approxCount: 22
  },
  {
    name: 'Marty Sliva',
    aliases: ['marty sliva', 'marty'],
    title: 'IGN, Boston memories & film appreciation',
    approxCount: 16
  },
  {
    name: 'Mike Drucker',
    aliases: ['mike drucker', 'drucker'],
    title: 'Emmy-nominated comedy writer & stand-up comedian',
    approxCount: 11
  },
  {
    name: 'Zach Ryan',
    aliases: ['zach ryan'],
    title: 'IGN & GameSpot host, video games enthusiast',
    approxCount: 6
  },
  {
    name: 'Mitch Dyer',
    aliases: ['mitch dyer'],
    title: 'IGN editor, Star Wars Squadrons writer',
    approxCount: 5
  },
  {
    name: 'Anthony Carboni',
    aliases: ['anthony carboni', 'carboni'],
    title: 'We Have Concerns, Star Wars show host',
    approxCount: 5
  },
  {
    name: 'Brandon Hunt',
    aliases: ['brandon hunt'],
    title: 'Podcast friend & audio engineer',
    approxCount: 5
  },
  {
    name: 'Andrew Goldfarb',
    aliases: ['andrew goldfarb', 'goldfarb'],
    title: 'IGN & Sucker Punch Productions',
    approxCount: 4
  },
  {
    name: 'Bill Zoeker',
    aliases: ['bill zoeker', 'zoeker'],
    title: 'Frequent guest host & long-time friend',
    approxCount: 4
  },
  {
    name: 'Dan Ryckert',
    aliases: ['dan ryckert', 'ryckert'],
    title: 'Giant Bomb, Fire Escape & WWE producer',
    approxCount: 3
  },
  {
    name: 'Adam Sessler',
    aliases: ['adam sessler', 'sessler'],
    title: 'X-Play legend & Rev3Games host',
    approxCount: 3
  },
  {
    name: 'Danny Tamberelli',
    aliases: ['danny tamberelli', 'tamberelli'],
    title: 'Star of The Adventures of Pete & Pete and GTA V',
    approxCount: 3
  },
  {
    name: 'Colin Moriarty',
    aliases: ['colin moriarty'],
    title: 'IGN, Kinda Funny & Last Stand Media',
    approxCount: 2
  },
  {
    name: 'Greg Miller',
    aliases: ['greg miller'],
    title: 'IGN & Kinda Funny co-founder',
    approxCount: 2
  },
  {
    name: 'Alanah Pearce',
    aliases: ['alanah pearce'],
    title: 'IGN, Funhaus & Sony Santa Monica writer',
    approxCount: 2
  },
  {
    name: 'Seth Macy',
    aliases: ['seth macy'],
    title: 'IGN tech editor & Maine news correspondent',
    approxCount: 2
  },
  {
    name: 'Nick Robinson',
    aliases: ['nick robinson'],
    title: 'Rev3Games, Polygon & YouTube creator',
    approxCount: 2
  }
];

/**
 * Checks if an episode belongs to the Anthony Gallegos Era:
 * - Episodes 1 to 127
 * - Any episode that explicitly mentions Anthony Gallegos returning or guest starring
 */
export function isAnthonyEpisode(episode: Episode): boolean {
  const num = episode.episodeNumber;
  if (num !== undefined && num >= 1 && num <= 127) {
    return true;
  }
  const text = (episode.title + ' ' + episode.description).toLowerCase();
  if (text.includes('anthony gallegos') || text.includes('anthony returns') || text.includes('anthony is back')) {
    return true;
  }
  return false;
}

/**
 * Checks if an episode belongs to the Kristin / Kirsten Era:
 * - Episodes 312 to 550
 * - Any episode mentioning Kristin or Kirsten (accounting for listener typo/pronunciation)
 */
export function isKristinEpisode(episode: Episode): boolean {
  const num = episode.episodeNumber;
  if (num !== undefined && num >= 312 && num <= 550) {
    return true;
  }
  const text = (episode.title + ' ' + episode.description).toLowerCase();
  if (text.includes('kristin') || text.includes('kirsten') || text.includes('van de yar')) {
    return true;
  }
  return false;
}

/**
 * Detects guest names mentioned in an episode's title and description
 */
export function detectEpisodeGuests(episode: Episode): string[] {
  const text = (episode.title + ' ' + episode.description);
  const lowerText = text.toLowerCase();
  const detected: string[] = [];

  // Check known popular guests
  for (const guest of POPULAR_GUESTS) {
    const matched = guest.aliases.some((alias) => {
      // Use boundary-safe word check
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(text);
    });
    if (matched && !detected.includes(guest.name)) {
      detected.push(guest.name);
    }
  }

  // Anthony Gallegos as return guest in post-130 episodes
  if (episode.episodeNumber && episode.episodeNumber > 130) {
    if (lowerText.includes('anthony gallegos') || lowerText.includes('anthony returns') || lowerText.includes('anthony is back')) {
      if (!detected.includes('Anthony Gallegos (Guest Return)')) {
        detected.push('Anthony Gallegos (Guest Return)');
      }
    }
  }

  return detected;
}

/**
 * Determines primary host era categorization for an episode
 */
export function getEpisodeEra(episode: Episode): 'anthony' | 'kristin' | 'transition' | 'finale' | 'specials' {
  if (episode.isBonus || episode.isSpecial || episode.title.toLowerCase().includes('commentary')) {
    return 'specials';
  }
  const num = episode.episodeNumber;
  if (num !== undefined && num >= 500 && num <= 550) {
    return 'finale';
  }
  if (isKristinEpisode(episode)) {
    return 'kristin';
  }
  if (isAnthonyEpisode(episode)) {
    return 'anthony';
  }
  return 'transition';
}
