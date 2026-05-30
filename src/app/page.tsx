"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  Copy,
  MessageSquare,
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  Clock,
  Crown,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, errorMessage } from "@/lib/utils";
import AdBanner from "@/components/AdBanner";
import TonePicker from "@/components/TonePicker";
import ShareMenu from "@/components/ShareMenu";
import PaywallModal from "@/components/PaywallModal";
import HistoryPanel from "@/components/HistoryPanel";
import { finalizeFromRedirect } from "@/lib/checkout";
import {
  Language,
  Tone,
  Result,
  LANGUAGE_CONFIG,
  FREE_DAILY_LIMIT,
} from "@/lib/config";
import {
  canGenerate,
  getRemaining,
  incrementUsage,
  isPro as checkIsPro,
} from "@/lib/usage";
import { HistoryItem, getHistory, addHistory } from "@/lib/history";

// Deterministic peak heights for the audio visualizer bars (avoids
// calling Math.random during render, which React flags as impure).
const BAR_PEAKS = [40, 44, 38, 46, 41, 45, 39, 43, 47, 40, 42, 46, 38, 44];

export default function Home() {
  const [language, setLanguage] = useState<Language>("auto");
  const [tone, setTone] = useState<Tone>("general");
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "success" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // monetization + history state
  const [mounted, setMounted] = useState(false);
  const [pro, setPro] = useState(false);
  const [remaining, setRemaining] = useState(FREE_DAILY_LIMIT);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [upgradeBanner, setUpgradeBanner] = useState<
    { type: "success" | "failed"; text: string } | null
  >(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordTime, setRecordTime] = useState(0);

  // Load persisted state on mount (client-only to avoid hydration mismatch).
  // localStorage isn't available during SSR, so this must run in an effect.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    setPro(checkIsPro());
    setRemaining(getRemaining());
    setHistory(getHistory());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const refreshEntitlement = useCallback(() => {
    setPro(checkIsPro());
    setRemaining(getRemaining());
  }, []);

  // After returning from the Razorpay payment page, confirm + unlock.
  useEffect(() => {
    let active = true;
    finalizeFromRedirect().then((r) => {
      if (!active) return;
      if (r.state === "success") {
        refreshEntitlement();
        setUpgradeBanner({
          type: "success",
          text:
            r.tier === "lifetime"
              ? "🎉 Payment successful — Lifetime access unlocked!"
              : "🎉 Payment successful — Pro is now active!",
        });
      } else if (r.state === "failed") {
        setUpgradeBanner({
          type: "failed",
          text: "Payment was not completed. You can try again anytime.",
        });
      }
    });
    return () => {
      active = false;
    };
  }, [refreshEntitlement]);

  useEffect(() => {
    if (status !== "recording") return;
    const id = setInterval(() => setRecordTime((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const openPaywall = (reason?: string) => {
    setPaywallReason(reason);
    setShowPaywall(true);
  };

  const startRecording = async () => {
    // Gate: free users get a limited number of messages per day
    if (!canGenerate()) {
      openPaywall(`You've used all ${FREE_DAILY_LIMIT} free messages today. Upgrade for unlimited.`);
      return;
    }
    try {
      // ── Noise suppression: clean the audio before it ever reaches Whisper ──
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      // Prefer Opus in webm — best quality/size for speech recognition
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, audioBitsPerSecond: 128000 } : undefined
      );
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setStatus("recording");
      setError("");
      setResult(null);
      setRecordTime(0);
    } catch {
      setError("Microphone access denied. Please check your browser settings.");
      setStatus("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setStatus("processing");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Step 1 — Transcribe with language hint (auto = Whisper detects)
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("language", language);

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json();
        throw new Error(errData.error || "Transcription failed");
      }

      const { text } = await transcribeRes.json();
      setTranscript(text);

      if (!text || !text.trim()) {
        throw new Error("Couldn't catch any speech. Please try again in a quieter spot.");
      }

      // Step 2 — Format with language + tone aware AI prompt
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, language, tone }),
      });

      if (!generateRes.ok) {
        const errData = await generateRes.json();
        throw new Error(errData.error || "Formatting failed");
      }

      const resultData: Result = await generateRes.json();
      setResult(resultData);
      setStatus("success");

      // Count usage (free tier only) + persist to history
      if (!checkIsPro()) {
        incrementUsage();
        setRemaining(getRemaining());
      }
      setHistory(
        addHistory({
          formattedMessage: resultData.formattedMessage,
          poll: resultData.poll ?? null,
          transcript: text,
          language,
          tone,
        })
      );
    } catch (err: unknown) {
      const message = errorMessage(err);
      setError(
        message.includes("quota")
          ? "API Limit Reached: Please check your API billing/credits."
          : message
      );
      setStatus("error");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    setTranscript("");
    setError("");
  };

  const activeConfig = LANGUAGE_CONFIG[language];
  const showCounter = mounted && !pro;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1115] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-green-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Voice2WA</span>
            {mounted && pro && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-white px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3" /> Pro
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="relative p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="History"
            >
              <Clock className="w-5 h-5 text-zinc-500" />
              {mounted && history.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
            {mounted && !pro && (
              <button
                onClick={() => openPaywall()}
                className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl shadow-md shadow-green-500/20 hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-3.5 h-3.5" /> Upgrade
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <section className="text-center mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 sm:text-5xl">
            Speak your mind. <span className="text-green-500">Send like a pro.</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-lg mx-auto">
            Turn rough voice notes into clean, professional messages — in Hindi, Hinglish, or English. Just tap and talk.
          </p>
        </section>

        {/* Free usage counter */}
        {showCounter && (
          <div className="mb-6 flex items-center justify-center">
            <button
              onClick={() => openPaywall()}
              className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-4 py-2 hover:border-green-400 transition-colors"
            >
              <span className={cn(remaining === 0 && "text-red-500 font-bold")}>
                {remaining}/{FREE_DAILY_LIMIT}
              </span>{" "}
              free messages left today · <span className="text-green-600 font-semibold">Go unlimited →</span>
            </button>
          </div>
        )}

        {/* Language Switcher */}
        <div className="mb-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Output Language
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(Object.keys(LANGUAGE_CONFIG) as Language[]).map((lang) => {
              const cfg = LANGUAGE_CONFIG[lang];
              const isActive = language === lang;
              return (
                <motion.button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    if (status === "success") handleReset();
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 min-w-[88px]",
                    isActive
                      ? `bg-gradient-to-br ${cfg.color} text-white border-transparent shadow-lg`
                      : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                  )}
                >
                  <span className="text-xl">{cfg.flag}</span>
                  <span className={cn("text-xs font-bold", isActive ? "text-white/90" : "")}>
                    {cfg.sublabel}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={language}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-center text-xs text-zinc-400 mt-3"
            >
              {activeConfig.hint}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Tone presets */}
        <TonePicker
          value={tone}
          onChange={setTone}
          isPro={pro}
          onLockedTap={() => openPaywall("Unlock all 8 professional tones — including Property Dealer, Society Admin & Sales.")}
        />

        {/* Ad — Below controls (hidden for Pro) */}
        <AdBanner slot="1234567890" format="horizontal" className="mb-8 rounded-2xl overflow-hidden" disabled={pro} />

        {/* Recording Interface */}
        <div className="relative group">
          <div
            className={cn(
              "absolute -inset-1 bg-gradient-to-r rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000",
              activeConfig.color
            )}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl">
            <div className="flex flex-col items-center gap-8 py-6">
              {/* Visualizer */}
              <div className="flex items-end gap-1 h-12">
                {[...Array(14)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={
                      status === "recording"
                        ? { height: [8, BAR_PEAKS[i], 12, 32, 8] }
                        : { height: 8 }
                    }
                    transition={{ repeat: Infinity, duration: 0.7 + i * 0.03, delay: i * 0.04 }}
                    className={cn(
                      "w-1.5 rounded-full",
                      status === "recording" ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                  />
                ))}
              </div>

              {/* Mic Button */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {status === "recording" ? (
                    <motion.button
                      key="stop"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={stopRecording}
                      className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 relative z-10"
                    >
                      <Square className="w-8 h-8 text-white fill-white" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="start"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      disabled={status === "processing"}
                      onClick={startRecording}
                      className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl relative z-10 transition-colors",
                        status === "processing"
                          ? "bg-zinc-300 dark:bg-zinc-800"
                          : `bg-gradient-to-br ${activeConfig.color} hover:opacity-90 shadow-green-500/30`
                      )}
                    >
                      {status === "processing" ? (
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      ) : (
                        <Mic className="w-10 h-10 text-white" />
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>

                {status === "recording" && (
                  <div className="absolute -inset-4 border-2 border-red-500 rounded-full animate-ping opacity-20" />
                )}
              </div>

              {/* Status */}
              <div className="text-center space-y-2">
                <p
                  className={cn(
                    "text-2xl font-mono font-bold tracking-tighter",
                    status === "recording" ? "text-red-500" : "text-zinc-400"
                  )}
                >
                  {formatTime(recordTime)}
                </p>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
                  {status === "idle" && `Tap to record in ${activeConfig.sublabel}`}
                  {status === "recording" && `Recording in ${activeConfig.sublabel}...`}
                  {status === "processing" && "AI is thinking..."}
                  {status === "success" && "Done! ✓"}
                  {status === "error" && "Error"}
                </p>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Something went wrong</p>
                    <p className="opacity-80">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Results */}
        <div className="mt-12 space-y-8">
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {transcript && (
                  <details className="group bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 px-5 py-3 cursor-pointer">
                    <summary className="text-xs font-bold uppercase tracking-widest text-zinc-400 list-none flex items-center justify-between">
                      <span>Raw Transcript</span>
                      <span className="group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                      {transcript}
                    </p>
                  </details>
                )}

                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{activeConfig.flag}</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        {activeConfig.sublabel} Message
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(result.formattedMessage)}
                      className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      {copySuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                    </button>
                  </div>
                  <div className="p-8">
                    <p
                      className={cn(
                        "whitespace-pre-wrap leading-relaxed text-lg text-zinc-800 dark:text-zinc-200",
                        language === "hindi" ? "font-normal" : ""
                      )}
                    >
                      {result.formattedMessage}
                    </p>
                    <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                      <ShareMenu text={result.formattedMessage} />
                    </div>
                  </div>
                </div>

                {/* Poll */}
                {result.poll && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-50 dark:bg-blue-950/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 overflow-hidden"
                  >
                    <div className="p-8">
                      <div className="flex items-center gap-2 text-blue-500 mb-4">
                        <span className="text-lg">📊</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Suggested WhatsApp Poll</span>
                      </div>
                      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-5">{result.poll.question}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.poll.options.map((opt, i) => (
                          <div
                            key={i}
                            className="px-5 py-4 bg-white/80 dark:bg-blue-900/20 rounded-2xl text-sm font-semibold text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30 shadow-sm"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-blue-400 mt-5 italic">* Open WhatsApp → Attach → Poll to create this.</p>
                    </div>
                  </motion.div>
                )}

                <AdBanner slot="0987654321" format="rectangle" className="rounded-2xl overflow-hidden" disabled={pro} />

                <div className="text-center pt-4">
                  <button
                    onClick={handleReset}
                    className="text-zinc-400 hover:text-zinc-600 text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Record Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-800 text-center">
        <p className="text-zinc-400 text-sm font-medium">Built for the Modern Professional.</p>
      </footer>

      {/* Overlays */}
      <PaywallModal
        open={showPaywall}
        reason={paywallReason}
        onClose={() => setShowPaywall(false)}
      />
      <HistoryPanel
        open={showHistory}
        items={history}
        onClose={() => setShowHistory(false)}
        onChange={setHistory}
      />

      {/* Payment result toast */}
      <AnimatePresence>
        {upgradeBanner && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-[92vw]"
            style={{
              backgroundColor: upgradeBanner.type === "success" ? "#16a34a" : "#dc2626",
            }}
          >
            <span className="text-sm font-semibold text-white">{upgradeBanner.text}</span>
            <button
              onClick={() => setUpgradeBanner(null)}
              className="text-white/80 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
