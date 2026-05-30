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

// Real publisher ID comes from env (set in Vercel). When it's missing we
// render nothing so there are no broken/placeholder ad slots in production.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
  disabled = false,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (disabled || !ADSENSE_CLIENT || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.warn("AdSense push failed:", e);
    }
  }, [disabled]);

  // No ads for Pro users or when AdSense isn't configured yet.
  if (disabled || !ADSENSE_CLIENT) return null;

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
