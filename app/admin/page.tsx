import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

const pathLabel: Record<string, string> = {
  path1: "Recent Buyer",
  path2: "Past Buyer",
  path3: "Website Visitor",
  path4: "Checkout Abandon",
  path5: "Competitor Buyer",
  path6: "Other",
};

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
      .limit(500);
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
  const byPath = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.path_id || "unknown"] = (acc[s.path_id || "unknown"] || 0) + 1;
    return acc;
  }, {});
  const withEmail = submissions.filter((s) => s.email).length;
  const emailRate = total > 0 ? Math.round((withEmail / total) * 100) : 0;
  const recent = submissions.slice(0, 30);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Survey Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Live data from your customer feedback survey.
          </p>
        </div>
        <form method="POST" action="/api/admin/logout">
          <button
            type="submit"
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400"
          >
            Log out
          </button>
        </form>
      </div>

      {dbError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {dbError}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-gray-500">
            Total submissions
          </div>
          <div className="mt-1 text-4xl font-extrabold text-slate-900">
            {total}
          </div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-green-700">
            Email captured (30% off)
          </div>
          <div className="mt-1 text-4xl font-extrabold text-green-700">
            {withEmail}
          </div>
          <div className="mt-1 text-xs text-green-800">
            {emailRate}% capture rate
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-gray-500">
            Skipped email (20% off)
          </div>
          <div className="mt-1 text-4xl font-extrabold text-slate-900">
            {total - withEmail}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-lg font-bold text-slate-900">
          Submissions by path
        </div>
        {total === 0 ? (
          <div className="text-sm text-gray-500">No submissions yet.</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(byPath)
              .sort((a, b) => b[1] - a[1])
              .map(([pid, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={pid} className="flex items-center gap-3">
                    <div className="w-44 text-sm font-medium text-slate-700">
                      {pathLabel[pid] || pid}
                    </div>
                    <div className="h-7 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-24 text-right text-sm tabular-nums text-slate-700">
                      {count} ({pct}%)
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div className="text-lg font-bold text-slate-900">
            Recent submissions
          </div>
          <a
            href="/api/admin/export"
            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800"
          >
            Download CSV
          </a>
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
                    <td className="px-4 py-3 text-gray-600">
                      {s.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.submitted_via || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.coupon_code || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        For deeper analysis, browse the raw{" "}
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
