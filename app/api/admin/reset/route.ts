import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminPass = process.env.ADMIN_PASSWORD || "";
  if (!adminPass || cookieStore.get("znf_admin")?.value !== adminPass) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (!supabase) {
    return NextResponse.redirect(new URL("/admin?reset=error", req.url));
  }

  // Delete everything from both tables. The .not("id", "is", null) clause is a
  // tautology that matches every row (Supabase requires a filter to delete).
  const r1 = await supabase.from("events").delete().not("id", "is", null);
  const r2 = await supabase.from("submissions").delete().not("id", "is", null);

  if (r1.error || r2.error) {
    console.error("Reset error:", r1.error || r2.error);
    return NextResponse.redirect(new URL("/admin?reset=error", req.url));
  }

  return NextResponse.redirect(new URL("/admin?reset=ok", req.url));
}
