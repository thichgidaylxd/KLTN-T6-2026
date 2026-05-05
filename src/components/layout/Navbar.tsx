import { useEffect, useState } from "react";
import { ChevronDownIcon, ArrowUpRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../hooks/auth/useAuth";
import { Button } from "../ui/button";
import { NavbarDivider } from "./NavbarDivider";
import LogoBrowser from "../../assets/Logo-browser.png";
import CornBackground from "../../assets/Corn-Background.png";
import { getRoleDisplayName } from "../../utils/roleUtils";

const navItems = ["Trang Chủ", "Dịch vụ", "Tin tức", "Triển khai", "Kế Hoạch"];

export type NavbarVariant =
  | "default"
  | "auth"
  | "register"
  | "dashboard"
  | "minimal";

interface NavbarVariantConfig {
  showLoginButton: boolean;
  showCreateButton: boolean;
  showDivider: boolean;
  showNavBackground: boolean;
  backgroundImage: string;
}

const variantConfig: Record<NavbarVariant, NavbarVariantConfig> = {
  default: {
    showLoginButton: true,
    showCreateButton: true,
    showDivider: true,
    showNavBackground: false,
    backgroundImage: CornBackground,
  },
  auth: {
    showLoginButton: false,
    showCreateButton: true,
    showDivider: false,
    showNavBackground: false,
    backgroundImage: "",
  },
  register: {
    showLoginButton: true,
    showCreateButton: false,
    showDivider: false,
    showNavBackground: false,
    backgroundImage: "",
  },
  dashboard: {
    showLoginButton: false,
    showCreateButton: false,
    showDivider: false,
    showNavBackground: false,
    backgroundImage: "",
  },
  minimal: {
    showLoginButton: false,
    showCreateButton: false,
    showDivider: false,
    showNavBackground: false,
    backgroundImage: "",
  },
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface NavbarProps {
  variant?: NavbarVariant;
  /** Override background image cho variant "default" nếu muốn */
  backgroundImage?: string;
}

// ─── Animation ───────────────────────────────────────────────────────────────

const spinStyle = `
  @keyframes logoSpin {
    0%   { transform: rotate(0deg) scale(0.8); opacity: 0; }
    30%  { opacity: 1; }
    100% { transform: rotate(720deg) scale(1); opacity: 1; }
  }
`;

// ─── Functional Component ────────────────────────────────────────────────────

export function Navbar({
  variant = "default",
  backgroundImage: backgroundImageOverride,
}: NavbarProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Get auth state from hook
  const { isAuthenticated, user, logout } = useAuth();

  const config = variantConfig[variant];
  const { showLoginButton, showCreateButton, showDivider, showNavBackground } =
    config;
  const backgroundImage = backgroundImageOverride ?? config.backgroundImage;

  useEffect(() => {
    // Reset mount animation
    const t = setTimeout(() => setMounted(true), 100);

    // Reset scroll state when component mounts
    setScrolled(false);
    setScrollY(0);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setScrollY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    // Clear auth state
    logout();

    // Show success message
    toast.success("Đã đăng xuất thành công");

    // Redirect to login page
    navigate("/login", { replace: true });
  };

  const roleDisplay = getRoleDisplayName(user?.role);

  return (
    <>
      <style>{spinStyle}</style>
      <nav
        className={`fixed top-0 left-0 w-full transition-all duration-500 ${
          scrolled ? "z-[100] backdrop-blur-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)]" : "z-[100]"
        }`}
        style={{
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.9)" : "transparent",
          backgroundImage:
            scrolled || !showNavBackground ? "none" : `url(${backgroundImage})`,
          backgroundPosition:
            !scrolled && showNavBackground ? `0 ${-scrollY}px` : undefined,
        }}
        aria-label="Main navigation"
      >
        {/* Nav content */}
        <div
          className={`relative w-full flex flex-row items-center justify-around px-2 lg:px-4 transition-all duration-500 ${scrolled ? "h-[60px]" : "h-[80px]"
            }`}
        >
          {/* Logo */}
          <div className="flex-1 flex items-center justify-start">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
              className={`flex items-center gap-1 shrink-0 transition-all duration-[700ms] ease-out
                ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
            >
              <img
                src={LogoBrowser}
                alt="FarmerAI corn logo"
                className={`object-contain transition-all duration-500 ease-out w-auto shrink-0
                  ${scrolled ? "h-[32px]" : "h-[50px]"}
                  ${mounted ? "animate-logo-spin" : ""}`}
                style={{
                  animation: mounted
                    ? "logoSpin 1s ease-in-out 0.1s 1 forwards"
                    : "none",
                }}
              />
              <span
                className={`font-prompt font-extrabold leading-none transition-all duration-500 ${scrolled ? "text-[28px]" : "text-[38px]"
                  } ${scrolled ? "text-[#1F4418]" : "text-light-yellow-2"}`}
              >
                FarmerAI
              </span>
            </a>
          </div>

          {/* Nav Links */}
          <div className="flex-none flex items-center gap-[40px] xl:gap-[60px]">
            {navItems.map((item, i) => {
              const handleClick = (e: React.MouseEvent) => {
                e.preventDefault();
                if (item === "Trang Chủ") {
                  navigate("/");
                } else if (item === "Dịch vụ") {
                  const el = document.getElementById("section-3");
                  el?.scrollIntoView({ behavior: "smooth" });
                } else if (item === "Tin tức") {
                  // TODO: navigate to news page when available
                  console.log("Tin tức clicked");
                } else if (item === "Triển khai") {
                  navigate("/dashboard");
                } else if (item === "Kế Hoạch") {
                  // TODO: navigate to season plans when available
                  console.log("Kế Hoạch clicked");
                }
              };

              return (
                <a
                  key={item}
                  href="#"
                  onClick={handleClick}
                  className={`flex items-center gap-1.5 group transition-all duration-[600ms] ease-out
                    ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}
                  style={{
                    transitionDelay: mounted ? `${150 + i * 80}ms` : "0ms",
                  }}
                >
                  <span
                    className={`font-roboto text-[16px] whitespace-nowrap font-medium transition-all duration-500 ${scrolled
                      ? "text-[#1F4418] group-hover:text-green-800"
                      : "text-light-yellow-1 group-hover:text-white"
                      }`}
                  >
                    {item}
                  </span>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-all duration-500 ${scrolled
                      ? "text-[#1F4418] group-hover:text-green-800"
                      : "text-light-yellow-1 group-hover:text-white"
                      }`}
                  />
                </a>
              );
            })}
          </div>

          {/* Buttons */}
          <div
            className={`flex-1 flex items-center justify-end gap-2.5 shrink-0 transition-all duration-[700ms] ease-out delay-[600ms]
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            {variant === "dashboard" && isAuthenticated ? (
              <>
                <div
                  className={`flex flex-col gap-0.5 h-12 px-4 py-1.5 rounded-xl border ${scrolled
                    ? "border-gray-300 bg-gray-50"
                    : "border-light-yellow-1 bg-white/5"
                    }`}
                >
                  <span
                    className={`font-roboto text-[13px] font-semibold leading-tight ${scrolled ? "text-gray-800" : "text-light-yellow-1"
                      }`}
                  >
                    {user?.fullName || roleDisplay}
                  </span>
                  <span
                    className={`font-roboto text-[11px] font-normal leading-tight ${scrolled ? "text-gray-600" : "text-light-yellow-1/80"
                      }`}
                  >
                    {roleDisplay}
                  </span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant={scrolled ? "outline-dark" : "outline-yellow"}
                  size="md"
                  className="rounded-xl"
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                {showLoginButton && (
                  <Button
                    onClick={() => navigate("/login")}
                    variant={scrolled ? "outline-dark" : "outline-yellow"}
                    className="flex items-center justify-center gap-1.5 h-[42px] px-6 rounded-xl font-roboto font-bold text-[14px] transition-all duration-300"
                  >
                    {variant === "register" ? "Đăng Nhập Ngay" : "Đăng nhập"}
                    <ArrowUpRightIcon className="w-4 h-4 flex-shrink-0" />
                  </Button>
                )}
                {showCreateButton && (
                  <Button
                    onClick={() => navigate("/register")}
                    variant="cta-yellow"
                    className="flex items-center justify-center gap-1.5 h-[42px] px-6 rounded-xl font-roboto font-bold text-[14px] transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Tạo Tài Khoản
                    <ArrowUpRightIcon className="w-4 h-4 flex-shrink-0" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Divider khi chưa scroll */}
        {showDivider && <NavbarDivider mounted={mounted} scrolled={scrolled} />}

        {/* Divider khi đã scroll */}
        {scrolled && <div className="w-full h-px bg-gray-200" />}
      </nav>
    </>
  );
}
export default Navbar;