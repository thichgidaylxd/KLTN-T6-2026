import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRightIcon, LeafIcon, BarChart2Icon } from "lucide-react";
import { useReveal } from "@/hooks/reveal/useReveal";
import { Button } from "@/components/ui/button";
import CornIntro from "@/assets/Corn-intro.png";

const IntroSection = forwardRef<HTMLDivElement, {}>((_, ref) => {
  const navigate = useNavigate();
  const { ref: revealRef, visible } = useReveal<HTMLDivElement>();

  return (
    <section
      ref={ref}
      id="section-2"
      className="relative w-full bg-[#F5F0E8] pt-[160px] pb-[100px] px-[93px]"
    >
      <div ref={revealRef} className="flex items-start gap-16">
        {/* Left: Text */}
        <div
          className={`flex-1 max-w-[520px] transition-all duration-[800ms] ease-out
              ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <LeafIcon className="w-5 h-5 text-green-600" />
            <span className="font-roboto text-[14px] font-semibold text-green-600 uppercase tracking-widest">
              Giới Thiệu
            </span>
          </div>
          <h2 className="font-playfair text-[44px] font-semibold leading-[1.15] text-[#2D3A1E] mb-6">
            Gico trồng giá trị – Gặt hái thành công trên mọi cánh đồng.
          </h2>
          <p className="font-roboto text-[15px] text-[#5A6045] leading-relaxed mb-8">
            FarmerAI sử dụng AI để phân tích cây trồng, phát hiện bệnh và đưa ra giải pháp
            chăm sóc tối ưu. Giúp nông dân trồng đúng – chăm đúng – thu hoạch hiệu quả.
          </p>
          <Button
            variant="cta-yellow"
            size="md"
            onClick={() => navigate("/dashboard")}
          >
            Tạo mùa vụ ngay <ArrowUpRightIcon className="w-5 h-5" />
          </Button>

          <div className="flex gap-4 mt-10">
            {[
              {
                bg: "bg-green-100",
                iconColor: "text-green-600",
                Icon: LeafIcon,
                label: "Quản lý mùa vụ thông minh",
              },
              {
                bg: "bg-yellow-100",
                iconColor: "text-yellow-600",
                Icon: BarChart2Icon,
                label: "Giám sát và báo cáo hiệu quả",
              },
            ].map(({ bg, iconColor, Icon, label }, i) => (
              <div
                key={i}
                className={`flex-1 bg-white rounded-2xl p-5 shadow-sm border border-[#E8E0D0]
                    transition-all duration-[600ms] ease-out
                    ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: "0ms" }}
              >
                <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <p className="font-roboto text-[14px] font-semibold text-[#2D3A1E]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: empty space — ảnh sẽ absolute ở ngoài div flex */}
        <div className="flex-1" />
      </div>

      {/* Corn Intro Image — positioned exactly like HeroSection */}
      <img
  src={CornIntro}
  alt="Corn"
  className="absolute pointer-events-none z-20"
  style={{
    top: "-320px",
    bottom: "-5%",
    left: "493px",
    width: "313px",
    height: "359px",
    objectFit: "cover",
    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.25))",

    // ✅ FIX: bỏ delay + đồng bộ duration
    transition: "opacity 0.6s ease-out, transform 0.6s ease-out",

    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
  }}
/>
 
    </section>
  );
});

IntroSection.displayName = "IntroSection";
export default IntroSection;