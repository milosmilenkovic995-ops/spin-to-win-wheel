import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headers = req.headers;

    const submission = {
      email: body.email || null,
      klaviyo_id: body.klid || null,
      path_id: body.path || "unknown",
      path_name: body.pathName || null,
      submitted_via: body.submittedVia || null,
      coupon_code: body.coupon || null,
      discount_label: body.discount || null,
      sorting_answer_id: body.sorting?.answerId || null,
      sorting_answer_label: body.sorting?.answerLabel || null,
      sorting_free_text: body.sorting?.freeText || null,
      answers: body.answers || [],
      submitted_at: body.submittedAt || new Date().toISOString(),
      user_agent: headers.get("user-agent") || null,
      referrer: headers.get("referer") || null,
      ip_address:
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        null,
    };

    if (supabase) {
      const { error } = await supabase.from("submissions").insert(submission);
      if (error) console.error("Supabase insert error:", error);
    } else {
      console.log("Supabase not configured. Submission body:", JSON.stringify(submission).slice(0, 500));
    }

    const klaviyoKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const klaviyoList = process.env.KLAVIYO_LIST_ID;
    if (body.email && body.submittedVia === "email" && klaviyoKey && klaviyoList) {
      try {
        await fetch(
          "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
          {
            method: "POST",
            headers: {
              Authorization: `Klaviyo-API-Key ${klaviyoKey}`,
              accept: "application/json",
              "Content-Type": "application/json",
              revision: "2026-01-15",
            },
            body: JSON.stringify({
              data: {
                type: "profile-subscription-bulk-create-job",
                attributes: {
                  profiles: {
                    data: [
                      {
                        type: "profile",
                        attributes: {
                          email: body.email,
                          subscriptions: {
                            email: { marketing: { consent: "SUBSCRIBED" } },
                          },
                        },
                      },
                    ],
                  },
                },
                relationships: {
                  list: { data: { type: "list", id: klaviyoList } },
                },
              },
            }),
          }
        );
      } catch (err) {
        console.warn("Klaviyo subscribe error (non-blocking):", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe API error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
