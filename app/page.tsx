import Header from "@/components/Header";
import MiddleSection from "@/components/MiddleSection";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <MiddleSection
        title="Help us serve you better"
        subtitle="Share a few quick thoughts about your shopping experience. As a thank-you for completing the survey, you'll get 20% off your next order 🎁"
      />
      <Footer />
    </div>
  );
}
