import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1 text-xs font-semibold">
        {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
          let pageNum = idx + 1;
          if (totalPages > 7 && currentPage > 4) {
            pageNum = currentPage - 4 + idx;
            if (pageNum > totalPages) pageNum = totalPages - (6 - idx);
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={currentPage === pageNum ? 'page' : undefined}
              className={`w-8 h-8 rounded-lg transition-colors cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});
