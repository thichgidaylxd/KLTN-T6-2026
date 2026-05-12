import { useState, useRef, useEffect } from "react";
import {
  Home,
  BarChart3,
  History,
  Map as MapIcon,
  Grid3X3,
  Users,
  CreditCard,
  Trees,
  Zap,
  Wallet,
  GitFork,
  Sparkles,
  Warehouse,
  Truck,
  Tag,
  Sprout,
  Settings,
  LogOut,
  Key,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/auth/useAuth";
import { useFarms } from "../../hooks/farms/useFarms";
import { ConfirmModal } from "../ui/ConfirmModal";

interface SidebarProps {
  active: string;
  setActive: (key: string) => void;
  variant?: "compact" | "wide";
}

const NAV_GROUPS = [
  {
    title: "Tổng quan",
    items: [
      { key: "dashboard", label: "Bảng điều khiển", icon: Home },
      { key: "tree", label: "Trang trại của tôi", icon: Trees, roles: ["owner", "admin", "manager", "employee"] },
      { key: "metrics", label: "Theo dõi chỉ số", icon: BarChart3, roles: ["owner", "admin"] },
    ],
  },
  {
    title: "Tiện ích",
    items: [
      { key: "wallet", label: "Ví & Thanh toán", icon: Wallet, roles: ["owner", "admin"] },
      { key: "activity", label: "Hoạt động", icon: History, roles: ["owner", "admin"] },
      { key: "task", label: "Nhiệm vụ", icon: GitFork, roles: ["owner", "admin", "employee"] },
      { key: "gemini", label: "Trợ lý AI", icon: Sparkles, roles: ["owner", "admin"] },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { key: "map", label: "Bản đồ nông trại", icon: MapIcon, roles: ["owner", "admin"] },
      { key: "land-plots", label: "Lô đất & Cây trồng", icon: Grid3X3, roles: ["owner", "admin"] },
      { key: "crop-catalog", label: "Danh mục cây trồng", icon: Sprout, roles: ["owner", "admin"] },
      { key: "season-plans", label: "Kế hoạch mùa vụ", icon: Zap, roles: ["owner", "manager", "admin"] },
      { key: "warehouses", label: "Kho hàng", icon: Warehouse, roles: ["owner", "manager", "admin"] },
      { key: "suppliers", label: "Nhà cung cấp", icon: Truck, roles: ["owner", "manager", "admin"] },
      { key: "skus", label: "Mã SKU", icon: Tag, roles: ["owner", "manager", "admin"] },
      { key: "members", label: "Thành viên", icon: Users, roles: ["owner", "admin"] },
    ],
  },
];

const FOOTER_ITEMS = [
  {
    title: "Hệ thống",
    items: [
      { key: "subscription", label: "Gói cước & Dịch vụ", icon: CreditCard, roles: ["owner"] },
      { key: "config", label: "Cấu hình", icon: Settings, roles: ["owner", "admin", "manager", "employee"] },
    ],
  },
];

const COLLAPSED_KEY = "sidebar_collapsed";

export default function Sidebar({
  active,
  setActive,
  variant = "compact",
}: SidebarProps) {
  const { user, currentFarmId, logout } = useAuth();
  const { farmSummary, farms } = useFarms();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // ── Collapse state (persisted) ──────────────────────────────────────────
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const currentFarm = currentFarmId
    ? farms.find((f: any) => f.id === currentFarmId) ||
      farmSummary.find((f: any) => f.farmId === currentFarmId)
    : null;

  const myFarmRole = currentFarm
    ? (currentFarm as any).myRole?.toLowerCase() === "worker"
      ? "employee"
      : (currentFarm as any).myRole?.toLowerCase()
    : null;

  const effectiveRole = currentFarmId && myFarmRole ? myFarmRole : user?.role;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const canScroll = scrollHeight > clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollHint(canScroll && !isAtBottom);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [effectiveRole, currentFarmId, active, collapsed]);

  const filterItem = (item: { key: string; roles?: string[] }) => {
    if (!currentFarmId) {
      return ["dashboard", "tree", "wallet", "gemini"].includes(item.key);
    }
    if (!item.roles) return true;
    if (!effectiveRole) return false;
    return item.roles.includes(effectiveRole);
  };

  const handleLogout = () => {
    setIsSettingsOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleChangePassword = () => {
    setActive("change-password");
    setIsSettingsOpen(false);
  };

  // ── Tooltip for collapsed mode ─────────────────────────────────────────
  const NavItem = ({
    itemKey,
    label,
    icon: Icon,
  }: {
    itemKey: string;
    label: string;
    icon: React.ElementType;
  }) => {
    const isActive = active === itemKey;
    return (
      <div className="relative group/item">
        <button
          onClick={() => setActive(itemKey)}
          className={cn(
            "flex items-center gap-3 w-full rounded-full text-sm font-semibold transition-all duration-200",
            collapsed ? "px-2.5 py-2 justify-center" : "px-4 py-1.5",
            isActive
              ? "bg-emerald-50 text-emerald-700 shadow-sm"
              : "text-slate-600 hover:bg-emerald-50/40 hover:text-emerald-700"
          )}
        >
          <Icon size={16} className="shrink-0 text-emerald-600" />
          {!collapsed && <span className="truncate">{label}</span>}
        </button>

        {/* Tooltip khi collapsed */}
        {collapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        )}
      </div>
    );
  };

  /* ── COMPACT variant (không có toggle, dùng compact layout cũ) ── */
  if (variant === "compact") {
    const allNavItems = NAV_GROUPS.flatMap((g) => g.items).filter(filterItem);
    const allFooterItems = FOOTER_ITEMS.flatMap((g) => g.items).filter(filterItem);

    return (
      <>
        <aside className="flex flex-col items-center h-full w-16 bg-white shrink-0 rounded-3xl shadow-sm border border-slate-100 py-6 px-2 relative">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex flex-col items-center gap-2 w-full flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4"
          >
            {allNavItems.map((item) => (
              <Button
                key={item.key}
                onClick={() => setActive(item.key)}
                variant="ghost"
                size="icon"
                className={cn(
                  "w-10 h-10 rounded-xl transition-all duration-200 shrink-0",
                  active === item.key
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-emerald-50/40"
                )}
              >
                <item.icon size={20} className="text-emerald-600" />
              </Button>
            ))}

            {allFooterItems.length > 0 && (
              <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-slate-100 mt-2 shrink-0">
                {allFooterItems.map((item) => (
                  <Button
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all duration-200 shrink-0",
                      active === item.key
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-emerald-50/40 hover:text-emerald-700"
                    )}
                  >
                    <item.icon size={20} className="text-emerald-600" />
                  </Button>
                ))}
              </div>
            )}
          </div>
          {/* Scroll Hint — Compact */}
          {showScrollHint && (
            <div className="absolute bottom-16 left-[90px] animate-bounce text-emerald-600 pointer-events-none drop-shadow-md">
              <ChevronDown size={22} strokeWidth={3.5} />
            </div>
          )}

          {/* Settings popup — Compact (Dashboard only) */}
          {!currentFarmId && active === "dashboard" && (
            <div className="w-full flex flex-col items-center pt-2 border-t border-slate-100 mt-2 shrink-0 relative">
              <Button
                onClick={() => setIsSettingsOpen((p) => !p)}
                variant="ghost"
                size="icon"
                className={cn(
                  "w-10 h-10 rounded-xl transition-all duration-200",
                  isSettingsOpen ? "bg-slate-100 text-slate-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Settings size={20} className="text-slate-400" />
              </Button>

              {isSettingsOpen && (
                <div className="absolute bottom-full mb-2 left-12 w-48 rounded-2xl border border-slate-200 bg-white shadow-xl p-1.5 z-50">
                  <button
                    onClick={handleChangePassword}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Key size={15} className="text-slate-400" />
                    Đổi mật khẩu
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        <ConfirmModal
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={() => { logout(); setIsLogoutConfirmOpen(false); }}
          title="Xác nhận đăng xuất"
          message="Bạn có chắc chắn muốn thoát khỏi phiên làm việc hiện tại?"
          confirmLabel="Đăng xuất ngay"
          cancelLabel="Quay lại"
          type="danger"
        />
      </>
    );
  }

  /* ── WIDE variant với toggle collapse ── */
  const sidebarWidth = collapsed ? "w-[60px]" : "w-[260px]";

  return (
    <>
      <aside
        className={cn(
          "flex flex-col h-full bg-white shrink-0 rounded-[32px] border border-slate-100 shadow-sm relative transition-all duration-300 ease-in-out overflow-hidden",
          sidebarWidth
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 pt-5 pb-3 shrink-0",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
            <Trees size={16} className="text-emerald-600" />
          </div>
          {!collapsed && (
            <p className="text-sm font-semibold text-slate-900 truncate">
              {currentFarm
                ? (currentFarm as any).farmName || (currentFarm as any).name
                : "Trang Trại"}
            </p>
          )}
        </div>

        {/* Toggle button */}
        <div className={cn("px-3 pb-1 shrink-0", collapsed && "px-2 flex justify-center")}>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            className={cn(
              "flex items-center gap-2 rounded-full text-[11px] font-bold text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200",
              collapsed ? "p-2 justify-center w-full" : "px-4 py-1.5 w-full"
            )}
          >
            {collapsed
              ? <PanelLeftOpen size={15} className="shrink-0" />
              : (
                <>
                  <PanelLeftClose size={15} className="shrink-0" />
                  <span className="uppercase tracking-widest">Thu gọn</span>
                </>
              )
            }
          </button>
        </div>

        {/* Main scrollable content */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative"
        >
          <nav className={cn("flex flex-col gap-1 py-1", collapsed ? "px-2" : "px-3")}>
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter(filterItem);
              if (!visibleItems.length) return null;
              return (
                <div key={group.title} className="flex flex-col gap-0">
                  {!collapsed && (
                    <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-70">
                      {group.title}
                    </p>
                  )}
                  {collapsed && (
                    <div className="h-px bg-slate-100 my-1.5 mx-1" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    {visibleItems.map((item) => (
                      <NavItem
                        key={item.key}
                        itemKey={item.key}
                        label={item.label}
                        icon={item.icon}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className={cn("pt-1 pb-10 flex flex-col gap-1 shrink-0", collapsed ? "px-2" : "px-3")}>
            <div className="h-px bg-slate-100 mx-3 my-2" />
            {FOOTER_ITEMS.map((group) => {
              const visibleItems = group.items.filter(filterItem);
              if (!visibleItems.length) return null;
              return (
                <div key={group.title} className="flex flex-col gap-0">
                  {!collapsed && (
                    <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-70">
                      {group.title}
                    </p>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {visibleItems.map((item) => (
                      <NavItem
                        key={item.key}
                        itemKey={item.key}
                        label={item.label}
                        icon={item.icon}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Settings popup — wide only (Dashboard only) */}
            {!currentFarmId && active === "dashboard" && !collapsed && (
              <div className="relative mt-0">
                <button
                  onClick={() => setIsSettingsOpen((p) => !p)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150",
                    isSettingsOpen
                      ? "bg-slate-100 text-slate-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Settings size={15} className="shrink-0 text-slate-400" />
                  <span>Cài đặt</span>
                </button>

                {isSettingsOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-full rounded-2xl border border-slate-200 bg-white shadow-xl p-1.5 z-50">
                    <button
                      onClick={handleChangePassword}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Key size={15} className="text-slate-400" />
                      Đổi mật khẩu
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings icon only when collapsed */}
            {!currentFarmId && collapsed && (
              <NavItem
                itemKey="config"
                label="Cài đặt"
                icon={Settings}
              />
            )}
          </div>

          {/* Scroll Hint */}
          {showScrollHint && !collapsed && (
            <div className="sticky bottom-0 left-0 right-0 h-14 flex items-center pointer-events-none bg-gradient-to-t from-white via-white to-transparent z-20">
              <div className="animate-bounce text-emerald-600 mb-1 drop-shadow-md ml-[200px]">
                <ChevronDown size={24} strokeWidth={3.5} />
              </div>
            </div>
          )}
        </div>
      </aside>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => { logout(); setIsLogoutConfirmOpen(false); }}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn thoát khỏi phiên làm việc hiện tại?"
        confirmLabel="Đăng xuất ngay"
        cancelLabel="Quay lại"
        type="danger"
      />
    </>
  );
}