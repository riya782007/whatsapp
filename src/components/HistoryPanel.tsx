"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Copy, Send, Clock, Check } from "lucide-react";
import { useState } from "react";
import { HistoryItem, clearHistory, removeHistory } from "@/lib/history";
import { TONE_CONFIG, LANGUAGE_CONFIG } from "@/lib/config";
import { shareTo } from "@/lib/share";

interface HistoryPanelProps {
  open: boolean;
  items: HistoryItem[];
  onClose: () => void;
  onChange: (items: HistoryItem[]) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function HistoryPanel({ open, items, onClose, onChange }: HistoryPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (item: HistoryItem) => {
    shareTo("copy", item.formattedMessage);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex justify-end"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-400" />
                <h2 className="font-bold text-lg">History</h2>
                <span className="text-xs text-zinc-400">({items.length})</span>
              </div>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button
                    onClick={() => {
                      clearHistory();
                      onChange([]);
                    }}
                    className="text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-20 text-zinc-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No saved messages yet.</p>
                  <p className="text-xs mt-1">Your formatted messages will appear here.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-800/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span>{LANGUAGE_CONFIG[item.language]?.flag}</span>
                        <span>{TONE_CONFIG[item.tone]?.emoji} {TONE_CONFIG[item.tone]?.label}</span>
                        <span>·</span>
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>
                      <button
                        onClick={() => onChange(removeHistory(item.id))}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {item.formattedMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => shareTo("whatsapp", item.formattedMessage)}
                        className="flex-1 h-9 rounded-lg bg-[#25D366] hover:bg-[#22c35e] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                      <button
                        onClick={() => handleCopy(item)}
                        className="h-9 px-3 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <><Check className="w-3.5 h-3.5 text-green-600" /> Copied</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
