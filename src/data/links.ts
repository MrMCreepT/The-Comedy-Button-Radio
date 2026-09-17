export interface PodcastLink {
  id: string;
  name: string;
  shortName: string;
  url: string;
  description: string;
  iconName: 'Globe' | 'Shirt' | 'ApplePodcast' | 'Spotify' | 'Patreon' | 'Discord';
  category: 'official' | 'shop' | 'stream' | 'community';
  highlight?: boolean;
  badge?: string;
  accentColor: string;
}

export const OFFICIAL_LINKS: PodcastLink[] = [
  {
    id: 'website',
    name: 'Official Website',
    shortName: 'Website',
    url: 'https://www.comedybutton.com/',
    description: 'Episodes, news, and official announcements',
    iconName: 'Globe',
    category: 'official',
    accentColor: '#ef4444', // red-500
  },
  {
    id: 'store',
    name: 'T-Shirts & Merch Store',
    shortName: 'T-Shirts',
    url: 'https://store.comedybutton.com',
    description: 'Official Comedy Button t-shirts, hoodies, and accessories',
    iconName: 'Shirt',
    category: 'shop',
    highlight: true,
    badge: 'Official Gear',
    accentColor: '#f97316', // orange-500
  },
  {
    id: 'apple',
    name: 'Apple Podcasts',
    shortName: 'Apple',
    url: 'https://podcasts.apple.com/us/podcast/the-comedy-button/id473384513',
    description: 'Subscribe & review on Apple Podcasts',
    iconName: 'ApplePodcast',
    category: 'stream',
    accentColor: '#a855f7', // purple-500
  },
  {
    id: 'spotify',
    name: 'Spotify',
    shortName: 'Spotify',
    url: 'https://open.spotify.com/show/50ckeiqdc4dovp3pwIdkHG',
    description: 'Stream on Spotify mobile & desktop',
    iconName: 'Spotify',
    category: 'stream',
    accentColor: '#22c55e', // green-500
  },
  {
    id: 'patreon',
    name: 'Patreon',
    shortName: 'Patreon',
    url: 'https://www.patreon.com/comedybutton',
    description: 'Support the show, unlock bonus episodes & weekly pre-shows',
    iconName: 'Patreon',
    category: 'community',
    badge: 'Bonus Audio',
    accentColor: '#f43f5e', // rose-500
  },
  {
    id: 'discord',
    name: 'Discord Community',
    shortName: 'Discord',
    url: 'https://discord.comedybutton.com/',
    description: 'Join the chat, voice channels, and community hangouts',
    iconName: 'Discord',
    category: 'community',
    accentColor: '#5865f2', // discord blurple
  },
];
