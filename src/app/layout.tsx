import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoicePro - Speak. Format. Share Anywhere.",
  description:
    "Convert your casual voice notes into professional, structured messages for WhatsApp, Telegram & more. Powered by AI. Works in Hindi, Hinglish, and English.",
  keywords: [
    "WhatsApp message formatter",
    "Hinglish voice to text",
    "AI WhatsApp tool",
    "voice to WhatsApp",
    "professional WhatsApp message",
    "India AI messaging",
    "Telegram message formatter",
    "voice note to text",
  ],
  openGraph: {
    title: "VoicePro - Speak. Format. Share Anywhere.",
    description:
      "Record a casual voice note, get a perfectly formatted message for WhatsApp, Telegram & more. Powered by Whisper + Llama AI.",
    type: "website",
    locale: "en_IN",
    siteName: "VoicePro",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoicePro - AI Message Formatter",
    description:
      "Convert voice notes into polished messages for WhatsApp, Telegram & more. Hindi, Hinglish, English supported.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
