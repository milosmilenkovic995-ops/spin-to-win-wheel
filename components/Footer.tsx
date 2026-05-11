export default function Footer() {
  const colTitle = "mb-3 text-[15px] font-bold text-white";
  const link = "mb-1.5 block text-sm leading-6 text-gray-300";

  return (
    <footer className="mt-20 bg-slate-700 text-white">
      <div className="mx-auto max-w-7xl px-7 py-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div>
            <img
              src="/images/logo2.png"
              alt="Z Natural Foods"
              className="mb-4 h-10 w-auto object-contain"
            />
            <p className="max-w-xs text-sm leading-7 text-gray-300">
              Z Natural Foods is dedicated to bringing you the finest quality in
              hard-to-find whole, all natural and organic foods.
            </p>
          </div>

          <div>
            <div className={colTitle}>CATALOG</div>
            <a href="https://www.znaturalfoods.com/collections/all-products" className={link}>
              All Products
            </a>
            <a href="https://www.znaturalfoods.com/pages/bulk" className={link}>
              Wholesale, Bulk & Custom Blends
            </a>
            <a href="https://www.znaturalfoods.com/specials" className={link}>
              Specials
            </a>
            <a href="https://www.znaturalfoods.com/collections/new-products" className={link}>
              New Products
            </a>
            <a href="https://www.znaturalfoods.com/pages/reviews" className={link}>
              Reviews
            </a>
          </div>

          <div>
            <div className={colTitle}>MY ACCOUNT</div>
            <a href="https://www.znaturalfoods.com/account/register" className={link}>
              Register
            </a>
            <a href="https://www.znaturalfoods.com/account/addresses" className={link}>
              My Address
            </a>
            <a href="https://www.znaturalfoods.com/account" className={link}>
              Order History
            </a>
            <a href="https://www.znaturalfoods.com/account" className={link}>
              Recurring Deliveries
            </a>
            <a href="https://www.znaturalfoods.com/pages/join-rewards-program" className={link}>
              Rewards Program
            </a>
          </div>

          <div>
            <div className={colTitle}>INFORMATION</div>
            <a href="https://www.znaturalfoods.com/pages/about-us" className={link}>
              About Us
            </a>
            <a href="https://www.znaturalfoods.com/pages/contact-us" className={link}>
              Contact Us
            </a>
            <a href="https://www.znaturalfoods.com/pages/faqs" className={link}>
              FAQs
            </a>
            <a href="https://www.znaturalfoods.com/pages/legal#tab-11" className={link}>
              Shipping
            </a>
            <a href="https://www.znaturalfoods.com/blogs/articles" className={link}>
              News & Media
            </a>
            <a href="https://www.znaturalfoods.com/pages/vendors" className={link}>
              Vendors
            </a>
          </div>

          <div>
            <div className={colTitle}>POLICIES</div>
            <a href="https://www.znaturalfoods.com/pages/legal#tab-1" className={link}>
              Privacy Policy
            </a>
            <a href="https://www.znaturalfoods.com/pages/legal#tab-9" className={link}>
              California Prop65
            </a>
            <a href="https://www.znaturalfoods.com/pages/legal#tab-6" className={link}>
              Legal Notice Disclaimer
            </a>
            <a href="https://www.znaturalfoods.com/pages/legal#tab-1" className={link}>
              Terms of Use
            </a>
            <a href="https://www.znaturalfoods.com/pages/legal#tab-5" className={link}>
              Your Privacy Choices
            </a>
            <a href="https://www.znaturalfoods.com/pages/legal#tab-8" className={link}>
              Accessibility
            </a>
          </div>
        </div>

        <div className="mt-9 border-t border-white/20 pt-4 text-[13px] leading-6 text-gray-300">
          * Disclaimer: Comments, reviews, testimonials, ratings, and social media posts reflect
          individual customer experiences and opinions only. They do not constitute guarantees,
          typical results, medical claims, or representations that any person will achieve the same
          outcome.
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 text-sm text-gray-300">
          <div>Copyright © 2026, Z Natural Foods, LLC. | ® All Rights Reserved.</div>
          <div>
            <img
              src="/images/payment-logos.png"
              alt="Payment methods"
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}