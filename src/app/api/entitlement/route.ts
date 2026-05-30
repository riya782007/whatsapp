import { NextRequest, NextResponse } from "next/server";
import { getEntitlement, supabaseConfigured } from "@/lib/supabase";
import { errorMessage } from "@/lib/utils";

// Returns the server source-of-truth entitlement for a user id.
// Called on app load so a paid user is recognised even after the
// payment redirect (and on any device that carries the same user id).
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "";
    if (!supabaseConfigured()) {
      return NextResponse.json({ configured: false, tier: "free", active: false });
    }
    if (!userId) {
      return NextResponse.json({ configured: true, tier: "free", active: false });
    }
    const ent = await getEntitlement(userId);
    return NextResponse.json({ configured: true, ...ent });
  } catch (error: unknown) {
    console.error("Entitlement error:", error);
    return NextResponse.json(
      { configured: true, tier: "free", active: false, error: errorMessage(error) },
      { status: 500 }
    );
  }
}
