"use client";
import { useEffect, useMemo, useState } from "react";

type MCAnswer = { id: string; label: string };
type QuestionType = "multi" | "single" | "text";
type Question = {
  id: string;
  title: string;
  type: QuestionType;
  answers?: MCAnswer[];
};
type MiddleSectionProps = { title: string; subtitle: string };

const COUPON = "FEEDBACK20";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const questions: Question[] = [
  {
    id: "q1",
    title: "What are the biggest areas where we can improve?",
    type: "multi",
    answers: [
      { id: "quality", label: "Quality of product" },
      { id: "price", label: "Price" },
      { id: "ux", label: "User experience on the website" },
      { id: "checkout", label: "Checkout process" },
      { id: "payment", label: "Payment process" },
      { id: "shipping", label: "Shipping and delivery" },
      { id: "packaging", label: "Packaging" },
      { id: "branding", label: "Branding and design" },
      { id: "customer_service", label: "Customer service" },
      { id: "speed", label: "Website speed / loading times" },
      { id: "info", label: "Product information and descriptions" },
      { id: "other", label: "Other (please specify)" },
    ],
  },
  {
    id: "q2",
    title: "When browsing our website, what frustrates you the most?",
    type: "multi",
    answers: [
      { id: "slow", label: "Pages load too slowly" },
      { id: "hard_find", label: "Hard to find what I'm looking for" },
      { id: "menu", label: "Navigation menu is confusing" },
      { id: "search", label: "Search function doesn't return good results" },
      { id: "popups", label: "Too many pop-ups or distractions" },
      { id: "mobile", label: "Site doesn't work well on mobile" },
      { id: "images", label: "Images load slowly or look low quality" },
      { id: "nothing", label: "Nothing — the site works fine for me" },
      { id: "other", label: "Other (please specify)" },
    ],
  },
  {
    id: "q3",
    title: "On our product pages, what's missing or could be better?",
    type: "multi",
    answers: [
      { id: "photos_count", label: "Not enough product photos" },
      { id: "photos_clarity", label: "Photos don't show the product clearly" },
      { id: "descriptions", label: "Product descriptions lack detail" },
      { id: "sizing", label: "Sizing or dimensions are unclear" },
      { id: "reviews", label: "No customer reviews visible" },
      { id: "pricing", label: "Price or discounts aren't clear" },
      { id: "shipping_info", label: "Shipping info isn't visible early enough" },
      { id: "stock", label: "Stock availability is unclear" },
      { id: "compare", label: "Hard to compare similar products" },
      { id: "other", label: "Other (please specify)" },
    ],
  },
  {
    id: "q4",
    title: "If you've ever started a checkout but didn't finish, what stopped you?",
    type: "multi",
    answers: [
      { id: "shipping_cost", label: "Shipping cost was too high" },
      { id: "shipping_time", label: "Shipping time was too long" },
      { id: "payment_options", label: "Limited payment options" },
      { id: "account", label: "Had to create an account" },
      { id: "form", label: "Checkout form was too long or complicated" },
      { id: "error", label: "Site crashed or had an error" },
      { id: "discount", label: "Couldn't apply a discount code" },
      { id: "not_ready", label: "I just wasn't ready to buy yet" },
      { id: "never", label: "I've never abandoned a checkout" },
      { id: "other", label: "Other (please specify)" },
    ],
  },
  {
    id: "q5",
    title: "How would you rate the speed and performance of our website?",
    type: "single",
    answers: [
      { id: "excellent", label: "Excellent — everything loads instantly" },
      { id: "good", label: "Good — minor delays sometimes" },
      { id: "average", label: "Average — noticeable but tolerable" },
      { id: "poor", label: "Poor — slow enough to frustrate me" },
      { id: "very_poor", label: "Very poor — often unusable" },
    ],
  },
  {
    id: "q6",
    title: "Which device do you mostly use to browse our website, and how is the experience?",
    type: "single",
    answers: [
      { id: "mobile_ok", label: "Mobile — works well" },
      { id: "mobile_issues", label: "Mobile — has issues" },
      { id: "desktop_ok", label: "Desktop / laptop — works well" },
      { id: "desktop_issues", label: "Desktop / laptop — has issues" },
      { id: "tablet_ok", label: "Tablet — works well" },
      { id: "tablet_issues", label: "Tablet — has issues" },
    ],
  },
  {
    id: "q7",
    title: "If there's one thing you could change about our website to make it better, what would it be?",
    type: "text",
  },
];

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((item, i) => {
        const active = item <= current;
        return (
          <div key={item} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${active ? "border-green-700 bg-green-700 text-white" : "border-gray-300 bg-white text-gray-400"}`}>{item}</div>
            {i < total - 1 && (<div className={`h-[2px] w-8 ${item < current ? "bg-green-700" : "bg-gray-300"}`} />)}
          </div>
        );
      })}
    </div>
  );
}

export default function MiddleSection({ title, subtitle }: MiddleSectionProps) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  // For multi-select: question id -> array of selected answer ids
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  // For single-select: question id -> selected answer id
  const [single, setSingle] = useState<Record<string, string>>({});
  // Text answer for text-only questions
  const [textAns, setTextAns] = useState<Record<string, string>>({});
  // Optional "Add a few words" free-text per MC question
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({});

  const [email, setEmail] = useState("");
  const [klid, setKlid] = useState("");
  const [emailFromUrl, setEmailFromUrl] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const e = p.get("email") || "";
    const k = p.get("klid") || p.get("kl_id") || "";
    if (e) { setEmail(e); setEmailFromUrl(true); }
    if (k) setKlid(k);
  }, []);

  const totalQ = questions.length; // 7
  const totalSteps = totalQ + (emailFromUrl ? 0 : 1); // +1 for email page
  const isEmailStep = !emailFromUrl && step === totalSteps;
  const isFinalStep = step === totalSteps;
  const currentQ = step <= totalQ ? questions[step - 1] : null;

  const scrollTop = () => { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };

  const toggleMulti = (qid: string, aid: string) => {
    setMulti((prev) => {
      const set = new Set(prev[qid] || []);
      if (set.has(aid)) set.delete(aid); else set.add(aid);
      return { ...prev, [qid]: Array.from(set) };
    });
    setError("");
  };
  const pickSingle = (qid: string, aid: string) => {
    setSingle((prev) => ({ ...prev, [qid]: aid }));
    setError("");
  };
  const setFreeText = (qid: string, t: string) => setFreeTexts((prev) => ({ ...prev, [qid]: t }));
  const setText = (qid: string, t: string) => setTextAns((prev) => ({ ...prev, [qid]: t }));

  const validate = (): boolean => {
    if (!currentQ) return true; // email step, no validation
    if (currentQ.type === "multi") {
      if (!multi[currentQ.id] || multi[currentQ.id].length === 0) {
        setError("Please select at least one option to continue.");
        return false;
      }
    } else if (currentQ.type === "single") {
      if (!single[currentQ.id]) {
        setError("Please pick one option to continue.");
        return false;
      }
    }
    // text type: optional, no validation
    return true;
  };

  const buildPayload = () => {
    return {
      email: email.trim() || null,
      klid: klid.trim() || null,
      path: "main_v2",
      pathName: "Customer Feedback Survey",
      submittedVia: email.trim() ? "email" : "skip",
      coupon: COUPON,
      discount: "20% OFF",
      sorting: null,
      answers: questions.map((q) => {
        if (q.type === "multi") {
          const ids = multi[q.id] || [];
          const labels = ids.map((id) => q.answers!.find((a) => a.id === id)?.label || id);
          return {
            questionId: q.id,
            questionTitle: q.title,
            questionType: "multi",
            answerIds: ids,
            answerLabels: labels,
            answerId: ids[0] || "",
            answerLabel: labels[0] || "",
            freeText: (freeTexts[q.id] || "").trim() || null,
          };
        } else if (q.type === "single") {
          const id = single[q.id] || "";
          const label = q.answers!.find((a) => a.id === id)?.label || "";
          return {
            questionId: q.id,
            questionTitle: q.title,
            questionType: "single",
            answerIds: id ? [id] : [],
            answerLabels: label ? [label] : [],
            answerId: id,
            answerLabel: label,
            freeText: (freeTexts[q.id] || "").trim() || null,
          };
        } else {
          return {
            questionId: q.id,
            questionTitle: q.title,
            questionType: "text",
            answerIds: [],
            answerLabels: [],
            answerId: "",
            answerLabel: "",
            freeText: (textAns[q.id] || "").trim() || null,
          };
        }
      }),
      submittedAt: new Date().toISOString(),
    };
  };

  const submitFinal = () => {
    setError("");
    fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) }).catch(() => {});
    setDone(true);
    scrollTop();
  };

  const handleContinue = () => {
    if (!validate()) { scrollTop(); return; }
    setError("");
    if (isFinalStep) { submitFinal(); return; }
    setStep(step + 1);
    scrollTop();
  };

  const handleBack = () => {
    setError("");
    if (step > 1) { setStep(step - 1); scrollTop(); }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">
        <section className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-10 text-center shadow-sm">
          <div className="mb-4 text-7xl">🎁</div>
          <h2 className="mb-3 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">Thank you for your feedback! ✨</h2>
          <p className="mx-auto mb-7 max-w-xl text-base leading-7 text-gray-600 md:text-lg">Your answers help us improve every part of your shopping experience 💚. As promised, here&apos;s your <strong>20% OFF</strong> code:</p>
          <div className="mx-auto mb-7 max-w-md rounded-2xl border-2 border-dashed border-green-700 bg-green-50 px-6 py-5">
            <div className="mb-1 text-xs font-extrabold tracking-[0.18em] text-green-700">✨ YOUR 20% OFF CODE ✨</div>
            <div className="text-3xl font-extrabold tracking-wider text-slate-900">{COUPON}</div>
            <div className="mt-2 text-sm text-gray-600">Use this code at checkout on your next order.</div>
            {email.trim() && (<div className="mt-3 text-xs text-green-800">We&apos;ll also email this code and product updates to {email}. 📩</div>)}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://www.znaturalfoods.com/" className="rounded-xl bg-green-700 px-6 py-3 font-extrabold text-white hover:bg-green-800">Start shopping →</a>
            <a href="https://www.znaturalfoods.com/specials" className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-extrabold text-slate-700 hover:border-gray-400">See current specials</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-500 md:text-xl md:leading-8">{subtitle}</p>
        <ProgressDots current={step} total={totalSteps} />
      </section>

      {error && (<div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>)}

      {currentQ && (
        <section className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm md:p-9">
          <div className="mb-3 text-xs font-extrabold tracking-[0.18em] text-green-700">
            QUESTION {step} OF {totalQ}{currentQ.type === "multi" ? " · SELECT ALL THAT APPLY" : currentQ.type === "single" ? " · PICK ONE" : ""}
          </div>
          <h2 className="mb-7 text-2xl font-extrabold text-slate-900 md:text-3xl">{currentQ.title}</h2>

          {currentQ.type === "multi" && (
            <div className="grid gap-3 md:grid-cols-2">
              {currentQ.answers!.map((a) => {
                const selected = (multi[currentQ.id] || []).includes(a.id);
                return (
                  <button key={a.id} type="button" onClick={() => toggleMulti(currentQ.id, a.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${selected ? "border-green-700 bg-green-50 shadow-sm" : "border-gray-200 bg-white hover:border-green-600 hover:shadow-sm"}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${selected ? "border-green-700 bg-green-700" : "border-gray-300 bg-white"}`}>
                      {selected && (<svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5l2.5 2.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
                    </span>
                    <span className="text-[15px] font-medium text-slate-900">{a.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === "single" && (
            <div className="grid gap-3 md:grid-cols-2">
              {currentQ.answers!.map((a) => {
                const selected = single[currentQ.id] === a.id;
                return (
                  <button key={a.id} type="button" onClick={() => pickSingle(currentQ.id, a.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${selected ? "border-green-700 bg-green-50 shadow-sm" : "border-gray-200 bg-white hover:border-green-600 hover:shadow-sm"}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-green-700 bg-green-700" : "border-gray-300 bg-white"}`}>
                      {selected && (<span className="h-2 w-2 rounded-full bg-white" />)}
                    </span>
                    <span className="text-[15px] font-medium text-slate-900">{a.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === "text" && (
            <textarea value={textAns[currentQ.id] || ""} onChange={(e) => setText(currentQ.id, e.target.value)} rows={6} className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-[15px] outline-none focus:border-green-600" placeholder="Type your answer here..." />
          )}

          {(currentQ.type === "multi" || currentQ.type === "single") && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Add a few words (optional) <span className="font-normal text-gray-400">— for &quot;Other&quot; or extra context</span></label>
              <textarea value={freeTexts[currentQ.id] || ""} onChange={(e) => setFreeText(currentQ.id, e.target.value)} rows={2} className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-[15px] outline-none focus:border-green-600" placeholder="Add a few words here..." />
            </div>
          )}
        </section>
      )}

      {isEmailStep && (
        <section className="overflow-hidden rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 shadow-md md:p-10">
          <div className="mb-3 text-center text-6xl">💌</div>
          <h2 className="mb-3 text-center text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">One last thing — your email (optional)</h2>
          <p className="mx-auto mb-7 max-w-xl text-center text-base leading-7 text-gray-600 md:text-lg">Drop your email below to get your 20% off code by email plus occasional product updates. You&apos;ll see the code on the next page either way.</p>
          <div className="mx-auto max-w-md">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Your email <span className="font-normal text-gray-400">(optional)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-green-600" />
            <p className="mt-3 text-center text-xs text-gray-500">If you give your email, you agree to occasional marketing emails. Unsubscribe any time.</p>
          </div>
        </section>
      )}

      <div className="mt-7 flex items-center justify-between gap-3">
        <button type="button" onClick={handleBack} disabled={step === 1} className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-gray-400 disabled:opacity-40">← Back</button>
        <button type="button" onClick={handleContinue} className="rounded-xl bg-green-700 px-7 py-3 text-base font-extrabold text-white shadow-sm hover:bg-green-800">{isFinalStep ? "Get my 20% off 🎁" : "Continue →"}</button>
      </div>
    </main>
  );
}
