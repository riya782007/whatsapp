import { NextResponse } from "next/server";

// Diagnostic endpoint — visit /api/health on your deployment to confirm
// which environment variables are configured. It returns ONLY booleans
// (never the secret values), so it's safe to expose.
export async function GET() {
  const present = (v?: string) => Boolean(v && v.trim());

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    ai: {
      groq: present(process.env.GROQ_API_KEY),
      openai: present(process.env.OPENAI_API_KEY),
    },
    razorpay: {
      keyId: present(process.env.RAZORPAY_KEY_ID),
      keySecret: present(process.env.RAZORPAY_KEY_SECRET),
      webhookSecret: present(process.env.RAZORPAY_WEBHOOK_SECRET),
    },
    supabase: {
      url: present(process.env.SUPABASE_URL) || present(process.env.NEXT_PUBLIC_SUPABASE_URL),
      serviceKey:
        present(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
        present(process.env.SUPABASE_SERVICE_KEY),
    },
    site: {
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      appUrl: process.env.APP_URL || null,
      adsenseClient: present(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
    },
  });
}
