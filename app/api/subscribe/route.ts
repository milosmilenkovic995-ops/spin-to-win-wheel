import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, firstName } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const listId = process.env.KLAVIYO_LIST_ID;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing KLAVIYO_PRIVATE_API_KEY." },
        { status: 500 }
      );
    }

    if (!listId) {
      return NextResponse.json(
        { success: false, error: "Missing KLAVIYO_LIST_ID." },
        { status: 500 }
      );
    }

    const subscribePayload = {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: "SUBSCRIBED",
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: {
            data: {
              type: "list",
              id: listId,
            },
          },
        },
      },
    };

    const subscribeRes = await fetch(
      "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
      {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          accept: "application/json",
          "Content-Type": "application/json",
          revision: "2026-01-15",
        },
        body: JSON.stringify(subscribePayload),
      }
    );

    const subscribeText = await subscribeRes.text();

    if (!subscribeRes.ok) {
      console.error("Klaviyo subscribe error:", subscribeText);
      return NextResponse.json(
        {
          success: false,
          error: "Subscribe failed",
          details: subscribeText,
        },
        { status: subscribeRes.status }
      );
    }

    if (firstName && typeof firstName === "string" && firstName.trim()) {
      const profilePayload = {
        data: {
          type: "profile-bulk-import-job",
          attributes: {
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email,
                    first_name: firstName.trim(),
                  },
                },
              ],
            },
          },
        },
      };

      const profileRes = await fetch(
        "https://a.klaviyo.com/api/profile-bulk-import-jobs/",
        {
          method: "POST",
          headers: {
            Authorization: `Klaviyo-API-Key ${apiKey}`,
            accept: "application/json",
            "Content-Type": "application/json",
            revision: "2026-01-15",
          },
          body: JSON.stringify(profilePayload),
        }
      );

      const profileText = await profileRes.text();

      if (!profileRes.ok) {
        console.error("Klaviyo profile import error:", profileText);
        return NextResponse.json(
          {
            success: false,
            error: "Profile update failed",
            details: profileText,
          },
          { status: profileRes.status }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}