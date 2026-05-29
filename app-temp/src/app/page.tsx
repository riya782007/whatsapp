"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Copy, Share2, MessageSquare, AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import AdBanner from "@/components/AdBanner";

interface Poll {
  question: string;
  options: string[];
}

interface Result {
  formattedMessage: string;
  poll: Poll | null;
}

export default function Home() {
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "success" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordTime, setRecordTime] = useState(0);

  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (status !== "success") setRecordTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setStatus("recording");
      setError("");
    } catch (err) {
      setError("Microphone access denied. Please check your browser settings.");
      setStatus("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      setStatus("processing");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

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

      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      if (!generateRes.ok) {
        const errData = await generateRes.json();
        throw new Error(errData.error || "Formatting failed");
      }
      
      const resultData = await generateRes.json();
      setResult(resultData);
      setStatus("success");
    } catch (err: any) {
      setError(err.message.includes("quota") 
        ? "API Limit Reached: Please check your OpenAI billing/credits." 
        : err.message || "An unexpected error occurred.");
      setStatus("error");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleShare = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

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
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">AI Professional</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 sm:text-5xl">
            Speech to <span className="text-green-500">Structured</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-lg mx-auto">
            Convert your Hinglish voice notes into polished WhatsApp updates and polls in seconds.
          </p>
        </section>

        {/* Ad — Below Hero */}
        <AdBanner slot="1234567890" format="horizontal" className="mb-10 rounded-2xl overflow-hidden" />

        {/* Recording Interface */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl">
            
            <div className="flex flex-col items-center gap-8 py-6">
              {/* Visualizer Placeholder */}
              <div className="flex items-end gap-1 h-12">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={status === "recording" ? { height: [10, 40, 15, 30, 10] } : { height: 10 }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.05 }}
                    className={cn(
                      "w-1.5 rounded-full",
                      status === "recording" ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                  />
                ))}
              </div>

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
                      className="w-24 h-24 rounded-full bg-green-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 flex items-center justify-center shadow-2xl shadow-green-500/40 relative z-10 hover:bg-green-600 transition-colors"
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

              <div className="text-center space-y-2">
                <p className={cn(
                  "text-2xl font-mono font-bold tracking-tighter",
                  status === "recording" ? "text-red-500" : "text-zinc-400"
                )}>
                  {formatTime(recordTime)}
                </p>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
                  {status === "idle" && "Tap to record"}
                  {status === "recording" && "Recording..."}
                  {status === "processing" && "AI is thinking..."}
                  {status === "success" && "Success!"}
                  {status === "error" && "Error"}
                </p>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Something went wrong</p>
                    <p className="opacity-80">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Results Area */}
        <div className="mt-12 space-y-8">
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Formatted Message */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg shadow-zinc-200/50 dark:shadow-none">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Formatted Message</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCopy(result.formattedMessage)}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors relative"
                      >
                        {copySuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 leading-relaxed text-lg italic">
                      {result.formattedMessage}
                    </p>
                    <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                      <button 
                        onClick={() => handleShare(result.formattedMessage)}
                        className="w-full h-14 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-green-500/20"
                      >
                        <Share2 className="w-5 h-5" />
                        Send to WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Poll Section */}
                {result.poll && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-50 dark:bg-blue-950/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 overflow-hidden"
                  >
                    <div className="p-8">
                      <div className="flex items-center gap-2 text-blue-500 mb-6">
                        <Check className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Suggested WhatsApp Poll</span>
                      </div>
                      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-6">{result.poll.question}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.poll.options.map((opt, i) => (
                          <div key={i} className="px-5 py-4 bg-white/80 dark:bg-blue-900/20 rounded-2xl text-sm font-semibold text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30 shadow-sm">
                            {opt}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-blue-400 mt-6 italic">
                        * Open WhatsApp → Attach → Poll to create this.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Ad — Below Results */}
                <AdBanner slot="0987654321" format="rectangle" className="rounded-2xl overflow-hidden" />

                {/* Record Again */}
                <div className="text-center pt-8">
                  <button 
                    onClick={() => setStatus("idle")}
                    className="text-zinc-400 hover:text-zinc-600 text-sm font-medium flex items-center gap-2 mx-auto"
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
    </div>
  );
}
