import { Episode } from '../types';

export interface ShowNotesTopic {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  keywords: string[];
}

export const SHOW_NOTES_TOPICS: ShowNotesTopic[] = [
  {
    id: 'food',
    label: 'Food, Drinks & Taste Tests',
    shortLabel: 'Food & Drinks',
    emoji: '🍔',
    description: 'Fast food adventures, taste tests, weird soda, hobo wine & snacks',
    keywords: [
      'food', 'snack', 'snax', 'pizza', 'taco', 'taco bell', 'mcdonald', 'burger',
      'soda', 'beer', 'wine', 'hobo wine', 'buffet', 'candy', 'taste test',
      'cheetos', 'doritos', 'restaurant', 'eating', 'hungry', 'cereal'
    ]
  },
  {
    id: 'guests',
    label: 'Guest Stars & Friends',
    shortLabel: 'Guest Stars',
    emoji: '🎙️',
    description: 'Episodes featuring guest appearances mentioned in show notes',
    keywords: [
      'guest', 'special appearance', 'starring', 'featuring', 'jared petty',
      'dan ryckert', 'adam sessler', 'danny tamberelli', 'colin moriarty',
      'greg miller', 'mike drucker', 'anthony carboni', 'alanah pearce',
      'jack devries', 'marty sliva', 'mitch dyer', 'brandon hunt'
    ]
  },
  {
    id: 'animals',
    label: 'Pets & Animals',
    shortLabel: 'Pets & Animals',
    emoji: '🐾',
    description: 'Stories about dogs, cats, horses, mice, raccoons and strange animal encounters',
    keywords: [
      'dog', 'dogs', 'cat', 'cats', 'animal', 'animals', 'horse', 'horses',
      'pet', 'pets', 'lizard', 'lizards', 'raccoon', 'raccoons', 'mice', 'mouse',
      'snake', 'snakes', 'bird', 'birds', 'puppy', 'kitten'
    ]
  },
  {
    id: 'gaming',
    label: 'Video Games & Conventions',
    shortLabel: 'Gaming & Cons',
    emoji: '🎮',
    description: 'Gaming memories, E3, PAX, consoles, game releases & industry stories',
    keywords: [
      'video game', 'video games', 'gaming', 'game', 'games', 'e3', 'pax',
      'nintendo', 'playstation', 'xbox', 'sega', 'ign', 'comic-con', 'arcade'
    ]
  },
  {
    id: 'movies',
    label: 'Movies & Commentaries',
    shortLabel: 'Movies & Pop Culture',
    emoji: '🎬',
    description: 'Film critiques, movie commentaries, cinema disasters and Hollywood discussions',
    keywords: [
      'movie', 'movies', 'film', 'films', 'commentary', 'cinema', 'theater',
      'hollywood', 'star wars', 'batman', 'jurassic', 'sequel', 'screenplay', 'actor'
    ]
  },
  {
    id: 'halloween',
    label: 'Halloween & Spooky Stories',
    shortLabel: 'Halloween & Spooky',
    emoji: '🎃',
    description: 'Haunted houses, ghost encounters, spooky specials and scary tales',
    keywords: [
      'halloween', 'horror', 'scary', 'ghost', 'ghosts', 'haunted',
      'costume', 'costumes', 'spooky', 'creepy', 'witch', 'monster'
    ]
  },
  {
    id: 'travel',
    label: 'Travel & Road Trips',
    shortLabel: 'Travel Stories',
    emoji: '✈️',
    description: 'Airport security sagas, disastrous flights, hotel horrors & Vegas vacations',
    keywords: [
      'travel', 'flight', 'flights', 'airport', 'airports', 'airplane',
      'hotel', 'hotels', 'road trip', 'las vegas', 'vegas', 'vacation',
      'rental car', 'tourist', 'passport'
    ]
  },
  {
    id: 'dating',
    label: 'Romance & Relationships',
    shortLabel: 'Dating & Romance',
    emoji: '💍',
    description: 'Dating mishaps, weddings, relationship advice and partner stories',
    keywords: [
      'dating', 'wedding', 'weddings', 'girlfriend', 'wife', 'wives',
      'husband', 'marriage', 'relationship', 'relationships', 'significant other',
      'first date', 'romance', 'proposal'
    ]
  },
  {
    id: 'holidays',
    label: 'Holidays & Christmas',
    shortLabel: 'Holidays',
    emoji: '🎄',
    description: 'Holiday festivities, Christmas episodes, Thanksgiving meals and celebrations',
    keywords: [
      'christmas', 'thanksgiving', 'holiday', 'holidays', 'santa',
      'new year', 'presents', 'gift', 'turkey'
    ]
  },
  {
    id: 'mailbag',
    label: 'Listener Mailbag & Advice',
    shortLabel: 'Mailbag & Advice',
    emoji: '✉️',
    description: 'Answers to listener questions, life advice and crazy community letters',
    keywords: [
      'mailbag', 'listener question', 'listener questions', 'listener letter',
      'listener letters', 'advice', 'letters', 'questions from listeners',
      'dear comedy button'
    ]
  }
];

export const POPULAR_GUEST_NAMES = [
  'Anthony Gallegos (Guest Return)',
  'Jared Petty',
  'Jack DeVries',
  'Marty Sliva',
  'Mike Drucker',
  'Dan Ryckert',
  'Adam Sessler',
  'Danny Tamberelli',
  'Colin Moriarty',
  'Greg Miller',
  'Zach Ryan',
  'Anthony Carboni',
  'Mitch Dyer',
  'Brandon Hunt',
  'Andrew Goldfarb',
  'Alanah Pearce'
];

/**
 * Checks if an episode's show notes or metadata match a selected topic
 */
export function episodeMatchesTopic(
  episode: Episode,
  topicId: string,
  selectedGuest?: string
): boolean {
  if (topicId === 'all') return true;

  if (topicId === 'guests') {
    if (selectedGuest && selectedGuest !== 'all') {
      const guests = episode.detectedGuests || [];
      if (guests.includes(selectedGuest)) return true;
      const desc = (episode.description || '').toLowerCase();
      return desc.includes(selectedGuest.toLowerCase());
    }
    // Any guest
    return Boolean(
      (episode.detectedGuests && episode.detectedGuests.length > 0) ||
      (episode.description && /\b(guest|special appearance|starring|featuring)\b/i.test(episode.description))
    );
  }

  const topic = SHOW_NOTES_TOPICS.find((t) => t.id === topicId);
  if (!topic) return true;

  const desc = (episode.description || '').toLowerCase();
  const title = (episode.title || '').toLowerCase();

  return topic.keywords.some((word) => {
    // Word boundary or phrase check
    if (word.includes(' ')) {
      return desc.includes(word) || title.includes(word);
    }
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(desc) || regex.test(title);
  });
}

/**
 * Extracts matching show notes topics for an episode to display badges
 */
export function getEpisodeDetectedTopics(episode: Episode): ShowNotesTopic[] {
  const desc = (episode.description || '').toLowerCase();
  const title = (episode.title || '').toLowerCase();
  const matched: ShowNotesTopic[] = [];

  for (const topic of SHOW_NOTES_TOPICS) {
    if (topic.id === 'guests') {
      if (episode.detectedGuests && episode.detectedGuests.length > 0) {
        matched.push(topic);
      }
      continue;
    }

    const hasMatch = topic.keywords.some((word) => {
      if (word.includes(' ')) {
        return desc.includes(word) || title.includes(word);
      }
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(desc) || regex.test(title);
    });

    if (hasMatch) {
      matched.push(topic);
    }
  }

  return matched;
}

/**
 * Extracts a relevant snippet from the show notes centered around the search/filter match
 */
export function extractShowNotesSnippet(
  description: string,
  query: string,
  maxRadius: number = 80
): { snippet: string; matchedText: string; isMatched: boolean } {
  if (!description) {
    return { snippet: '', matchedText: '', isMatched: false };
  }

  const cleanDesc = description.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

  if (!query || !query.trim()) {
    // Return first 140 chars as preview
    const snippet = cleanDesc.length > 140 ? `${cleanDesc.slice(0, 140)}...` : cleanDesc;
    return { snippet, matchedText: '', isMatched: false };
  }

  const q = query.trim().toLowerCase();
  const lowerDesc = cleanDesc.toLowerCase();
  const idx = lowerDesc.indexOf(q);

  if (idx === -1) {
    // No match in show notes directly
    const snippet = cleanDesc.length > 140 ? `${cleanDesc.slice(0, 140)}...` : cleanDesc;
    return { snippet, matchedText: '', isMatched: false };
  }

  // Found match: extract window around it
  const start = Math.max(0, idx - maxRadius);
  const end = Math.min(cleanDesc.length, idx + q.length + maxRadius);

  let snippet = cleanDesc.slice(start, end).trim();
  if (start > 0) snippet = `...${snippet}`;
  if (end < cleanDesc.length) snippet = `${snippet}...`;

  const matchedText = cleanDesc.slice(idx, idx + q.length);

  return {
    snippet,
    matchedText,
    isMatched: true
  };
}
