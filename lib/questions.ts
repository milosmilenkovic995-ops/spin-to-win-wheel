// Shared survey definition — imported by both the survey UI and the admin dashboard.
// Edit ONLY this file to add/remove/reorder questions or answer options.

export type MCAnswer = { id: string; label: string };
export type QuestionType = "multi" | "single" | "text";
export type Question = {
  id: string;
  title: string;
  type: QuestionType;
  answers?: MCAnswer[];
};

export const COUPON_CODE = "THANKYOU20";
export const COUPON_LABEL = "20% OFF";

export const questions: Question[] = [
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
      { id: "customer_service", label: "Customer service" },
      { id: "speed", label: "Website speed / loading times" },
      { id: "info", label: "Product information and descriptions" },
      { id: "other", label: "Other (please specify)" },
    ],
  },
  {
    id: "q2",
    title: "Which of these have made browsing our website harder for you?",
    type: "multi",
    answers: [
      { id: "slow", label: "Slow loading times" },
      { id: "navigate", label: "Hard to navigate between pages" },
      { id: "menu", label: "Confusing menu structure" },
      { id: "search", label: "Search results aren't helpful" },
      { id: "mobile", label: "Poor mobile experience" },
      { id: "popups", label: "Distracting pop-ups or banners" },
      { id: "media", label: "Images or videos don't load properly" },
      { id: "crash", label: "Site crashes or shows errors" },
      { id: "nothing", label: "Nothing — it works well for me" },
      { id: "other", label: "Other (please specify)" },
    ],
  },
  {
    id: "q3",
    title: "What's missing or unclear on our product pages?",
    type: "multi",
    answers: [
      { id: "real_use_photos", label: "Photos of the product in real use" },
      { id: "short_desc", label: "A shorter, benefit-focused description as an alternative to the long one" },
      { id: "shipping_upfront", label: "Upfront shipping cost and delivery time" },
      { id: "stock", label: "Clear stock availability" },
      { id: "compare", label: "Easier way to compare products" },
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
