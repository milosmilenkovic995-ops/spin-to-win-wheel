import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Password-protected endpoint — load Shopify codes into the pool
// Body: { password, tier, codes: string[] }
export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "db_not_configured" }, { status: 500 });

  const { password, tier, codes } = await req.json();

  if (password !== process.env.WHEEL_SEED_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const VALID_TIERS = ["10off", "20off", "freeship"];
  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  if (!Array.isArray(codes) || codes.length === 0) {
    return NextResponse.json({ error: "no_codes_provided" }, { status: 400 });
  }

  const rows = codes
    .map((c: string) => c.trim().toUpperCase())
    .filter(Boolean)
    .map((code: string) => ({ tier, code }));

  const { error, count } = await supabase
    .from("wheel_codes")
    .upsert(rows, { onConflict: "code", ignoreDuplicates: true })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: count ?? rows.length, tier });
}
