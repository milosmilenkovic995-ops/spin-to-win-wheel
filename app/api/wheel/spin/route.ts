import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TIERS = ["10off", "20off", "freeship"] as const;

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "db_not_configured" }, { status: 500 });

  const { uid } = await req.json();
  if (!uid?.trim()) return NextResponse.json({ error: "missing_uid" }, { status: 400 });

  // Server picks the tier — client cannot manipulate the prize
  const tier = TIERS[Math.floor(Math.random() * TIERS.length)];

  const { data, error } = await supabase.rpc("assign_wheel_code", {
    p_uid: uid.trim(),
    p_tier: tier,
  });

  if (error) return NextResponse.json({ error: "rpc_error" }, { status: 500 });

  if (data?.error === "already_spun") {
    // Return their existing result
    const { data: spin } = await supabase
      .from("wheel_spins")
      .select("tier, code")
      .eq("uid", uid.trim())
      .maybeSingle();
    return NextResponse.json({ already_spun: true, tier: spin?.tier, code: spin?.code });
  }

  if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });

  return NextResponse.json({ tier: data.tier, code: data.code });
}
