import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Radio, Heart } from 'lucide-react';
import { ComedyButtonLogo } from './ComedyButtonLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { OFFICIAL_LINKS } from '../data/links';
import { OfficialLinksBar } from './OfficialLinksBar';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-zinc-800/80 bg-[#0a0c12] text-zinc-400 text-xs relative z-20 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Top Grid: Brand & Links */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Brand Info */}
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-3">
              <ComedyButtonLogo size="sm" />
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800/50 text-red-400 font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3" />
                24/7 Radio & Archive
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Your aural canals are ours, and we&apos;re filling them with nonsense — courtesy of hosts Brian Altano, Scott Bromley, Anthony Gallegos, Ryan Scott, Max Scoville, and Kristin Van De Yar.
            </p>
            <div className="pt-1">
              <PWAInstallButton variant="pill" />
            </div>
          </div>

          {/* Official Channel Links Section */}
          <div className="w-full md:w-auto space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Official Links & Merch
            </h4>
            <OfficialLinksBar variant="pills" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-zinc-800/60" />

        {/* Bottom Credits & Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>
            The Comedy Button &copy; {new Date().getFullYear()}. Audio content hosted via Libsyn CDN.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://store.comedybutton.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Get Official T-Shirts</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>&bull;</span>
            <a
              href="https://www.patreon.com/comedybutton"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400/90 hover:text-rose-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Support on Patreon</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
