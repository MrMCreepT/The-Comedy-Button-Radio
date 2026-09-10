import React from 'react';

interface ComedyButtonLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const ComedyButtonLogo: React.FC<ComedyButtonLogoProps> = ({
  className = '',
  size = 'md',
  showSubtext = false
}) => {
  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-base', container: 'gap-2.5' },
    md: { icon: 'w-10 h-10', text: 'text-xl', container: 'gap-3' },
    lg: { icon: 'w-14 h-14', text: 'text-3xl', container: 'gap-4' }
  }[size];

  return (
    <div className={`flex items-center select-none ${sizeClasses.container} ${className}`}>
      {/* Iconic 3D Red Button Icon with metallic rim */}
      <div className={`relative ${sizeClasses.icon} shrink-0 flex items-center justify-center`}>
        {/* Shadow base */}
        <div className="absolute inset-0 rounded-full bg-black/40 blur-[2px] translate-y-1" />
        {/* Metallic Beveled Base */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-neutral-200 via-neutral-400 to-neutral-600 p-[2px] shadow-md">
          <div className="w-full h-full rounded-full bg-neutral-300 border border-neutral-400/60" />
        </div>
        {/* Glossy Red Push Button with authentic 3D specular highlight */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-800 shadow-inner flex items-center justify-center overflow-hidden border border-red-400/40">
          {/* Top gloss arc */}
          <div className="absolute top-0.5 left-1.5 right-1.5 h-1/2 rounded-t-full bg-gradient-to-b from-white/60 to-transparent" />
          {/* Inner ring reflection */}
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/30 blur-[1px]" />
        </div>
      </div>

      {/* Official Typography: Cream letters with deep crimson shadow */}
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-black tracking-[0.25em] text-red-500 uppercase">
          The
        </span>
        <span
          className={`font-black tracking-tight text-stone-100 ${sizeClasses.text} uppercase drop-shadow-[0_2px_4px_rgba(185,28,28,0.4)]`}
          style={{
            letterSpacing: '-0.02em',
            WebkitTextStroke: '0.5px #7f1d1d'
          }}
        >
          Comedy Button
        </span>
        {showSubtext && (
          <span className="text-[11px] font-medium tracking-wide text-zinc-400 mt-0.5">
            24/7 Live Radio & Archive
          </span>
        )}
      </div>
    </div>
  );
};
