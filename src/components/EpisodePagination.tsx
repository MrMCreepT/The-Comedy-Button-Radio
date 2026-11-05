import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface EpisodePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const EpisodePagination: React.FC<EpisodePaginationProps> = React.memo(({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-6 select-none">
      <button
        type="button"
        onClick={() => {
          triggerHaptic(6);
          onPageChange(currentPage - 1);
        }}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="w-10 h-10 rounded-full bg-[#181a20] border border-white/10 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:text-zinc-950 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
      </button>

      <div className="flex items-center gap-1.5 text-xs font-heading font-black">
        {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
          let pageNum = idx + 1;
          if (totalPages > 7 && currentPage > 4) {
            pageNum = currentPage - 4 + idx;
            if (pageNum > totalPages) pageNum = totalPages - (6 - idx);
          }
          return (
            <button
              type="button"
              key={pageNum}
              onClick={() => {
                triggerHaptic(6);
                onPageChange(pageNum);
              }}
              aria-label={`Page ${pageNum}`}
              aria-current={currentPage === pageNum ? 'page' : undefined}
              className={`w-9 h-9 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                currentPage === pageNum
                  ? 'bg-white text-zinc-950 font-black shadow-md scale-105'
                  : 'bg-[#181a20] text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          triggerHaptic(6);
          onPageChange(currentPage + 1);
        }}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="w-10 h-10 rounded-full bg-[#181a20] border border-white/10 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:text-zinc-950 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
      >
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
});
