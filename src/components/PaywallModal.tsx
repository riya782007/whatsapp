"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, Crown, Sparkles, Loader2 } from "lucide-react";
import { PLANS, Plan, FREE_DAILY_LIMIT } from "@/lib/config";
import { startCheckout } from "@/lib/checkout";
import { cn } from "@/lib/utils";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional context line, e.g. "You've used all 5 free messages today". */
  reason?: string;
}

export default function PaywallModal({ open, onClose, reason }: PaywallModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleUpgrade = async (plan: Plan) => {
    setNotice(null);
    setLoadingPlan(plan.id);
    const result = await startCheckout(plan);

    if (result.status === "redirecting") {
      // Browser is navigating to Razorpay's hosted payment page.
      setNotice("Opening secure payment page…");
      return; // keep the spinner; page will navigate away
    }

    setLoadingPlan(null);

    if (result.status === "unconfigured") {
      setNotice(
        "Payments are being set up. Add your Razorpay keys in Vercel to enable live checkout."
      );
    } else if (result.status === "error") {
      setNotice(result.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="px-6 pt-8 pb-6 text-center bg-gradient-to-b from-green-50 to-transparent dark:from-green-950/20">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 mb-4">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Go Unlimited</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs mx-auto">
                {reason ||
                  `Free plan gives you ${FREE_DAILY_LIMIT} messages a day. Upgrade to send as many as you want, unlock every tone, and remove ads.`}
              </p>
            </div>

            {/* Plans */}
            <div className="px-6 pb-6 space-y-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border p-5 transition-all",
                    plan.popular
                      ? "border-green-500 bg-green-50/50 dark:bg-green-950/10 shadow-md"
                      : "border-zinc-200 dark:border-zinc-700"
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-5 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Most Popular
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{plan.name}</h3>
                        {plan.id === "lifetime" && <Sparkles className="w-4 h-4 text-amber-500" />}
                      </div>
                      <p className="text-xs text-zinc-500">{plan.tagline}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold">{plan.priceLabel}</div>
                      <div className="text-xs text-zinc-400">{plan.period}</div>
                    </div>
                  </div>

                  {plan.highlight && (
                    <p className="text-xs font-semibold text-green-600 mb-3">{plan.highlight}</p>
                  )}

                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loadingPlan !== null}
                    className={cn(
                      "w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60",
                      plan.popular
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                        : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
                    )}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Upgrade to {plan.name}</>
                    )}
                  </button>
                </div>
              ))}

              {notice && (
                <p className="text-xs text-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3">
                  {notice}
                </p>
              )}

              <p className="text-[11px] text-center text-zinc-400 pt-1">
                Secure live payment via Razorpay · UPI & Cards accepted · No hidden charges
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
