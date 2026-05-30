"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Send, MessageCircle, Copy, Check, MoreHorizontal, Mail } from "lucide-react";
import { canNativeShare, shareTo, ShareTarget } from "@/lib/share";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ShareMenuProps {
  text: string;
}

const OPTIONS: { target: ShareTarget; label: string; icon: LucideIcon; className: string }[] = [
  { target: "whatsapp", label: "WhatsApp", icon: Send, className: "bg-[#25D366] hover:bg-[#22c35e] text-white" },
  { target: "telegram", label: "Telegram", icon: Send, className: "bg-[#229ED9] hover:bg-[#1e8dc2] text-white" },
  { target: "sms", label: "SMS", icon: MessageCircle, className: "bg-zinc-700 hover:bg-zinc-800 text-white" },
  { target: "email", label: "Email", icon: Mail, className: "bg-zinc-500 hover:bg-zinc-600 text-white" },
];

export default function ShareMenu({ text }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    shareTo("copy", text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Primary: WhatsApp (the hero action) */}
      <button
        onClick={() => shareTo("whatsapp", text)}
        className="w-full h-14 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-green-500/20"
      >
        <Share2 className="w-5 h-5" />
        Send to WhatsApp
      </button>

      {/* Secondary destinations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {OPTIONS.slice(1).map(({ target, label, icon: Icon, className }) => (
          <button
            key={target}
            onClick={() => shareTo(target, text)}
            className={cn(
              "h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]",
              className
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <button
          onClick={handleCopy}
          className="h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.97]"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" /> Copied
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                <Copy className="w-4 h-4" /> Copy
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        {canNativeShare() && (
          <button
            onClick={() => shareTo("native", text)}
            className="h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.97]"
          >
            <MoreHorizontal className="w-4 h-4" />
            More
          </button>
        )}
      </div>
    </div>
  );
}
