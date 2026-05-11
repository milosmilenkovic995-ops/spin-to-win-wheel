"use client";
import { useEffect, useMemo, useState } from "react";

type MCAnswer = { id: string; label: string };
type Question = { id: string; title: string; answers: MCAnswer[]; freeTextLabel: string };
type SurveyPath = { id: string; name: string; emoji: string; goal: string; questions: Question[] };
type MiddleSectionProps = { title: string; subtitle: string };

const COUPON_WITH_EMAIL = "FEEDBACK30";
const COUPON_NO_EMAIL = "FEEDBACK20";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sortingQuestion: Question = {
  id: "sorting",
  title: "What best describes your current experience with us?",
  answers: [
    { id: "bought_recently", label: "I bought recently" },
    { id: "bought_before", label: "I bought before, but not recently" },
    { id: "visited_no_buy", label: "I visited the website but did not buy" },
    { id: "cart_abandoned", label: "I added products to my cart but did not complete checkout" },
    { id: "competitor", label: "I usually buy similar products from another store" },
    { id: "other", label: "Other" },
  ],
  freeTextLabel: "Tell us more about your answer.",
};

const pathRouting: Record<string, string> = {
  bought_recently: "path1",
  bought_before: "path2",
  visited_no_buy: "path3",
  cart_abandoned: "path4",
  competitor: "path5",
  other: "path6",
};

const path1: SurveyPath = {
  id: "path1", name: "Recent Buyer", emoji: "\u{1F49A}",
  goal: "Learn why you bought and what would make you buy more often.",
  questions: [
    { id: "p1_q1", title: "What was the main reason you decided to buy from us?",
      answers: [
        { id: "quality", label: "Product quality" },
        { id: "organic", label: "Organic or natural ingredients" },
        { id: "selection", label: "Product selection" },
        { id: "price", label: "Price or discount" },
        { id: "trust", label: "Trust in the brand" },
        { id: "reviews", label: "Reviews" },
        { id: "found_it", label: "I found exactly what I needed" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us more about why you decided to buy." },
    { id: "p1_q2", title: "Was there anything that made you hesitate before buying?",
      answers: [
        { id: "no", label: "No, everything was clear" },
        { id: "price", label: "Price" },
        { id: "shipping_cost", label: "Shipping cost" },
        { id: "delivery_time", label: "Delivery time" },
        { id: "unclear_info", label: "Product information was not clear enough" },
        { id: "more_reviews", label: "I wanted more reviews" },
        { id: "comparing", label: "I was comparing with another store" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what made you hesitate." },
    { id: "p1_q3", title: "What would make you buy from us more often?",
      answers: [
        { id: "better_discounts", label: "Better discounts" },
        { id: "lower_shipping", label: "Lower shipping cost" },
        { id: "faster_delivery", label: "Faster delivery" },
        { id: "more_education", label: "More product education" },
        { id: "bundles", label: "More bundle offers" },
        { id: "subscriptions", label: "Subscription options" },
        { id: "recommendations", label: "Better product recommendations" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what would make you order more often." },
    { id: "p1_q4", title: "What could we improve about your shopping experience?",
      answers: [
        { id: "navigation", label: "Website navigation" },
        { id: "product_pages", label: "Product pages" },
        { id: "product_images", label: "Product images" },
        { id: "checkout", label: "Checkout process" },
        { id: "shipping_info", label: "Shipping information" },
        { id: "discounts", label: "Discounts/offers" },
        { id: "nothing", label: "Nothing, everything was good" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what we could improve." },
  ],
};

const path2: SurveyPath = {
  id: "path2", name: "Past Buyer", emoji: "\u{1F501}",
  goal: "Learn why you stopped buying and what would bring you back.",
  questions: [
    { id: "p2_q1", title: "Why have you not ordered from us recently?",
      answers: [
        { id: "have_enough", label: "I still have enough product" },
        { id: "price", label: "Price is too high" },
        { id: "shipping_cost", label: "Shipping cost is too high" },
        { id: "other_store", label: "I bought from another store" },
        { id: "forgot", label: "I forgot about the brand" },
        { id: "no_need", label: "I did not need the product again yet" },
        { id: "issue", label: "I had an issue with my previous order" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us more about why you have not ordered recently." },
    { id: "p2_q2", title: "Are you currently buying similar products somewhere else?",
      answers: [
        { id: "amazon", label: "Yes, from Amazon" },
        { id: "walmart", label: "Yes, from Walmart" },
        { id: "iherb", label: "Yes, from iHerb" },
        { id: "local", label: "Yes, from a local health store" },
        { id: "other_brand", label: "Yes, from another brand website" },
        { id: "no", label: "No, I am not buying similar products right now" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Where do you usually buy now, and why?" },
    { id: "p2_q3", title: "What would make you come back and order again?",
      answers: [
        { id: "discount", label: "A better discount" },
        { id: "free_shipping", label: "Free or lower-cost shipping" },
        { id: "faster_delivery", label: "Faster delivery" },
        { id: "new_products", label: "New products" },
        { id: "recommendations", label: "Better product recommendations" },
        { id: "trust", label: "More trust or product information" },
        { id: "reminder", label: "A reminder when I may need to reorder" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what would make you buy again." },
    { id: "p2_q4", title: "Was there anything from your previous experience that could have been better?",
      answers: [
        { id: "quality", label: "Product quality" },
        { id: "packaging", label: "Product packaging" },
        { id: "delivery_time", label: "Delivery time" },
        { id: "shipping_cost", label: "Shipping cost" },
        { id: "support", label: "Customer support" },
        { id: "website", label: "Website experience" },
        { id: "nothing", label: "Nothing, my experience was good" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what could have been better." },
  ],
};

const path3: SurveyPath = {
  id: "path3", name: "Website Visitor", emoji: "\u{1F440}",
  goal: "Learn what stopped you before purchase.",
  questions: [
    { id: "p3_q1", title: "What was the main reason you did not place an order?",
      answers: [
        { id: "price", label: "Price was too high" },
        { id: "shipping_cost", label: "Shipping cost was too high" },
        { id: "not_ready", label: "I was not ready to buy" },
        { id: "more_info", label: "I needed more product information" },
        { id: "confidence", label: "I did not feel confident enough" },
        { id: "wrong_product", label: "I could not find the right product" },
        { id: "elsewhere", label: "I decided to buy somewhere else" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us more about what stopped you." },
    { id: "p3_q2", title: "Was anything confusing on the website?",
      answers: [
        { id: "no", label: "No, the website was clear" },
        { id: "hard_find", label: "It was hard to find products" },
        { id: "unclear_pages", label: "Product pages were not clear enough" },
        { id: "right_product", label: "I was not sure which product was right for me" },
        { id: "checkout", label: "Checkout or cart was confusing" },
        { id: "shipping_pricing", label: "Shipping or pricing was unclear" },
        { id: "too_busy", label: "The website felt too busy" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what felt confusing." },
    { id: "p3_q3", title: "What information was missing before you could feel ready to buy?",
      answers: [
        { id: "product_details", label: "More product details" },
        { id: "ingredients", label: "More ingredient information" },
        { id: "reviews", label: "More reviews" },
        { id: "usage", label: "More usage instructions" },
        { id: "comparisons", label: "More product comparisons" },
        { id: "quality", label: "More quality/testing information" },
        { id: "shipping_returns", label: "More shipping/return information" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what information would help you most." },
    { id: "p3_q4", title: "What would have made you more likely to complete your purchase?",
      answers: [
        { id: "discount", label: "Better discount" },
        { id: "free_shipping", label: "Free shipping" },
        { id: "faster_delivery", label: "Faster delivery" },
        { id: "reviews", label: "More reviews" },
        { id: "benefits", label: "Clearer product benefits" },
        { id: "recommendations", label: "Better product recommendations" },
        { id: "trust", label: "More trust in the brand" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what would have helped you buy." },
  ],
};

const path4: SurveyPath = {
  id: "path4", name: "Checkout Abandonment", emoji: "\u{1F6D2}",
  goal: "Learn what stopped you at the final step.",
  questions: [
    { id: "p4_q1", title: "What made you leave before completing checkout?",
      answers: [
        { id: "shipping_cost", label: "Shipping cost was too high" },
        { id: "total_price", label: "Total price was higher than expected" },
        { id: "delivery_time", label: "Delivery time was too long" },
        { id: "comparing", label: "I wanted to compare prices" },
        { id: "distracted", label: "I got distracted and forgot" },
        { id: "difficult", label: "Checkout process felt difficult" },
        { id: "technical", label: "I had a technical issue" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what happened at checkout." },
    { id: "p4_q2", title: "Did anything surprise you in the cart or checkout?",
      answers: [
        { id: "no", label: "No, nothing surprised me" },
        { id: "shipping_cost", label: "Shipping cost" },
        { id: "taxes_fees", label: "Taxes or extra fees" },
        { id: "total", label: "Final total price" },
        { id: "delivery_time", label: "Delivery time" },
        { id: "discount_code", label: "Discount code did not work" },
        { id: "payment", label: "Payment issue" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what surprised you." },
    { id: "p4_q3", title: "What would have made you complete the order?",
      answers: [
        { id: "free_shipping", label: "Free shipping" },
        { id: "discount", label: "Better discount" },
        { id: "faster_delivery", label: "Faster delivery" },
        { id: "clearer_total", label: "Clearer total price earlier" },
        { id: "easier_checkout", label: "Easier checkout" },
        { id: "payment_options", label: "More payment options" },
        { id: "reminder", label: "Reminder email or SMS" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what would have helped you finish the order." },
  ],
};

const path5: SurveyPath = {
  id: "path5", name: "Competitor Buyer", emoji: "\u{1F3C6}",
  goal: "Learn where you buy and what those stores do better.",
  questions: [
    { id: "p5_q1", title: "Where do you usually buy similar products?",
      answers: [
        { id: "amazon", label: "Amazon" },
        { id: "walmart", label: "Walmart" },
        { id: "iherb", label: "iHerb" },
        { id: "thrive", label: "Thrive Market" },
        { id: "local", label: "Local health food store" },
        { id: "other_brand", label: "Another brand website" },
        { id: "rarely", label: "I do not buy similar products often" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us where you usually buy." },
    { id: "p5_q2", title: "Why do you choose that store?",
      answers: [
        { id: "lower_prices", label: "Lower prices" },
        { id: "faster_shipping", label: "Faster shipping" },
        { id: "free_shipping", label: "Free shipping" },
        { id: "selection", label: "Better product selection" },
        { id: "experience", label: "Easier shopping experience" },
        { id: "reviews", label: "More reviews" },
        { id: "trust", label: "More trust in the store" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us why you prefer that store." },
    { id: "p5_q3", title: "What does that store do better than us?",
      answers: [
        { id: "prices", label: "Better prices" },
        { id: "shipping", label: "Better shipping" },
        { id: "website", label: "Better website experience" },
        { id: "info", label: "Better product information" },
        { id: "reviews", label: "Better reviews" },
        { id: "recommendations", label: "Better recommendations" },
        { id: "offers", label: "Better offers or subscriptions" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what they do better." },
    { id: "p5_q4", title: "What would make you choose us instead?",
      answers: [
        { id: "discount", label: "Better discount" },
        { id: "shipping", label: "Free or faster shipping" },
        { id: "website", label: "Easier website experience" },
        { id: "education", label: "More product education" },
        { id: "recommendations", label: "Better product recommendations" },
        { id: "trust", label: "More trust-building information" },
        { id: "bundles", label: "Better bundles or subscriptions" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what would make you choose us." },
  ],
};

const path6: SurveyPath = {
  id: "path6", name: "Other", emoji: "\u{1F4AD}",
  goal: "Capture anything that does not fit the main paths.",
  questions: [
    { id: "p6_q1", title: "What best describes your situation?",
      answers: [
        { id: "not_ready", label: "I am interested but not ready to buy" },
        { id: "more_info", label: "I need more information" },
        { id: "comparing", label: "I am comparing options" },
        { id: "website_issue", label: "I had an issue on the website" },
        { id: "not_interested", label: "I am not interested right now" },
        { id: "already_buy", label: "I already buy from you" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us more about your situation." },
    { id: "p6_q2", title: "What could we improve for you?",
      answers: [
        { id: "info", label: "Product information" },
        { id: "pricing", label: "Pricing" },
        { id: "shipping", label: "Shipping" },
        { id: "website", label: "Website experience" },
        { id: "selection", label: "Product selection" },
        { id: "reviews", label: "Trust and reviews" },
        { id: "offers", label: "Offers and discounts" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Tell us what we could improve." },
    { id: "p6_q3", title: "Is there anything else you want to share?",
      answers: [
        { id: "website", label: "Yes, I have feedback about the website" },
        { id: "products", label: "Yes, I have feedback about products" },
        { id: "pricing_shipping", label: "Yes, I have feedback about pricing or shipping" },
        { id: "buying", label: "Yes, I have feedback about the buying process" },
        { id: "no", label: "No, nothing else" },
        { id: "other", label: "Other" },
      ], freeTextLabel: "Write your feedback here." },
  ],
};

const allPaths: Record<string, SurveyPath> = { path1, path2, path3, path4, path5, path6 };

function ProgressDots({ current, total }: { current: number; total: number }) {
  const items = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2">
      {items.map((item, i) => {
        const active = item <= current;
        return (
          <div key={item} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${active ? "border-green-700 bg-green-700 text-white" : "border-gray-300 bg-white text-gray-400"}`}>{item}</div>
            {i < items.length - 1 && (<div className={`h-[2px] w-8 ${item < current ? "bg-green-700" : "bg-gray-300"}`} />)}
          </div>
        );
      })}
    </div>
  );
}

function QuestionCard({ question, index, total, selected, freeText, onSelect, onFreeTextChange }: { question: Question; index: number; total: number; selected: string; freeText: string; onSelect: (id: string) => void; onFreeTextChange: (text: string) => void; }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm md:p-9">
      <div className="mb-3 text-xs font-extrabold tracking-[0.18em] text-green-700">QUESTION {index} OF {total}</div>
      <h2 className="mb-7 text-2xl font-extrabold text-slate-900 md:text-3xl">{question.title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {question.answers.map((answer) => {
          const isSelected = selected === answer.id;
          return (
            <button key={answer.id} type="button" onClick={() => onSelect(answer.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${isSelected ? "border-green-700 bg-green-50 shadow-sm" : "border-gray-200 bg-white hover:border-green-600 hover:shadow-sm"}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-green-700 bg-green-700" : "border-gray-300 bg-white"}`}>
                {isSelected && (<span className="h-2 w-2 rounded-full bg-white" />)}
              </span>
              <span className="text-[15px] font-medium text-slate-900">{answer.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold text-slate-700">{question.freeTextLabel} <span className="font-normal text-gray-400">(optional)</span></label>
        <textarea value={freeText} onChange={(e) => onFreeTextChange(e.target.value)} rows={3} className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-[15px] outline-none focus:border-green-600" placeholder="Add a few words here..." />
      </div>
    </section>
  );
}

export default function MiddleSection({ title, subtitle }: MiddleSectionProps) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [pathId, setPathId] = useState<string>("");
  const [sortingAnswer, setSortingAnswer] = useState<string>("");
  const [sortingFreeText, setSortingFreeText] = useState("");
  const [pathAnswers, setPathAnswers] = useState<Record<string, { mc: string; text: string }>>({});
  const [email, setEmail] = useState("");
  const [klid, setKlid] = useState("");
  const [emailFromUrl, setEmailFromUrl] = useState(false);
  const [error, setError] = useState("");
  const [submittedWithEmail, setSubmittedWithEmail] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email") || "";
    const k = params.get("klid") || params.get("kl_id") || "";
    if (e) { setEmail(e); setEmailFromUrl(true); }
    if (k) setKlid(k);
  }, []);

  const activePath = useMemo(() => (pathId ? allPaths[pathId] : undefined), [pathId]);
  const pathQCount = activePath?.questions.length ?? 4;
  const totalSteps = 1 + pathQCount + (emailFromUrl ? 0 : 1);
  const emailStep = emailFromUrl ? null : 1 + pathQCount + 1;
  const isEmailStep = emailStep !== null && step === emailStep;
  const isFinalStep = step === totalSteps;
  const hasValidEmail = email.trim().length > 0 && EMAIL_REGEX.test(email.trim());
  const usedEmailAtSubmit = submittedWithEmail !== null ? submittedWithEmail : hasValidEmail;
  const finalCoupon = usedEmailAtSubmit ? COUPON_WITH_EMAIL : COUPON_NO_EMAIL;
  const finalDiscountLabel = usedEmailAtSubmit ? "30% OFF" : "20% OFF";

  const scrollTop = () => { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleSortingSelect = (id: string) => {
    setSortingAnswer(id);
    setError("");
    const nextPath = pathRouting[id];
    if (nextPath) { setPathId(nextPath); setPathAnswers({}); }
  };

  const handlePathAnswerSelect = (questionId: string, answerId: string) => {
    setPathAnswers((prev) => ({ ...prev, [questionId]: { mc: answerId, text: prev[questionId]?.text ?? "" } }));
    setError("");
  };

  const handlePathFreeTextChange = (questionId: string, text: string) => {
    setPathAnswers((prev) => ({ ...prev, [questionId]: { mc: prev[questionId]?.mc ?? "", text } }));
  };

  const validateCurrentStep = (): boolean => {
    if (step === 1) {
      if (!sortingAnswer) { setError("Please choose an option to continue."); return false; }
      return true;
    }
    if (step >= 2 && step <= 1 + pathQCount && activePath) {
      const q = activePath.questions[step - 2];
      if (!pathAnswers[q.id]?.mc) { setError("Please choose an option to continue."); return false; }
      return true;
    }
    return true;
  };

  const buildPayload = (withEmail: boolean) => {
    if (!activePath) return null;
    return {
      email: withEmail ? email.trim() || null : null,
      klid: klid.trim() || null,
      path: activePath.id,
      pathName: activePath.name,
      submittedVia: withEmail ? "email" : "skip",
      coupon: withEmail ? COUPON_WITH_EMAIL : COUPON_NO_EMAIL,
      discount: withEmail ? "30% OFF" : "20% OFF",
      sorting: {
        questionId: sortingQuestion.id,
        questionTitle: sortingQuestion.title,
        answerId: sortingAnswer,
        answerLabel: sortingQuestion.answers.find((a) => a.id === sortingAnswer)?.label || "",
        freeText: sortingFreeText.trim() || null,
      },
      answers: activePath.questions.map((q) => {
        const stored = pathAnswers[q.id];
        return {
          questionId: q.id,
          questionTitle: q.title,
          answerId: stored?.mc || "",
          answerLabel: q.answers.find((a) => a.id === stored?.mc)?.label || "",
          freeText: stored?.text?.trim() || null,
        };
      }),
      submittedAt: new Date().toISOString(),
    };
  };

  const handleSubmitFinal = (withEmail: boolean) => {
    if (withEmail && !hasValidEmail) {
      setError("Please enter a valid email, or click Skip to continue without one.");
      scrollTop();
      return;
    }
    setError("");
    setSubmittedWithEmail(withEmail);
    const payload = buildPayload(withEmail);
    fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
    setDone(true);
    scrollTop();
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) { scrollTop(); return; }
    setError("");
    if (isFinalStep) { handleSubmitFinal(true); return; }
    setStep(step + 1);
    scrollTop();
  };

  const handleEmailSubmit = () => handleSubmitFinal(true);
  const handleEmailSkip = () => handleSubmitFinal(false);
  const handleBack = () => { setError(""); if (step > 1) { setStep(step - 1); scrollTop(); } };

  let submitLabel = "Continue →";
  if (isFinalStep && !isEmailStep) submitLabel = "Get my 30% off \u{1F381}";

  if (done) {
    const submittedEmail = submittedWithEmail === true;
    return (
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">
        <section className={`rounded-3xl border p-10 text-center shadow-sm ${submittedEmail ? "border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50" : "border-gray-200 bg-white"}`}>
          {submittedEmail ? (
            <>
              <div className="mb-4 text-7xl">{"\u{1F381}"}</div>
              <h2 className="mb-3 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">Your surprises are unlocked {"✨"}</h2>
              <p className="mx-auto mb-7 max-w-xl text-base leading-7 text-gray-600 md:text-lg">Thank you for sharing your feedback {"\u{1F49A}"} — you just unlocked something special:</p>
              <ul className="mx-auto mb-7 max-w-md space-y-2 text-left text-sm leading-7 text-slate-700 md:text-base">
                <li className="flex items-start gap-2"><span>{"✅"}</span><span><strong>30% OFF</strong> your next order — your code is below.</span></li>
                <li className="flex items-start gap-2"><span>{"✅"}</span><span>A <strong>personalized offer</strong> emailed to you very soon {"\u{1F48C}"}</span></li>
                <li className="flex items-start gap-2"><span>{"✅"}</span><span>Our <strong>thanks</strong> for helping us improve {"\u{1F49A}"}</span></li>
              </ul>
            </>
          ) : (
            <>
              <div className="mb-4 text-6xl">{"\u{1F389}"}</div>
              <h2 className="mb-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Thank you for your feedback!</h2>
              <p className="mx-auto mb-7 max-w-xl text-base leading-7 text-gray-600 md:text-lg">We really appreciate the time you took to share {"\u{1F49A}"}. Here&apos;s your <strong>20% OFF</strong> code to use on your next order.</p>
            </>
          )}
          <div className="mx-auto mb-7 max-w-md rounded-2xl border-2 border-dashed border-green-700 bg-green-50 px-6 py-5">
            <div className="mb-1 text-xs font-extrabold tracking-[0.18em] text-green-700">{"✨"} YOUR {finalDiscountLabel} CODE {"✨"}</div>
            <div className="text-3xl font-extrabold tracking-wider text-slate-900">{finalCoupon}</div>
            <div className="mt-2 text-sm text-gray-600">Use this code at checkout on your next order.</div>
            {submittedEmail && (<div className="mt-3 text-xs text-green-800">We&apos;ll also email this code + your personalized offer shortly. {"\u{1F4E9}"}</div>)}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://www.znaturalfoods.com/" className="rounded-xl bg-green-700 px-6 py-3 font-extrabold text-white hover:bg-green-800">Start shopping {"→"}</a>
            <a href="https://www.znaturalfoods.com/specials" className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-extrabold text-slate-700 hover:border-gray-400">See current specials</a>
          </div>
        </section>
      </main>
    );
  }

  const currentPathQuestion = step >= 2 && step <= 1 + pathQCount && activePath ? activePath.questions[step - 2] : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-500 md:text-xl md:leading-8">{subtitle}</p>
        <ProgressDots current={step} total={totalSteps} />
      </section>
      {error && (<div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>)}
      {step === 1 && (<QuestionCard question={sortingQuestion} index={1} total={totalSteps} selected={sortingAnswer} freeText={sortingFreeText} onSelect={handleSortingSelect} onFreeTextChange={setSortingFreeText} />)}
      {currentPathQuestion && (<QuestionCard question={currentPathQuestion} index={step} total={totalSteps} selected={pathAnswers[currentPathQuestion.id]?.mc ?? ""} freeText={pathAnswers[currentPathQuestion.id]?.text ?? ""} onSelect={(id) => handlePathAnswerSelect(currentPathQuestion.id, id)} onFreeTextChange={(t) => handlePathFreeTextChange(currentPathQuestion.id, t)} />)}
      {isEmailStep && (
        <section className="overflow-hidden rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 shadow-md md:p-10">
          <div className="mb-3 text-center text-7xl">{"\u{1F381}"}</div>
          <h2 className="mb-3 text-center text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">We have a special surprise for you!</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-base leading-7 text-gray-600 md:text-lg">Drop your email and unlock a bigger discount <span className="whitespace-nowrap">— plus a personalized offer</span> made just for you. {"\u{1F48C}"}</p>
          <div className="mx-auto mb-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="relative rounded-2xl border-2 border-green-700 bg-white px-5 py-6 text-center shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">Best deal</div>
              <div className="mb-1 text-xs font-extrabold uppercase tracking-[0.15em] text-green-700">With email</div>
              <div className="text-4xl font-extrabold text-green-700">30% OFF</div>
              <div className="mt-2 text-xs leading-5 text-gray-600">+ a personalized offer just for you {"\u{1F48C}"}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 text-center">
              <div className="mb-1 text-xs font-extrabold uppercase tracking-[0.15em] text-gray-400">Skip</div>
              <div className="text-4xl font-extrabold text-slate-700">20% OFF</div>
              <div className="mt-2 text-xs leading-5 text-gray-500">No follow-up — quick and easy</div>
            </div>
          </div>
          <div className="mx-auto max-w-md">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Your email <span className="font-normal text-gray-400">(optional)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-green-600" />
            <p className="mt-3 text-center text-xs text-gray-500">By entering your email, you agree to occasional marketing emails. Unsubscribe any time.</p>
          </div>
        </section>
      )}
      {isEmailStep ? (
        <div className="mt-7 grid grid-cols-3 items-center gap-3">
          <div className="flex justify-start"><button type="button" onClick={handleBack} className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-gray-400">{"←"} Back</button></div>
          <div className="flex justify-center"><button type="button" onClick={handleEmailSubmit} className="rounded-xl bg-green-700 px-8 py-4 text-base font-extrabold text-white shadow-md hover:bg-green-800 md:px-10 md:text-lg">Submit & get 30% off {"\u{1F381}"}</button></div>
          <div className="flex justify-end"><button type="button" onClick={handleEmailSkip} className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-gray-400">Skip {"→"} 20% off</button></div>
        </div>
      ) : (
        <div className="mt-7 flex items-center justify-between gap-3">
          <button type="button" onClick={handleBack} disabled={step === 1} className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-gray-400 disabled:opacity-40">{"←"} Back</button>
          <button type="button" onClick={handleContinue} className="rounded-xl bg-green-700 px-7 py-3 text-base font-extrabold text-white shadow-sm hover:bg-green-800">{submitLabel}</button>
        </div>
      )}
    </main>
  );
}
