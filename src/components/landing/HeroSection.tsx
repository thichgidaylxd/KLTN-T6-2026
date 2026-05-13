import React from "react";
import { ArrowUpRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { PlantDivider } from "./PlantDivider";
import { NavbarDivider } from "@/components/layout/NavbarDivider";

import Water from "@/assets/Water.png";
import paddyintro from "@/assets/paddy-intro.png";
import LogoIntro from "@/assets/Logo-intro.png";

// HOC to inject navigation and auth state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withNavigationAndAuth = (Component: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    return <Component {...props} navigate={navigate} isAuthenticated={isAuthenticated} />;
  };
};

interface HeroSectionProps {
  navigate: (path: string) => void;
  isAuthenticated: boolean;
}

interface HeroSectionState {
  heroMounted: boolean;
}

class HeroSection extends React.Component<HeroSectionProps, HeroSectionState> {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: HeroSectionProps) {
    super(props);
    this.state = {
      heroMounted: false,
    };
  }

  componentDidMount() {
    // Trigger entrance animations after mount
    this.timeoutId = setTimeout(() => {
      this.setState({ heroMounted: true });
    }, 50);
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  render() {
    const { heroMounted } = this.state;
    const { navigate, isAuthenticated } = this.props;

    const handleCTAClick = () => {
      if (isAuthenticated) {
        navigate("/farms");
      } else {
        navigate("/register");
      }
    };

    return (
      <section className="relative w-full min-h-[calc(100vh)] pb-0">
        {/* Content Layer */}
        <div className="relative z-10 max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8">
          <div className="relative w-full h-full">
            {/* Main Hero Text Block */}
            <div className="absolute left-4 lg:left-[93px] top-[144px]">
              <div className="flex items-start">
                {/* "AI" text */}
                <div className="relative">
                  <span
                    className={`font-playfair text-[120px] md:text-[220px] font-semibold leading-none text-light-yellow-2 block mr-[15px] md:mr-[30px] mt-[40px]
                        transition-all duration-[900ms] ease-out delay-[0ms]
                        ${heroMounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-16"}`}
                  >
                    AI
                  </span>
                  {/* Water drop */}
                  <img
                    src={Water}
                    alt="Water drop"
                    className={`absolute top-[8px] left-[80px] md:left-[159px] w-[25px] md:w-[41px] h-[40px] md:h-[60px] object-contain
                      transition-all duration-[700ms] ease-out delay-[50ms]
                      ${heroMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}
                  />
                </div>

                {/* Plant Divider replacing the vertical line */}
                <PlantDivider mounted={heroMounted} />

                {/* MÙA VỤ / KHỞI SẮC */}
                <div className="mt-[30px] md:mt-[67px] ml-[20px] md:ml-[40px] overflow-hidden">
                  <h1
                    className={`font-playfair text-[40px] md:text-[78px] font-semibold leading-none text-light-yellow-3
                        transition-all duration-[800ms] ease-out delay-[0ms]
                        ${heroMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  >
                    MÙA VỤ
                  </h1>
                  <h1
                    className={`font-playfair text-[40px] md:text-[78px] font-semibold leading-none text-light-yellow-3 mt-3 md:mt-6
                        transition-all duration-[800ms] ease-out delay-[0ms]
                        ${heroMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  >
                    KHỞI SẮC
                  </h1>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleCTAClick}
              variant="cta-yellow"
              size="lg"
              className={`absolute left-4 lg:left-[93px] top-[480px] md:top-[540px] w-full max-w-[268px] h-[64px] rounded-2xl group
                  transition-[opacity,transform] duration-[700ms] ease-out delay-[0ms]
                  ${heroMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              Tạo mùa vụ ngay
              <ArrowUpRightIcon className="w-6 h-6 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </Button>

            {/* Seedling — mọc từ button lên */}
            <img
              src={paddyintro}
              alt="Seedling"
              className="absolute left-[200px] md:left-[307px] top-[440px] md:top-[495px] w-12 h-12"
              style={{
                transformOrigin: "bottom center",
                transform: heroMounted
                  ? "scaleY(1) translateY(0)"
                  : "scaleY(0) translateY(100%)",
                opacity: heroMounted ? 1 : 0,
                transition:
                  "transform 0.8s ease-out 0s, opacity 0.4s ease-out 0.1s",
                zIndex: -1,
              }}
            />

            {/* Glassmorphism Card */}
            <div
              className={`absolute right-4 lg:right-[121px] top-[150px] w-[280px] md:w-[323px] h-[400px] md:h-[451px] rounded-[40px] overflow-hidden backdrop-blur-[8px] hidden lg:block
                  transition-all duration-[1000ms] ease-out delay-[0ms]
                  ${heroMounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-16"}`}
              style={{
                background:
                  "linear-gradient(0deg, rgba(236, 240, 164, 0.4) 0%, rgba(220, 218, 173, 0.4) 100%)",
              }}
            >
              <img
                src={LogoIntro}
                alt="Corn close-up"
                className="absolute left-1/2 -translate-x-1/2 top-[47px] w-[200px] md:w-[249px] h-auto object-cover"
              />
              <div className="absolute left-[35px] top-[280px] md:top-[305px] w-[210px] md:w-[254px] h-px bg-white/40" />
              <p className="absolute left-1/2 -translate-x-1/2 top-[300px] md:top-[319px] w-[203px] font-playfair text-[30px] md:text-[40px] font-normal leading-[1.2] text-center text-light-yellow-3">
                Nông dân vươn mình
              </p>
            </div>
          </div>
        </div>

        {/* Divider line at bottom */}
        <div className="absolute left-0 top-[710px] w-full">
          <NavbarDivider mounted={heroMounted} />
        </div>
      </section>
    );
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export default withNavigationAndAuth(HeroSection);
