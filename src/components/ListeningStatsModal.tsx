import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListeningStats,
  loadListeningStats,
  getYearInReviewSummary
} from '../utils/listeningStats';
import { triggerHaptic } from '../utils/haptics';
import {
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  PieChart,
  Calendar,
  Radio,
  Download
} from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface ListeningStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ListeningStatsModal: React.FC<ListeningStatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<ListeningStats>(loadListeningStats());
  const [activeTab, setActiveTab] = useState<'overview' | 'eras' | 'shareCard'>('overview');
  const [copied, setCopied] = useState(false);
  const modalRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });

  // Refresh stats whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStats(loadListeningStats());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const summary = getYearInReviewSummary(stats);

  const handleCopyShare = async () => {
    triggerHaptic(12);
    const shareText = `🎙️ My Comedy Button Year-in-Review:
⏱️ Total Listened: ${summary.totalHours} hours
🔥 Daily Streak: ${summary.currentStreak} days (Best: ${summary.longestStreak})
🏆 Fan Rank: ${summary.archetype}
⭐ Top Era: ${summary.topEraName}
• Anthony Era (1-210): ${summary.breakdown.anthony.pct}%
• Four Horsemen (211-399): ${summary.breakdown.horsemen.pct}%
• Kristin Era (400+): ${summary.breakdown.kristin.pct}%
Tune in 24/7 at The Comedy Button Radio!`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stats-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#121520] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-zinc-100 overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Corner Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950/50">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 id="stats-modal-title" className="text-base font-bold text-zinc-100">Listening Stats & Highlights</h3>
                <p className="text-xs text-zinc-400">Your Comedy Button listening journey</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close stats modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 mb-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('eras')}
              className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'eras'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Era Breakdown
            </button>
            <button
              onClick={() => setActiveTab('shareCard')}
              className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'shareCard'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Share Card</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Top Fan Badge Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-zinc-900 to-amber-950/40 border border-red-900/40 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Official Certified Rank
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white">{summary.archetype}</h4>
                  <p className="text-xs text-zinc-300">
                    Favorite Era: <span className="font-bold text-red-400">{summary.topEraName}</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>

              {/* 4 Stat Badges Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold">Total Listened</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {summary.totalHours} <span className="text-xs font-normal text-zinc-400">hrs</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold">Current Streak</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono flex items-center gap-1">
                    {summary.currentStreak} <span className="text-xs font-normal text-zinc-400">days</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold">Episodes Completed</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {summary.episodesCompleted}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold">Longest Streak</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
                    {summary.longestStreak} <span className="text-xs font-normal text-zinc-400">days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ERA BREAKDOWN */}
          {activeTab === 'eras' && (
            <div className="space-y-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Anthony vs. Four Horsemen vs. Kristin Era Breakdown
              </p>

              {/* Anthony Era */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Classic 5 (Anthony Gallegos Era)</h5>
                    <p className="text-[11px] text-zinc-400">Episodes 1 to 210</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-400 font-mono">
                      {summary.breakdown.anthony.pct}%
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {summary.breakdown.anthony.hours} hrs
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-500"
                    style={{ width: `${summary.breakdown.anthony.pct}%` }}
                  />
                </div>
              </div>

              {/* Four Horsemen Era */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">The Four Horsemen Era</h5>
                    <p className="text-[11px] text-zinc-400">Episodes 211 to 399</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {summary.breakdown.horsemen.pct}%
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {summary.breakdown.horsemen.hours} hrs
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${summary.breakdown.horsemen.pct}%` }}
                  />
                </div>
              </div>

              {/* Kristin Era */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Kristin Van De Yar Era</h5>
                    <p className="text-[11px] text-zinc-400">Episodes 400+</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-purple-400 font-mono">
                      {summary.breakdown.kristin.pct}%
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {summary.breakdown.kristin.hours} hrs
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${summary.breakdown.kristin.pct}%` }}
                  />
                </div>
              </div>

              {/* Bonus Releases */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Bonus & Live Streams</h5>
                    <p className="text-[11px] text-zinc-400">Patreon Specials & 24/7 Radio</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {summary.breakdown.bonus.pct}%
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {summary.breakdown.bonus.hours} hrs
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${summary.breakdown.bonus.pct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHAREABLE VISUAL CARD */}
          {activeTab === 'shareCard' && (
            <div className="space-y-4">
              {/* The Visual Card Container */}
              <div className="relative p-5 rounded-3xl bg-gradient-to-br from-[#1a080a] via-[#121520] to-[#0d1017] border-2 border-red-700/60 shadow-2xl overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-36 h-36 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

                {/* Card Brand Header */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-red-400">
                        The Comedy Button
                      </span>
                      <h4 className="text-xs font-bold text-white">Year-in-Review</h4>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
                    {summary.archetype}
                  </span>
                </div>

                {/* Card Body Highlights */}
                <div className="grid grid-cols-2 gap-3 relative z-10 py-1">
                  <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Total Hours</p>
                    <p className="text-xl font-black text-white font-mono">{summary.totalHours} hrs</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Daily Streak</p>
                    <p className="text-xl font-black text-amber-400 font-mono">{summary.currentStreak} days</p>
                  </div>
                </div>

                {/* Card Era Summary */}
                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800 space-y-1.5 relative z-10">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Top Era:</span>
                    <span className="font-bold text-red-400">{summary.topEraName}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="bg-red-600 h-full" style={{ width: `${summary.breakdown.anthony.pct}%` }} />
                    <div className="bg-amber-500 h-full" style={{ width: `${summary.breakdown.horsemen.pct}%` }} />
                    <div className="bg-purple-500 h-full" style={{ width: `${summary.breakdown.kristin.pct}%` }} />
                    <div className="bg-emerald-500 h-full" style={{ width: `${summary.breakdown.bonus.pct}%` }} />
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 text-center relative z-10">
                  comedybutton.com • 24/7 Live Radio & Archive
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShare}
                  className="flex-1 min-h-[48px] px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied Summary to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Shareable Card Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
