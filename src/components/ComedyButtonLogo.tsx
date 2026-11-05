import React, { useState } from 'react';
import logoAsset from '../assets/logo.png';

interface ComedyButtonLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtext?: boolean;
}

export const ComedyButtonLogo: React.FC<ComedyButtonLogoProps> = ({
  className = '',
  size = 'md',
  showSubtext = false
}) => {
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(logoAsset);

  const heightClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16',
    hero: 'h-24 sm:h-32'
  }[size];

  const handleFallbackError = () => {
    if (currentSrc === logoAsset) {
      setCurrentSrc('/assets/logo.png');
    } else if (currentSrc === '/assets/logo.png') {
      setCurrentSrc('/assets/aistudio/tcb_logo__2__00ee0267.png');
    } else {
      setImgError(true);
    }
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {!imgError ? (
        <img
          src={currentSrc}
          alt="The Comedy Button"
          onError={handleFallbackError}
          className={`${heightClasses} w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:scale-105`}
        />
      ) : (
        /* Bulletproof SVG Vector Logo fallback if image fails across all CDN/file systems */
        <div className={`flex items-center gap-2 font-heading font-black tracking-tight ${heightClasses}`}>
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-md flex items-center justify-center border-2 border-white/20">
            <div className="w-4 h-4 rounded-full bg-red-400 opacity-75 shadow-inner" />
          </div>
          <span className="text-sm sm:text-base font-black tracking-tight uppercase text-white drop-shadow-md">
            The Comedy Button
          </span>
        </div>
      )}
    </div>
  );
};
