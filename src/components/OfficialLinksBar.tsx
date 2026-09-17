import React from 'react';
import { motion } from 'motion/react';
import {
  Globe,
  Shirt,
  Headphones,
  Radio,
  Heart,
  MessageSquare,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { OFFICIAL_LINKS, PodcastLink } from '../data/links';

interface OfficialLinksBarProps {
  variant?: 'pills' | 'cards' | 'compact' | 'footer';
  className?: string;
  showDescriptions?: boolean;
}

const renderLinkIcon = (iconName: PodcastLink['iconName'], className: string = 'w-4 h-4') => {
  switch (iconName) {
    case 'Globe':
      return <Globe className={className} />;
    case 'Shirt':
      return <Shirt className={className} />;
    case 'ApplePodcast':
      return <Headphones className={className} />;
    case 'Spotify':
      return <Radio className={className} />;
    case 'Patreon':
      return <Heart className={className} />;
    case 'Discord':
      return <MessageSquare className={className} />;
    default:
      return <ExternalLink className={className} />;
  }
};

export const OfficialLinksBar: React.FC<OfficialLinksBarProps> = ({
  variant = 'pills',
  className = '',
  showDescriptions = false,
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {OFFICIAL_LINKS.map((link) => (
          <motion.a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              link.highlight
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
            }`}
            title={`${link.name} - ${link.description}`}
          >
            <span style={{ color: link.accentColor }}>
              {renderLinkIcon(link.iconName, 'w-3.5 h-3.5')}
            </span>
            <span>{link.name}</span>
            {link.badge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {link.badge}
              </span>
            )}
            <ExternalLink className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-300" />
          </motion.a>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
        {OFFICIAL_LINKS.map((link) => (
          <motion.a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#121520] hover:bg-[#161a28] border border-zinc-800/90 hover:border-zinc-700 transition-all shadow-md cursor-pointer overflow-hidden"
          >
            {/* Ambient accent background glow */}
            <div
              className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 blur-xl transition-opacity pointer-events-none"
              style={{ backgroundColor: link.accentColor }}
            />

            {/* Icon Container */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-zinc-700/60 shadow-inner group-hover:scale-105 transition-transform"
              style={{
                backgroundColor: `${link.accentColor}15`,
                color: link.accentColor,
              }}
            >
              {renderLinkIcon(link.iconName, 'w-5 h-5')}
            </div>

            {/* Link Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">
                  {link.name}
                </h4>
                {link.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {link.badge}
                  </span>
                )}
                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 ml-auto shrink-0 transition-colors" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 leading-normal">
                {link.description}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    );
  }

  // Compact row (for Navbar or Header)
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {OFFICIAL_LINKS.map((link) => (
        <motion.a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          title={`${link.name}: ${link.description}`}
        >
          <span style={{ color: link.accentColor }}>
            {renderLinkIcon(link.iconName, 'w-3.5 h-3.5')}
          </span>
          <span className="hidden md:inline">{link.shortName}</span>
        </motion.a>
      ))}
    </div>
  );
};
