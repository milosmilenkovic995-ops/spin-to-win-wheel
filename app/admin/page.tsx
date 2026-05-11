import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type AnswerEntry = {
  questionId: string;
  questionTitle: string;
  answerId: string;
  answerLabel: string;
  freeText: string | null;
};

type SubmissionRow = {
  id: string;
  submitted_at: string;
  email: string | null;
  klaviyo_id: string | null;
  path_id: string;
  path_name: string | null;
  submitted_via: string | null;
  coupon_code: string | null;
  discount_label: string | null;
  sorting_answer_id: string | null;
  sorting_answer_label: string | null;
  sorting_free_text: string | null;
  answers: unknown;
  user_agent: string | null;
  referrer: string | null;
};

type FlowQuestion = {
  id: string;
  title: string;
  kind: "sorting" | "path" | "email_choice";
};

type PathFlow = {
  pathId: string;
  pathName: string;
  questions: FlowQuestion[];
};

const SORTING_TITLE = "What best describes your current experience with us?";
const EMAIL_TITLE = "Did the customer share their email at the end?";

const FLOWS: PathFlow[] = [
  {
    pathId: "path1",
    pathName: "Recent buyers (bought from us recently)",
    questions: [
      { id: "sorting", title: SORTING_TITLE, kind: "sorting" },
      { id: "p1_q1", title: "What was the main reason you decided to buy from us?", kind: "path" },
      { id: "p1_q2", title: "Was there anything that made you hesitate before buying?", kind: "path" },
      { id: "p1_q3", title: "What would make you buy from us more often?", kind: "path" },
      { id: "p1_q4", title: "What could we improve about your shopping experience?", kind: "path" },
      { id: "email_step", title: EMAIL_TITLE, kind: "email_choice" },
    ],
  },
  {
    pathId: "path2",
    pathName: "Past buyers (bought before, not recently)",
    questions: [
      { id: "sorting", title: SORTING_TITLE, kind: "sorting" },
      { id: "p2_q1", title: "Why have you not ordered from us recently?", kind: "path" },
      { id: "p2_q2", title: "Are you currently buying similar products somewhere else?", kind: "path" },
      { id: "p2_q3", title: "What would make you come back and order again?", kind: "path" },
      { id: "p2_q4", title: "Was there anything from your previous experience that could have been better?", kind: "path" },
      { id: "email_step", title: EMAIL_TITLE, kind: "email_choice" },
    ],
  },
  {
    pathId: "path3",
    pathName: "Website visitors (did not buy)",
    questions: [
      { id: "sorting", title: SORTING_TITLE, kind: "sorting" },
      { id: "p3_q1", title: "What was the main reason you did not place an order?", kind: "path" },
      { id: "p3_q2", title: "Was anything confusing on the website?", kind: "path" },
      { id: "p3_q3", title: "What information was missing before you could feel ready to buy?", kind: "path" },
      { id: "p3_q4", title: "What would have made you more likely to complete your purchase?", kind: "path" },
      { id: "email_step", title: EMAIL_TITLE, kind: "email_choice" },
    ],
  },
  {
    pathId: "path4",
    pathName: "Cart abandoners (added to cart, did not checkout)",
    questions: [
      { id: "sorting", title: SORTING_TITLE, kind: "sorting" },
      { id: "p4_q1", title: "What made you leave before completing checkout?", kind: "path" },
      { id: "p4_q2", title: "Did anything surprise you in the cart or checkout?", kind: "path" },
      { id: "p4_q3", title: "What would have made you complete the order?", kind: "path" },
      { id: "email_step", title: EMAIL_TITLE, kind: "email_choice" },
    ],
  },
  {
    pathId: "path5",
    pathName: "Competitor buyers (buy similar from another store)",
    questions: [
      { id: "sorting", title: SORTING_TITLE, kind: "sorting" },
      { id: "p5_q1", title: "Where do you usually buy similar products?", kind: "path" },
      { id: "p5_q2", title: "Why do you choose that store?", kind: "path" },
      { id: "p5_q3", title: "What does that store do better than us?", kind: "path" },
      { id: "p5_q4", title: "What would make you choose us instead?", kind: "path" },
      { id: "email_step", title: EMAIL_TITLE, kind: "email_choice" },
    ],
  },
  {
    pathId: "path6",
    pathName: "Other feedback",
    questions: [
      { id: "sorting", title: SORTING_TITLE, kind: "sorting" },
      { id: "p6_q1", title: "What best describes your situation?", kind: "path" },
      { id: "p6_q2", title: "What could we improve for you?", kind: "path" },
      { id: "p6_q3", title: "Is there anything else you want to share?", kind: "path" },
      { id: "email_step", title: EMAIL_TITLE, kind: "email_choice" },
    ],
  },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const adminPass = process.env.ADMIN_PASSWORD || "";
  const authed =
    !!adminPass && cookieStore.get("znf_admin")?.value === adminPass;

  if (!adminPass) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold">Admin dashboard not configured</h1>
        <p className="mt-2 text-gray-600">
          Set <code className="rounded bg-gray-100 px-1">ADMIN_PASSWORD</code> in
          your Vercel project environment variables, then redeploy.
        </p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
            Survey Admin
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            Enter the admin password to continue.
          </p>
          {params.error === "invalid" && (
            <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              Wrong password. Try again.
            </div>
          )}
          <form method="POST" action="/api/admin/login" className="space-y-3">
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
              autoFocus
              required
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800"
            >
              Log in
            </button>
          </form>
        </div>
      </main>
    );
  }

  let submissions: SubmissionRow[] = [];
  let dbError: string | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(2000);
    if (error) dbError = error.message;
    else if (data) submissions = data as SubmissionRow[];
  } else {
    dbError = "Supabase is not configured.";
  }

  const total = submissions.length;
  const withEmail = submissions.filter((s) => s.email).length;
  const emailRate = total > 0 ? Math.round((withEmail / total) * 100) : 0;
  const skipped = total - withEmail;
  const skippedRate = total > 0 ? 100 - emailRate : 0;

  // Aggregate per question for one flow
  function buildQStat(
    flow: PathFlow,
    q: FlowQuestion,
    subs: SubmissionRow[]
  ): {
    total: number;
    rows: Array<{ label: string; count: number }>;
    freeTexts: string[];
  } {
    const rowsMap = new Map<string, number>();
    const freeTexts: string[] = [];
    let totalForQ = 0;

    for (const s of subs) {
      if (q.kind === "sorting") {
        if (s.sorting_answer_id) {
          totalForQ++;
          const label = s.sorting_answer_label || s.sorting_answer_id;
          rowsMap.set(label, (rowsMap.get(label) || 0) + 1);
          if (s.sorting_free_text && s.sorting_free_text.trim()) {
            freeTexts.push(s.sorting_free_text.trim());
          }
        }
      } else if (q.kind === "email_choice") {
        if (s.submitted_via) {
          totalForQ++;
          const label =
            s.submitted_via === "email"
              ? "Gave email — got 30% OFF"
              : "Skipped — got 20% OFF";
          rowsMap.set(label, (rowsMap.get(label) || 0) + 1);
        }
      } else {
        if (Array.isArray(s.answers)) {
          const match = (s.answers as AnswerEntry[]).find(
            (a) => a?.questionId === q.id
          );
          if (match) {
            totalForQ++;
            const label = match.answerLabel || match.answerId;
            rowsMap.set(label, (rowsMap.get(label) || 0) + 1);
            if (match.freeText && String(match.freeText).trim()) {
              freeTexts.push(String(match.freeText).trim());
            }
          }
        }
      }
    }

    const rows = Array.from(rowsMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    return { total: totalForQ, rows, freeTexts };
  }

  // Per-path submission counts for header
  const subsByPath: Record<string, SubmissionRow[]> = {};
  for (const s of submissions) {
    const key = s.path_id || "unknown";
    if (!subsByPath[key]) subsByPath[key] = [];
    subsByPath[key].push(s);
  }

  // Coupon distribution
  const fb30 = submissions.filter((s) => s.coupon_code === "FEEDBACK30");
  const fb20 = submissions.filter((s) => s.coupon_code === "FEEDBACK20");
  const fb30Pct = total > 0 ? Math.round((fb30.length / total) * 100) : 0;
  const fb20Pct = total > 0 ? Math.round((fb20.length / total) * 100) : 0;
  const recent = submissions.slice(0, 30);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Survey Dashboard</h1>
          <p className="text-sm text-gray-500">Live data from your customer feedback survey.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/admin/export"
            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800"
          >
            Download CSV
          </a>
          <form method="POST" action="/api/admin/logout">
            <button
              type="submit"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400"
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      {dbError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {dbError}
        </div>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total submissions" value={total} />
        <SummaryCard
          label="Got 30% OFF (gave email)"
          value={withEmail}
          sub={`${emailRate}% of all submissions`}
          highlight
        />
        <SummaryCard
          label="Got 20% OFF (skipped)"
          value={skipped}
          sub={`${skippedRate}% of all submissions`}
        />
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No submissions yet — breakdowns appear here as data comes in.
        </div>
      ) : (
        <>
          {FLOWS.map((flow) => {
            const subs = subsByPath[flow.pathId] || [];
            if (subs.length === 0) return null;
            const totalQ = flow.questions.length;
            return (
              <section key={flow.pathId} className="mb-10">
                <div className="mb-3 border-l-4 border-green-700 pl-4">
                  <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                    {flow.pathName}
                  </h2>
                  <div className="mt-1 text-sm text-gray-500">
                    {subs.length} submission{subs.length === 1 ? "" : "s"} in this segment
                  </div>
                </div>

                <div className="space-y-4">
                  {flow.questions.map((q, qi) => {
                    const stat = buildQStat(flow, q, subs);
                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
                      >
                        <div className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-green-700">
                          Question {qi + 1} OF {totalQ}
                        </div>
                        <h3 className="mb-4 text-lg font-extrabold text-slate-900 md:text-xl">
                          {q.title}
                        </h3>
                        {stat.rows.length === 0 ? (
                          <div className="text-sm text-gray-500">
                            No responses for this question yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {stat.rows.map((r) => {
                              const pct =
                                stat.total > 0
                                  ? Math.round((r.count / stat.total) * 100)
                                  : 0;
                              return (
                                <Bar
                                  key={r.label}
                                  label={r.label}
                                  count={r.count}
                                  pct={pct}
                                />
                              );
                            })}
                          </div>
                        )}
                        {stat.freeTexts.length > 0 && (
                          <div className="mt-5 rounded-xl bg-gray-50 p-4">
                            <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                              Written comments ({stat.freeTexts.length})
                            </div>
                            <ul className="space-y-2">
                              {stat.freeTexts.map((t, i) => (
                                <li
                                  key={i}
                                  className="border-l-2 border-green-600 pl-3 text-sm italic text-slate-700"
                                >
                                  &ldquo;{t}&rdquo;
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Coupon blocks */}
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-extrabold text-slate-900">
              Coupons issued
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <CouponCard
                code="FEEDBACK30"
                label="30% OFF — given to customers who shared their email"
                count={fb30.length}
                pct={fb30Pct}
                emails={fb30.map((s) => s.email).filter((e): e is string => !!e)}
              />
              <CouponCard
                code="FEEDBACK20"
                label="20% OFF — given to customers who skipped email"
                count={fb20.length}
                pct={fb20Pct}
              />
            </div>
          </section>
        </>
      )}

      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4 text-lg font-bold text-slate-900">
          Recent submissions
        </div>
        {recent.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No data yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Segment</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Choice</th>
                  <th className="px-4 py-3">Coupon</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => {
                  const flow = FLOWS.find((f) => f.pathId === s.path_id);
                  return (
                    <tr key={s.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(s.submitted_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {flow?.pathName || s.path_id}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.email || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {s.submitted_via === "email"
                          ? "Gave email → 30%"
                          : s.submitted_via === "skip"
                          ? "Skipped → 20%"
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.coupon_code || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        highlight ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`text-xs uppercase tracking-wider ${
          highlight ? "text-green-700" : "text-gray-500"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-4xl font-extrabold ${
          highlight ? "text-green-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className={`mt-1 text-xs ${highlight ? "text-green-800" : "text-gray-500"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Bar({
  label,
  count,
  pct,
}: {
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-64 shrink-0 text-sm font-medium text-slate-800">
        {label}
      </div>
      <div className="h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-green-600"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-24 shrink-0 text-right text-sm tabular-nums text-slate-700">
        <span className="font-bold">({count})</span> {pct}%
      </div>
    </div>
  );
}

function CouponCard({
  code,
  label,
  count,
  pct,
  emails,
}: {
  code: string;
  label: string;
  count: number;
  pct: number;
  emails?: string[];
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-green-700 bg-green-50 p-6">
      <div className="text-xs font-extrabold uppercase tracking-wider text-green-700">
        Coupon
      </div>
      <div className="my-1 text-3xl font-extrabold tracking-wider text-slate-900">
        {code}
      </div>
      <div className="mb-4 text-sm text-slate-700">{label}</div>
      <div className="rounded-xl bg-white p-3 text-center">
        <div className="text-3xl font-extrabold text-green-700">
          ({count}) {pct}%
        </div>
        <div className="text-xs text-gray-500">
          {count === 1 ? "customer" : "customers"} received this code
        </div>
      </div>
      {emails && emails.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-green-700 hover:underline">
            Show emails ({emails.length})
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {emails.map((e, i) => (
              <li key={i} className="font-mono">{e}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
