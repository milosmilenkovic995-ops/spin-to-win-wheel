"use client";
import { useEffect, useState } from "react";

import { questions, COUPON_CODE, type Question } from "@/lib/questions";

type MiddleSectionProps = { title: string; subtitle: string };

const COUPON = COUPON_CODE;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


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

function CouponBox() {
  return (
    <div className="mx-auto mb-7 max-w-md rounded-2xl border-2 border-dashed border-green-700 bg-green-50 px-6 py-5 text-center">
      <div className="mb-1 text-xs font-extrabold tracking-[0.18em] text-green-700">✨ YOUR 20% OFF CODE ✨</div>
      <div className="text-3xl font-extrabold tracking-wider text-slate-900">{COUPON}</div>
      <div className="mt-2 text-sm text-gray-600">Use this code at checkout on your next order.</div>
    </div>
  );
}

export default function MiddleSection({ title, subtitle }: MiddleSectionProps) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [submittedWithEmail, setSubmittedWithEmail] = useState<boolean>(false);

  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [single, setSingle] = useState<Record<string, string>>({});
  const [textAns, setTextAns] = useState<Record<string, string>>({});
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({});

  const [email, setEmail] = useState("");
  const [klid, setKlid] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const e = p.get("email") || "";
    const k = p.get("klid") || p.get("kl_id") || "";
    if (e) setEmail(e);
    if (k) setKlid(k);
  }, []);

  const totalQ = questions.length;
  const totalSteps = totalQ + 1; // 8 dots total
  const isCouponStep = step === totalSteps; // step 8
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
    if (!currentQ) return true;
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
    return true;
  };

  const hasValidEmail = email.trim().length > 0 && EMAIL_REGEX.test(email.trim());

  const buildPayload = () => ({
    email: hasValidEmail ? email.trim() : null,
    klid: klid.trim() || null,
    path: "main_v2",
    pathName: "Customer Feedback Survey",
    submittedVia: hasValidEmail ? "email" : "skip",
    coupon: COUPON,
    discount: "20% OFF",
    sorting: null,
    answers: questions.map((q) => {
      if (q.type === "multi") {
        const ids = multi[q.id] || [];
        const labels = ids.map((id) => q.answers!.find((a) => a.id === id)?.label || id);
        return {
          questionId: q.id, questionTitle: q.title, questionType: "multi",
          answerIds: ids, answerLabels: labels,
          answerId: ids[0] || "", answerLabel: labels[0] || "",
          freeText: (freeTexts[q.id] || "").trim() || null,
        };
      } else if (q.type === "single") {
        const id = single[q.id] || "";
        const label = q.answers!.find((a) => a.id === id)?.label || "";
        return {
          questionId: q.id, questionTitle: q.title, questionType: "single",
          answerIds: id ? [id] : [], answerLabels: label ? [label] : [],
          answerId: id, answerLabel: label,
          freeText: (freeTexts[q.id] || "").trim() || null,
        };
      } else {
        return {
          questionId: q.id, questionTitle: q.title, questionType: "text",
          answerIds: [], answerLabels: [], answerId: "", answerLabel: "",
          freeText: (textAns[q.id] || "").trim() || null,
        };
      }
    }),
    submittedAt: new Date().toISOString(),
  });

  const submitFinal = () => {
    setError("");
    setSubmittedWithEmail(hasValidEmail);
    fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) }).catch(() => {});
    setDone(true);
    scrollTop();
  };

  const handleContinue = () => {
    if (!validate()) { scrollTop(); return; }
    setError("");
    if (isCouponStep) { submitFinal(); return; }
    setStep(step + 1);
    scrollTop();
  };

  const handleBack = () => {
    setError("");
    if (step > 1) { setStep(step - 1); scrollTop(); }
  };

  /* ---------------- Done state (after submit) ---------------- */
  if (done) {
    if (submittedWithEmail) {
      return (
        <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">
          <section className="rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-10 text-center shadow-md">
            <div className="mb-4 text-7xl">💌</div>
            <h2 className="mb-3 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">Your personal offer is on the way! ✨</h2>
            <p className="mx-auto mb-7 max-w-xl text-base leading-7 text-gray-600 md:text-lg">
              Thanks again 💚 — we&apos;ll send a personalized offer to <strong>{email.trim()}</strong> very soon. Keep an eye on your inbox.
            </p>
            <CouponBox />
            <p className="mb-6 text-sm text-gray-500">Your 20% off code is yours to use right away — no need to wait for the email.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="https://www.znaturalfoods.com/" className="rounded-xl bg-green-700 px-6 py-3 font-extrabold text-white hover:bg-green-800">Start shopping →</a>
              <a href="https://www.znaturalfoods.com/specials" className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-extrabold text-slate-700 hover:border-gray-400">See current specials</a>
            </div>
          </section>
        </main>
      );
    }
    // No-email confirmation
    return (
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">
        <section className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-4 text-6xl">🎉</div>
          <h2 className="mb-3 text-3xl font-extrabold text-slate-900 md:text-4xl">You&apos;re all set!</h2>
          <p className="mx-auto mb-7 max-w-xl text-base leading-7 text-gray-600 md:text-lg">Thanks again for your feedback 💚. Here&apos;s your code — use it whenever you&apos;re ready.</p>
          <CouponBox />
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://www.znaturalfoods.com/" className="rounded-xl bg-green-700 px-6 py-3 font-extrabold text-white hover:bg-green-800">Start shopping →</a>
            <a href="https://www.znaturalfoods.com/specials" className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-extrabold text-slate-700 hover:border-gray-400">See current specials</a>
          </div>
        </section>
      </main>
    );
  }

  /* ---------------- Active survey ---------------- */
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

      {/* Step 8: Thank-you with coupon + optional email */}
      {isCouponStep && (
        <section className="overflow-hidden rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 shadow-md md:p-10">
          <div className="mb-3 text-center text-6xl">💚</div>
          <h2 className="mb-3 text-center text-2xl font-extrabold leading-tight text-slate-900 md:text-4xl">
            Thank you for your time — we really appreciate it!
          </h2>
          <p className="mx-auto mb-7 max-w-xl text-center text-base leading-7 text-gray-600 md:text-lg">
            Here&apos;s your coupon code for instant use:
          </p>

          <CouponBox />

          <div className="mx-auto mt-2 max-w-md">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              If you want us to send you a personal offer, put email{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-green-600" />
          </div>
        </section>
      )}

      <div className="mt-7 flex items-center justify-between gap-3">
        <button type="button" onClick={handleBack} disabled={step === 1} className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-gray-400 disabled:opacity-40">← Back</button>
        <button type="button" onClick={handleContinue} className="rounded-xl bg-green-700 px-7 py-3 text-base font-extrabold text-white shadow-sm hover:bg-green-800">
          {isCouponStep ? (hasValidEmail ? "Send me my personal offer 🎁" : "Finish survey →") : "Continue →"}
        </button>
      </div>
    </main>
  );
}
