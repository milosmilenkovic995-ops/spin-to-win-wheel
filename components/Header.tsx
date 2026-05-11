export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="bg-[#efefef] px-4 py-2 text-[12px] text-gray-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
          <span>📦 Free shipping for orders within the contiguous US over $75</span>
          <span>🕘 Mon–Fri 9AM–5:30PM EST</span>
          <span>📞 (888) 963-6637</span>
          <span className="flex items-center gap-2 font-semibold text-green-700">
            <span className="text-gray-700">6298</span>
            <span className="text-yellow-400">★ ★ ★ ★ ★</span>
            <span>REVIEWS</span>
          </span>
        </div>
      </div>

      <div
        className="px-4 py-2 text-center text-sm font-bold text-white"
        style={{ backgroundColor: "#208b47" }}
      >
        Be Sure to Check Out All of Our Specials!
      </div>

      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-5">
          <a href="https://www.znaturalfoods.com/">
  <img
    src="/images/logo.png"
    alt="Z Natural Foods"
    className="h-9 w-auto object-contain"
  />
</a>

          <nav className="flex flex-wrap items-center gap-7 text-[15px] font-medium text-gray-900">
            <a href="https://www.znaturalfoods.com/collections/all">Categories</a>
            <a href="https://www.znaturalfoods.com/pages/health-concerns">Health Concerns</a>
            <a
              href="https://www.znaturalfoods.com/specials"
              className="font-bold text-green-700"
            >
              🔥 Specials
            </a>
            <a href="https://www.znaturalfoods.com/blogs/articles">Articles</a>
            <a href="https://www.znaturalfoods.com/pages/bulk">Bulk</a>
            <a href="https://www.znaturalfoods.com/pages/about-us">About</a>
          </nav>

          <a
            href="https://www.znaturalfoods.com/"
            className="rounded-lg border border-gray-300 bg-white px-8 py-2 text-sm text-gray-400"
          >
            🔍︎ Search
          </a>
        </div>
      </div>
    </header>
  );
}