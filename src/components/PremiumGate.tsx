"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Sparkles, Palette, Clock, Ban } from "lucide-react";

interface PremiumGateProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const BENEFITS = [
  { icon: Zap, label: "Unlimited messages" },
  { icon: Palette, label: "All tone styles" },
  { icon: Clock, label: "Priority AI processing" },
  { icon: Ban, label: "No ads" },
];

export default function PremiumGate({ isOpen, onClose, onUpgrade }: PremiumGateProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
          >
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 px-6 py-8 text-center text-white">
              <Sparkles className="w-10 h-10 mx-auto mb-3" />
              <h3 className="text-xl font-bold">Daily Free Limit Reached</h3>
              <p className="text-sm text-white/80 mt-1">
                You&apos;ve used all 5 free messages today
              </p>
            </div>

            {/* Benefits */}
            <div className="px-6 py-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                Premium Benefits
              </p>
              {BENEFITS.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                    <b.icon className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-3">
              <button
                onClick={onUpgrade}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-purple-500/20"
              >
                <Zap className="w-4 h-4" />
                Upgrade to Pro
              </button>
              <button
                onClick={onClose}
                className="w-full text-center text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium py-2 transition-colors"
              >
                Maybe later
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
