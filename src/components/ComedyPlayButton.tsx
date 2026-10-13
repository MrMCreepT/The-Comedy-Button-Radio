import React, { useId } from 'react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';

export interface ComedyPlayButtonProps {
  isPlaying: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
  showGlow?: boolean;
}

export const ComedyPlayButton: React.FC<ComedyPlayButtonProps> = ({
  isPlaying,
  onClick,
  size = 'md',
  disabled = false,
  className = '',
  title,
  ariaLabel,
  showGlow = true,
}) => {
  const uniqueId = useId().replace(/:/g, '_');

  const sizeDimensions = {
    sm: { px: 42, iconSize: 18, stroke: 3 },
    md: { px: 54, iconSize: 22, stroke: 3.5 },
    lg: { px: 72, iconSize: 28, stroke: 4 },
    xl: { px: 104, iconSize: 42, stroke: 5 },
  }[size];

  const { px } = sizeDimensions;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    triggerHaptic(14);
    onClick(e);
  };

  const buttonTitle = title || (isPlaying ? 'Pause broadcast' : 'Press the Comedy Button to Play');
  const buttonAriaLabel = ariaLabel || buttonTitle;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={buttonAriaLabel}
      aria-pressed={isPlaying}
      title={buttonTitle}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.92, y: 2 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      style={{ width: px, height: px }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/60 transition-shadow ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:cursor-grabbing'
      } ${className}`}
    >
      {/* Ambient Pulsing Glow when active broadcast is playing */}
      {showGlow && isPlaying && !disabled && (
        <span
          className="absolute inset-0 rounded-full bg-red-600/40 blur-lg animate-pulse pointer-events-none -z-10 scale-125"
          aria-hidden="true"
        />
      )}

      {/* High-Fidelity SVG Rendering of the iconic The Comedy Button */}
      <svg
        viewBox="0 0 512 512"
        width={px}
        height={px}
        className="w-full h-full drop-shadow-lg overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Outer Metallic Bevel */}
          <linearGradient id={`outerBevel_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#e4e4e7" />
            <stop offset="65%" stopColor="#71717a" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>

          {/* Metallic Rim Depth */}
          <radialGradient id={`metallicRim_${uniqueId}`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#18181b" />
          </radialGradient>

          {/* 3D Glossy Red Button Core Gradient */}
          <radialGradient id={`redButton_${uniqueId}`} cx="48%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ff5555" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#dc2626" />
            <stop offset="90%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>

          {/* Top Specular Gloss Reflection Arc */}
          <linearGradient id={`topGloss_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Bottom Rim Highlight */}
          <linearGradient id={`bottomRim_${uniqueId}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#dc2626" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Bezel Drop Shadow */}
        <circle cx="256" cy="268" r="236" fill="#000000" opacity="0.45" />

        {/* Metallic Beveled Outer Ring (Silver Bezel) */}
        <circle cx="256" cy="256" r="236" fill={`url(#outerBevel_${uniqueId})`} />
        <circle cx="256" cy="256" r="222" fill={`url(#metallicRim_${uniqueId})`} />

        {/* Recessed Dark Bevel Gap */}
        <circle cx="256" cy="256" r="202" fill="#09090b" />

        {/* 3D Glossy Red Dome Core */}
        <circle
          cx="256"
          cy={isPlaying ? 258 : 254}
          r="194"
          fill={`url(#redButton_${uniqueId})`}
          stroke="#7f1d1d"
          strokeWidth="3"
        />

        {/* Inner Bottom Subtle Rim Illumination */}
        <circle
          cx="256"
          cy={isPlaying ? 258 : 254}
          r="192"
          fill={`url(#bottomRim_${uniqueId})`}
        />

        {/* Top Gloss Highlight Arc Sheen */}
        <path
          d="M 125 210 C 145 130, 367 130, 387 210 C 340 155, 172 155, 125 210 Z"
          fill={`url(#topGloss_${uniqueId})`}
        />

        {/* Center Icon: Play Triangle or Pause Bars with 3D Emboss / Depth */}
        <g transform={isPlaying ? 'translate(256, 258)' : 'translate(256, 254)'}>
          {isPlaying ? (
            /* Pause State: Dual Rounded Bars with Drop Shadow */
            <g>
              {/* Drop Shadow */}
              <rect x="-48" y="-52" width="28" height="108" rx="8" fill="#450a0a" opacity="0.75" />
              <rect x="20" y="-52" width="28" height="108" rx="8" fill="#450a0a" opacity="0.75" />
              {/* Foreground White Bars */}
              <rect x="-48" y="-56" width="28" height="108" rx="8" fill="#ffffff" />
              <rect x="20" y="-56" width="28" height="108" rx="8" fill="#ffffff" />
            </g>
          ) : (
            /* Play State: Scaled Play Triangle with Drop Shadow */
            <g transform="translate(6, 0)">
              {/* Drop Shadow */}
              <path
                d="M -42 -66 C -42 -76 -30 -82 -21 -77 L 68 -22 C 77 -17 77 -5 68 0 L -21 55 C -30 60 -42 54 -42 44 Z"
                fill="#450a0a"
                opacity="0.8"
                transform="translate(0, 4)"
              />
              {/* Foreground White Play Triangle */}
              <path
                d="M -42 -66 C -42 -76 -30 -82 -21 -77 L 68 -22 C 77 -17 77 -5 68 0 L -21 55 C -30 60 -42 54 -42 44 Z"
                fill="#ffffff"
              />
            </g>
          )}
        </g>
      </svg>
    </motion.button>
  );
};
