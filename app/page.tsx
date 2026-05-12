import Header from "@/components/Header";
import MiddleSection from "@/components/MiddleSection";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <MiddleSection
        title="Help us serve you better"
        subtitle="Your feedback helps us improve the website and make your experience better. The survey takes about 60 seconds to complete. As a thank-you, you'll get a 20% off discount code at the end 🎁"
      />
      <Footer />
    </div>
  );
}
