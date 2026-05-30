"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Tone, TONE_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";

interface TonePickerProps {
  value: Tone;
  onChange: (tone: Tone) => void;
  isPro: boolean;
  /** Called when a free user taps a locked (Pro) tone. */
  onLockedTap: () => void;
}

export default function TonePicker({ value, onChange, isPro, onLockedTap }: TonePickerProps) {
  return (
    <div className="mb-8">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
        Message Style
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(Object.keys(TONE_CONFIG) as Tone[]).map((tone) => {
          const cfg = TONE_CONFIG[tone];
          const isActive = value === tone;
          const locked = cfg.pro && !isPro;
          return (
            <motion.button
              key={tone}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (locked) {
                  onLockedTap();
                  return;
                }
                onChange(tone);
              }}
              title={cfg.description}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-md"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400",
                locked && "opacity-70"
              )}
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
              {locked && <Lock className="w-3 h-3 text-amber-500" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
