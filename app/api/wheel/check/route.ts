import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid")?.trim();
  if (!uid) return NextResponse.json({ spun: false });
  if (!supabase) return NextResponse.json({ error: "db_not_configured" }, { status: 500 });

  const { data } = await supabase
    .from("wheel_spins")
    .select("tier, code")
    .eq("uid", uid)
    .maybeSingle();

  if (!data) return NextResponse.json({ spun: false });
  return NextResponse.json({ spun: true, tier: data.tier, code: data.code });
}
