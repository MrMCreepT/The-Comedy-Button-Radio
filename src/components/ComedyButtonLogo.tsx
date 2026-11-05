import React from 'react';

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
  const heightClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16',
    hero: 'h-24 sm:h-32'
  }[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/assets/aistudio/tcb_logo__2__00ee0267.png"
        alt="The Comedy Button"
        className={`${heightClasses} w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:scale-105`}
      />
    </div>
  );
};
