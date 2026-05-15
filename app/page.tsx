import Header from "@/components/Header";
import WheelSection from "@/components/WheelSection";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <WheelSection />
      <Footer />
    </div>
  );
}
