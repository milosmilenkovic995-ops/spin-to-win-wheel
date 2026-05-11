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

type QStat = {
  questionId: string;
  questionTitle: string;
  total: number;
  answers: Map<string, { answerId: string; answerLabel: string; count: number }>;
};

const pathLabel: Record<string, string> = {
  sorting: "Page 1 — Sorting question",
  path1: "Recent buyers (bought from us recently)",
  path2: "Past buyers (bought before, not recently)",
  path3: "Website visitors (did not buy)",
  path4: "Cart abandoners (added to cart, did not checkout)",
  path5: "Competitor buyers (buy similar from another store)",
  path6: "Other feedback",
};

function pathOf(qid: string): string {
  if (qid === "sorting") return "sorting";
  const m = qid.match(/^p(\d+)_/);
  return m ? `path${m[1]}` : "other";
}

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
    if (error) {
      dbError = error.message;
    } else if (data) {
      submissions = data as SubmissionRow[];
    }
  } else {
    dbError =
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Vercel env vars.";
  }

  const total = submissions.length;
  const withEmail = submissions.filter((s) => s.email).length;
  const emailRate = total > 0 ? Math.round((withEmail / total) * 100) : 0;
  const skipped = total - withEmail;

  // ------- Aggregate per-question answer counts -------
  const qstats = new Map<string, QStat>();
  const ensure = (id: string, title: string): QStat => {
    let q = qstats.get(id);
    if (!q) {
      q = { questionId: id, questionTitle: title, total: 0, answers: new Map() };
      qstats.set(id, q);
    }
    return q;
  };
  const bumpAnswer = (q: QStat, aid: string, alabel: string) => {
    q.total++;
    let entry = q.answers.get(aid);
    if (!entry) {
      entry = { answerId: aid, answerLabel: alabel || aid, count: 0 };
      q.answers.set(aid, entry);
    }
    entry.count++;
  };

  for (const s of submissions) {
    if (s.sorting_answer_id) {
      const q = ensure(
        "sorting",
        "What best describes your current experience with us?"
      );
      bumpAnswer(q, s.sorting_answer_id, s.sorting_answer_label || "");
    }
    if (Array.isArray(s.answers)) {
      for (const a of s.answers as AnswerEntry[]) {
        if (!a?.questionId || !a?.answerId) continue;
        const q = ensure(a.questionId, a.questionTitle || a.questionId);
        bumpAnswer(q, a.answerId, a.answerLabel || "");
      }
    }
  }

  // Group questions by path
  const grouped = new Map<string, QStat[]>();
  for (const q of qstats.values()) {
    const p = pathOf(q.questionId);
    if (!grouped.has(p)) grouped.set(p, []);
    grouped.get(p)!.push(q);
  }
  // Sort questions inside each path by their id ascending
  for (const arr of grouped.values()) arr.sort((a, b) => a.questionId.localeCompare(b.questionId));

  const pathOrder = ["sorting", "path1", "path2", "path3", "path4", "path5", "path6"];

  // ------- By-path summary (% of total submissions taking each path) -------
  const byPath = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.path_id || "unknown"] = (acc[s.path_id || "unknown"] || 0) + 1;
    return acc;
  }, {});

  const recent = submissions.slice(0, 30);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Survey Dashboard</h1>
          <p className="text-sm text-gray-500">
            Live data from your customer feedback survey.
          </p>
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

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total submissions" value={total} />
        <SummaryCard
          label="Email captured (30%)"
          value={withEmail}
          sub={`${emailRate}% capture rate`}
          highlight
        />
        <SummaryCard label="Skipped email (20%)" value={skipped} />
      </div>

      {/* Submissions by path */}
      <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Submissions by path</h2>
        {total === 0 ? (
          <div className="text-sm text-gray-500">No submissions yet.</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(byPath)
              .sort((a, b) => b[1] - a[1])
              .map(([pid, count]) => {
                const pct = Math.round((count / total) * 100);
                const label = pathLabel[pid] || pid;
                return <Bar key={pid} label={label} count={count} pct={pct} />;
              })}
          </div>
        )}
      </section>

      {/* Per-question breakdowns */}
      <section className="mb-10">
        <h2 className="mb-2 text-2xl font-extrabold text-slate-900">
          Answer breakdowns by question
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          For every question, all answer options ranked by popularity, with raw
          count and percentage of people who reached that question.
        </p>
        {total === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            No submissions yet — answer breakdowns will appear here as customers
            complete the survey.
          </div>
        ) : (
          <div className="space-y-8">
            {pathOrder.map((p) => {
              const qs = grouped.get(p) || [];
              if (qs.length === 0) return null;
              return (
                <div
                  key={p}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-extrabold uppercase tracking-[0.15em] text-green-700">
                    {pathLabel[p] || p}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {qs.map((q, qi) => {
                      const sorted = Array.from(q.answers.values()).sort(
                        (a, b) => b.count - a.count
                      );
                      return (
                        <div key={q.questionId} className="px-6 py-5">
                          <div className="mb-3">
                            <div className="text-xs font-bold tracking-wider text-gray-400">
                              QUESTION {qi + 1} • {q.total} responses
                            </div>
                            <h3 className="text-base font-bold text-slate-900 md:text-lg">
                              {q.questionTitle}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {sorted.map((a) => {
                              const pct =
                                q.total > 0 ? Math.round((a.count / q.total) * 100) : 0;
                              return (
                                <Bar
                                  key={a.answerId}
                                  label={a.answerLabel}
                                  count={a.count}
                                  pct={pct}
                                  small
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent submissions */}
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
                  <th className="px-4 py-3">Path</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Via</th>
                  <th className="px-4 py-3">Coupon</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(s.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {pathLabel[s.path_id] || s.path_id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.submitted_via || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.coupon_code || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="text-xs text-gray-500">
        Free-text answers and full submission detail in the{" "}
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Supabase Table Editor
        </a>
        .
      </div>
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
  small,
}: {
  label: string;
  count: number;
  pct: number;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${
          small ? "w-56 text-sm" : "w-44 text-sm font-medium"
        } shrink-0 text-slate-700`}
      >
        {label}
      </div>
      <div
        className={`${
          small ? "h-5" : "h-7"
        } flex-1 overflow-hidden rounded-full bg-gray-100`}
      >
        <div
          className="h-full rounded-full bg-green-600"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={`w-28 shrink-0 text-right text-sm tabular-nums ${
          small ? "text-gray-600" : "text-slate-700"
        }`}
      >
        {count} ({pct}%)
      </div>
    </div>
  );
}
