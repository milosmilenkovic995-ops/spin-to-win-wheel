import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import ResetButton from "./ResetButton";

export const dynamic = "force-dynamic";

type AnswerEntry = {
  questionId: string;
  questionTitle: string;
  questionType?: "multi" | "single" | "text";
  answerId?: string;
  answerLabel?: string;
  answerIds?: string[];
  answerLabels?: string[];
  freeText?: string | null;
};

type SubmissionRow = {
  id: string;
  submitted_at: string;
  email: string | null;
  klaviyo_id: string | null;
  path_id: string;
  submitted_via: string | null;
  coupon_code: string | null;
  discount_label: string | null;
  answers: unknown;
};

type QStat = {
  questionId: string;
  questionTitle: string;
  type: "multi" | "single" | "text";
  total: number;
  options: Map<string, { label: string; count: number }>;
  freeTexts: string[];
  textAnswers: string[];
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const adminPass = process.env.ADMIN_PASSWORD || "";
  const authed = !!adminPass && cookieStore.get("znf_admin")?.value === adminPass;

  if (!adminPass) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-bold">Admin dashboard not configured</h1>
        <p className="mt-2 text-gray-600">
          Set <code className="rounded bg-gray-100 px-1">ADMIN_PASSWORD</code> in Vercel env vars.
        </p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Survey Admin</h1>
          <p className="mb-6 text-center text-sm text-gray-500">Enter the admin password to continue.</p>
          {params.error === "invalid" && (
            <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">Wrong password.</div>
          )}
          <form method="POST" action="/api/admin/login" className="space-y-3">
            <input type="password" name="password" placeholder="Password" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600" autoFocus required />
            <button type="submit" className="w-full rounded-xl bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800">Log in</button>
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
      .limit(5000);
    if (error) dbError = error.message;
    else if (data) submissions = data as SubmissionRow[];
  } else {
    dbError = "Supabase not configured.";
  }

  // Filter to only new survey submissions (path_id = main_v2 or whatever current is)
  // Keep all for now; new submissions all have path="main_v2"
  const total = submissions.length;
  const withEmail = submissions.filter((s) => s.email).length;
  const withoutEmail = total - withEmail;
  const emailRate = total > 0 ? Math.round((withEmail / total) * 100) : 0;

  // Aggregate per question
  const qstats = new Map<string, QStat>();
  const ensure = (id: string, title: string, type: "multi" | "single" | "text"): QStat => {
    let q = qstats.get(id);
    if (!q) {
      q = { questionId: id, questionTitle: title, type, total: 0, options: new Map(), freeTexts: [], textAnswers: [] };
      qstats.set(id, q);
    }
    return q;
  };

  for (const s of submissions) {
    if (!Array.isArray(s.answers)) continue;
    for (const a of s.answers as AnswerEntry[]) {
      if (!a?.questionId) continue;
      const type = a.questionType || (a.answerIds && a.answerIds.length > 0 ? "multi" : "single");
      const q = ensure(a.questionId, a.questionTitle || a.questionId, type);
      q.total++;

      if (type === "text") {
        if (a.freeText && String(a.freeText).trim()) {
          q.textAnswers.push(String(a.freeText).trim());
        }
        continue;
      }

      // multi or single: extract array of selected ids/labels
      let ids: string[] = [];
      let labels: string[] = [];
      if (a.answerIds && a.answerIds.length > 0) {
        ids = a.answerIds;
        labels = a.answerLabels || ids;
      } else if (a.answerId) {
        ids = [a.answerId];
        labels = [a.answerLabel || a.answerId];
      }
      ids.forEach((id, i) => {
        let entry = q.options.get(id);
        if (!entry) {
          entry = { label: labels[i] || id, count: 0 };
          q.options.set(id, entry);
        }
        entry.count++;
      });

      if (a.freeText && String(a.freeText).trim()) {
        q.freeTexts.push(String(a.freeText).trim());
      }
    }
  }

  // Sort questions by id (q1..q7)
  const orderedQs = Array.from(qstats.values()).sort((a, b) =>
    a.questionId.localeCompare(b.questionId, undefined, { numeric: true })
  );

  // Coupon distribution
  const fb20 = submissions.filter((s) => s.coupon_code === "FEEDBACK20").length;
  const fb20Pct = total > 0 ? Math.round((fb20 / total) * 100) : 0;

  const recent = submissions.slice(0, 30);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Survey Dashboard</h1>
          <p className="text-sm text-gray-500">Live data from your customer feedback survey.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export" className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800">Download CSV</a>
          <ResetButton />
          <form method="POST" action="/api/admin/logout">
            <button type="submit" className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400">Log out</button>
          </form>
        </div>
      </div>

      {params.reset === "ok" && (<div className="mb-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">✅ Database reset — all submissions deleted.</div>)}
      {params.reset === "error" && (<div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">⚠ Reset failed. Check Vercel logs.</div>)}
      {dbError && (<div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{dbError}</div>)}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total submissions" value={total} />
        <SummaryCard label="With email" value={withEmail} sub={`${emailRate}% of submissions`} highlight />
        <SummaryCard label="Without email" value={withoutEmail} />
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No submissions yet — breakdowns appear here as data comes in.
        </div>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-extrabold text-slate-900">Question-by-question breakdown</h2>
            <p className="mb-6 text-sm text-gray-500">
              Multi-select questions can sum to over 100% because each respondent can pick multiple options.
            </p>
            <div className="space-y-5">
              {orderedQs.map((q, qi) => {
                const sortedOpts = Array.from(q.options.values()).sort((a, b) => b.count - a.count);
                const typeLabel = q.type === "multi" ? "Select all that apply" : q.type === "single" ? "Pick one" : "Open text";
                return (
                  <div key={q.questionId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-green-700">
                      Question {qi + 1} OF {orderedQs.length} · {typeLabel} · {q.total} response{q.total === 1 ? "" : "s"}
                    </div>
                    <h3 className="mb-4 text-lg font-extrabold text-slate-900 md:text-xl">{q.questionTitle}</h3>

                    {q.type === "text" ? (
                      q.textAnswers.length === 0 ? (
                        <div className="text-sm text-gray-500">No written answers yet.</div>
                      ) : (
                        <ul className="space-y-2">
                          {q.textAnswers.map((t, i) => (
                            <li key={i} className="border-l-2 border-green-600 pl-3 text-sm italic text-slate-700">&ldquo;{t}&rdquo;</li>
                          ))}
                        </ul>
                      )
                    ) : sortedOpts.length === 0 ? (
                      <div className="text-sm text-gray-500">No responses yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {sortedOpts.map((o, oi) => {
                          const pct = q.total > 0 ? Math.round((o.count / q.total) * 100) : 0;
                          return <Bar key={oi} label={o.label} count={o.count} pct={pct} />;
                        })}
                      </div>
                    )}

                    {q.type !== "text" && q.freeTexts.length > 0 && (
                      <div className="mt-5 rounded-xl bg-gray-50 p-4">
                        <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-gray-500">Written comments ({q.freeTexts.length})</div>
                        <ul className="space-y-2">
                          {q.freeTexts.map((t, i) => (
                            <li key={i} className="border-l-2 border-green-600 pl-3 text-sm italic text-slate-700">&ldquo;{t}&rdquo;</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-extrabold text-slate-900">Coupon issued</h2>
            <div className="rounded-2xl border-2 border-dashed border-green-700 bg-green-50 p-6">
              <div className="text-xs font-extrabold uppercase tracking-wider text-green-700">Coupon</div>
              <div className="my-1 text-3xl font-extrabold tracking-wider text-slate-900">FEEDBACK20</div>
              <div className="mb-4 text-sm text-slate-700">20% OFF — given to every customer who completed the survey</div>
              <div className="rounded-xl bg-white p-3 text-center">
                <div className="text-3xl font-extrabold text-green-700">({fb20}) {fb20Pct}%</div>
                <div className="text-xs text-gray-500">{fb20 === 1 ? "customer" : "customers"} received this code</div>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4 text-lg font-bold text-slate-900">Recent submissions</div>
        {recent.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No data yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-600">
                <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Coupon</th></tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-600">{new Date(s.submitted_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.coupon_code || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value, sub, highlight }: { label: string; value: number; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${highlight ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
      <div className={`text-xs uppercase tracking-wider ${highlight ? "text-green-700" : "text-gray-500"}`}>{label}</div>
      <div className={`mt-1 text-4xl font-extrabold ${highlight ? "text-green-700" : "text-slate-900"}`}>{value}</div>
      {sub && <div className={`mt-1 text-xs ${highlight ? "text-green-800" : "text-gray-500"}`}>{sub}</div>}
    </div>
  );
}

function Bar({ label, count, pct }: { label: string; count: number; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-64 shrink-0 text-sm font-medium text-slate-800">{label}</div>
      <div className="h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 shrink-0 text-right text-sm tabular-nums text-slate-700"><span className="font-bold">({count})</span> {pct}%</div>
    </div>
  );
}
