import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const adminPass = process.env.ADMIN_PASSWORD || "";
  if (!adminPass || cookieStore.get("znf_admin")?.value !== adminPass) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!supabase) {
    return new Response("Database not configured", { status: 500 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error || !data) {
    return new Response(error?.message || "No data", { status: 500 });
  }

  const headers = [
    "submitted_at", "path_id", "path_name", "submitted_via",
    "email", "klaviyo_id", "coupon_code", "discount_label",
    "sorting_answer_id", "sorting_answer_label", "sorting_free_text",
    "answers", "user_agent", "referrer", "ip_address",
  ];

  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = typeof val === "string" ? val : JSON.stringify(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = data.map((s: Record<string, unknown>) =>
    headers.map((h) => escape(s[h])).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  const filename = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
