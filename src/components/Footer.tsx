import React from 'react';
import { Radio } from 'lucide-react';
import { ComedyButtonLogo } from './ComedyButtonLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { OfficialLinksBar } from './OfficialLinksBar';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0e1015] text-zinc-400 text-xs relative z-20 pb-32 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Top Grid: Brand & Links */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Brand Info */}
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-3">
              <ComedyButtonLogo size="sm" />
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Filling your aural canals with nonsense since 2011 — courtesy of hosts Brian Altano, Scott Bromley, Anthony Gallegos, Ryan Scott, Max Scoville, and Kristin Van De Yar.
            </p>
            <div className="pt-1">
              <PWAInstallButton variant="pill" />
            </div>
          </div>

          {/* Official Channel Links Section */}
          <div className="w-full md:w-auto space-y-3">
            <h4 className="font-heading font-black text-xs uppercase tracking-tight text-white">
              OFFICIAL COMMUNITY & MERCH
            </h4>
            <OfficialLinksBar variant="pills" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/10" />

        {/* Bottom Credits & Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-500">
          <p>
            The Comedy Button &copy; {new Date().getFullYear()}. 24/7 Global Live Radio & Master Catalog.
          </p>
          <p className="text-zinc-600">
            Audio content &copy; The Comedy Button podcast.
          </p>
        </div>
      </div>
    </footer>
  );
};
