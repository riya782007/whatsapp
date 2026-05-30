"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  /** Hide ads entirely (e.g. for Pro users). */
  disabled?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Publisher ID. The default is the live account ID; set
// NEXT_PUBLIC_ADSENSE_CLIENT in Vercel to override (e.g. per-environment).
// Note: the publisher ID is public by design (it ships in page HTML).
const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-8484576096599533";

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
  disabled = false,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const active = !disabled && !!ADSENSE_CLIENT && !!slot;

  useEffect(() => {
    if (!active || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.warn("AdSense push failed:", e);
    }
  }, [active]);

  // Render nothing for Pro users, when AdSense isn't configured, or when no
  // ad-unit slot id is provided yet (Auto Ads from the head script still work).
  if (!active) return null;

  return (
    <div className={`overflow-hidden text-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
